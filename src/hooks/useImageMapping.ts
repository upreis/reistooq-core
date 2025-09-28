import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageMap {
  nome: string;
  blob: Blob;
  linha: number;
  coluna: string;
  sku?: string;
}

interface ProcessedData {
  dados: any[];
  imagens: ImageMap[];
}

export function useImageMapping() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processExcelFile = useCallback(async (file: File): Promise<ProcessedData> => {
    try {
      setLoading(true);
      console.log('🚀 [NEW] Iniciando processamento:', file.name);

      // Importar dependências
      const [XLSX, JSZip] = await Promise.all([
        import('xlsx'),
        import('jszip').then(m => m.default)
      ]);

      // Ler dados da planilha
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Extrair dados em formato simples
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      console.log('📊 [NEW] Dados extraídos:', rawData.length, 'linhas');

      // Extrair imagens do ZIP
      const zip = new JSZip();
      const zipData = await zip.loadAsync(arrayBuffer);
      
      // Encontrar arquivos de imagem
      const imageFiles = Object.keys(zipData.files).filter(name => 
        name.startsWith('xl/media/') && 
        /\.(png|jpg|jpeg|gif|bmp|tiff)$/i.test(name)
      );

      console.log('📸 [NEW] Imagens encontradas:', imageFiles.length);
      
      // Processar imagens com mapeamento simples
      const imagens: ImageMap[] = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const fileName = imageFiles[i];
        const imageBlob = await zipData.files[fileName].async('blob');
        
        if (imageBlob.size > 0) {
          // Mapeamento simples: 2 imagens por linha de dados
          const linhaIndex = Math.floor(i / 2);
          const coluna = (i % 2 === 0) ? 'B' : 'C'; // B = IMAGEM, C = IMAGEM_FORNECEDOR
          
          const dataItem = rawData[linhaIndex] as any;
          const sku = dataItem?.SKU || dataItem?.sku || `PROD-${linhaIndex + 1}`;
          
          imagens.push({
            nome: `${sku}_${coluna}_${Date.now()}_${i}.${fileName.split('.').pop()}`,
            blob: imageBlob,
            linha: linhaIndex + 2, // +2 para linha Excel (cabeçalho + índice)
            coluna,
            sku
          });

          console.log(`📷 [NEW] Imagem ${i}: ${sku} - Coluna ${coluna} - Linha Excel ${linhaIndex + 2}`);
        }
      }

      console.log('✅ [NEW] Processamento concluído - Dados:', rawData.length, 'Imagens:', imagens.length);
      
      return {
        dados: rawData,
        imagens
      };

    } catch (error) {
      console.error('❌ [NEW] Erro no processamento:', error);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadImages = useCallback(async (
    imagens: ImageMap[], 
    cotacaoId: string, 
    organizationId: string
  ): Promise<{[key: string]: string}> => {
    try {
      console.log('☁️ [NEW] Iniciando upload de', imagens.length, 'imagens');
      const imageUrls: {[key: string]: string} = {};

      for (const imagem of imagens) {
        const filePath = `${organizationId}/${cotacaoId}/images/${imagem.nome}`;
        
        // Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('cotacoes-arquivos')
          .upload(filePath, imagem.blob);

        if (uploadError) {
          console.error('❌ [NEW] Erro no upload:', imagem.nome, uploadError);
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('cotacoes-arquivos')
          .getPublicUrl(filePath);

        // Criar chave única para mapeamento
        const key = `${imagem.sku}_${imagem.coluna}`;
        imageUrls[key] = urlData.publicUrl;
        
        console.log(`✅ [NEW] Upload concluído: ${key} -> ${urlData.publicUrl}`);
      }

      console.log('🔗 [NEW] URLs das imagens:', Object.keys(imageUrls));
      return imageUrls;

    } catch (error) {
      console.error('❌ [NEW] Erro no upload das imagens:', error);
      throw error;
    }
  }, []);

  const mapDataWithImages = useCallback((
    dados: any[], 
    imageUrls: {[key: string]: string}
  ): any[] => {
    console.log('🔗 [NEW] Mapeando dados com imagens...');
    
    return dados.map((item, index) => {
      const dataItem = item as any;
      const sku = dataItem?.SKU || dataItem?.sku || `PROD-${index + 1}`;
      
      // Buscar URLs das imagens para este SKU
      const imagemUrl = imageUrls[`${sku}_B`] || '';
      const imagemFornecedorUrl = imageUrls[`${sku}_C`] || '';
      
      const resultado = {
        ...dataItem,
        IMAGEM: imagemUrl,
        IMAGEM_FORNECEDOR: imagemFornecedorUrl,
        _linha_excel: index + 2,
        _sku_processado: sku
      };

      if (imagemUrl || imagemFornecedorUrl) {
        console.log(`🖼️ [NEW] SKU ${sku}: IMAGEM=${!!imagemUrl}, IMAGEM_FORNECEDOR=${!!imagemFornecedorUrl}`);
      }

      return resultado;
    });
  }, []);

  return {
    loading,
    processExcelFile,
    uploadImages,
    mapDataWithImages
  };
}