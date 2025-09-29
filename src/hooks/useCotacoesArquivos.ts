import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  validarEstruturaExcel, 
  mapearImagensPorSKU, 
  extrairSKUDoFilename,
  validarCorrespondenciaImagemSKU,
  adicionarCorrecaoPendente
} from './useCotacoesValidacoes';
import { useImagemSKUProcessor } from './useImagemSKUProcessor';

interface CotacaoArquivo {
  id?: string;
  cotacao_id: string;
  nome_arquivo: string;
  tipo_arquivo: 'excel' | 'csv';
  url_arquivo?: string;
  dados_processados?: any;
  status: 'pendente' | 'processado' | 'erro';
  total_linhas?: number;
  linhas_processadas?: number;
  linhas_erro?: number;
  detalhes_erro?: any[];
  created_at?: string;
  updated_at?: string;
}

export function useCotacoesArquivos() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const skuProcessor = useImagemSKUProcessor();

  const getArquivosCotacao = useCallback(async (cotacaoId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos da cotação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os arquivos da cotação",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadArquivo = useCallback(async (
    cotacaoId: string,
    file: File,
    organizationId: string
  ): Promise<CotacaoArquivo | null> => {
    try {
      setLoading(true);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${cotacaoId}_${timestamp}_${file.name}`;
      const filePath = `${organizationId}/${cotacaoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cotacoes-arquivos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('cotacoes-arquivos')
        .getPublicUrl(filePath);

      const arquivoData: Omit<CotacaoArquivo, 'id'> = {
        cotacao_id: cotacaoId,
        nome_arquivo: file.name,
        tipo_arquivo: file.name.endsWith('.csv') ? 'csv' as const : 'excel' as const,
        url_arquivo: urlData.publicUrl,
        status: 'pendente'
      };

      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .insert(arquivoData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso",
      });

      return data as CotacaoArquivo;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload do arquivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deletarArquivo = useCallback(async (arquivo: string | CotacaoArquivo, filePath?: string) => {
    try {
      setLoading(true);

      const arquivoId = typeof arquivo === 'string' ? arquivo : arquivo.id;
      if (!arquivoId) {
        throw new Error('ID do arquivo não encontrado');
      }

      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('cotacoes-arquivos')
          .remove([filePath]);

        if (deleteError) {
          console.error('Erro ao deletar arquivo do storage:', deleteError);
        }
      }

      const { error } = await supabase
        .from('cotacoes_arquivos')
        .delete()
        .eq('id', arquivoId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo deletado com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o arquivo",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadTemplate = useCallback((formato?: 'csv' | 'excel') => {
    const headers = [
      'SKU', 'PRODUTO', 'DESCRICAO', 'PRECO_UNITARIO', 'QUANTIDADE', 
      'PRECO_TOTAL', 'CATEGORIA', 'FORNECEDOR', 'OBSERVACOES',
      'MATERIAL', 'COR', 'PACKAGE', 'UNIT', 'PCS_CTN', 'CAIXAS'
    ];

    const csvContent = headers.join(',') + '\n' + 
      'EXEMPLO-001,Produto Exemplo,Descrição do produto,10.50,2,21.00,Categoria A,Fornecedor XYZ,Observações aqui,Plástico,Azul,Caixa,pc,12,5';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_cotacao.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const lerArquivoComImagens = useCallback(async (
    file: File
  ) => {
    try {
      console.log('🎯 [SKU_SYSTEM] Iniciando processamento completo com extração de imagens');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Verificar se é arquivo ZIP (com imagens) ou Excel simples
      let zip: any = null;
      let mediaFiles: string[] = [];
      
      try {
        const JSZip = (await import('jszip')).default;
        zip = await JSZip.loadAsync(arrayBuffer);
        mediaFiles = Object.keys(zip.files).filter(filename => 
          /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename) && !filename.startsWith('__MACOSX/')
        );
        console.log(`📁 [SKU_SYSTEM] Arquivo ZIP detectado: ${mediaFiles.length} imagens encontradas`);
      } catch (error) {
        console.log('📄 [SKU_SYSTEM] Arquivo Excel simples detectado (sem ZIP)');
      }
      
      // Processar dados do Excel
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      
      const dados: any[] = [];
      if (worksheet) {
        // CONSTRUIR MAPA SKU → LINHAS se houver imagens
        if (mediaFiles.length > 0) {
          console.log('🗺️ [SKU_SYSTEM] Construindo mapa SKU → Linhas para processamento de imagens');
          skuProcessor.construirMapaSkuLinhas(worksheet);
        }
        
        const headers: string[] = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || `Coluna${colNumber}`;
        });

        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const rowData: any = {};
          
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            dados.push(rowData);
          }
        }
      }
      
      console.log('✅ [SKU_SYSTEM] Dados do Excel extraídos:', dados.length);
      
      // Processar imagens SE HOUVER
      let imagens: any[] = [];
      if (zip && mediaFiles.length > 0) {
        console.log('🖼️ [SKU_SYSTEM] Processando imagens por SKU...');
        const resultado = await skuProcessor.processarImagensIndividualmente(zip, mediaFiles);
        
        console.log('✅ [SKU_SYSTEM] Processamento de imagens concluído:', {
          imagensProcessadas: resultado.imagensProcessadas.length,
          rejeitadas: resultado.rejeitadas.length,
          renomeadas: resultado.renomeadasCount
        });
        
        // Mapear para formato esperado
        imagens = resultado.imagensProcessadas.map(img => ({
          nome: img.arquivoRenomeado,
          blob: img.blob,
          linha: img.linha,
          coluna: 'IMAGEM',
          sku: img.sku
        }));
      } else {
        console.log('📝 [SKU_SYSTEM] Nenhuma imagem para processar');
      }
      
      return { dados, imagens };
      
    } catch (error) {
      console.error('❌ [SKU_SYSTEM] ERRO no processamento:', error);
      throw error;
    }
  }, [skuProcessor]);

  const uploadImagensExtraidas = useCallback(async (
    imagensExtraidas: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[],
    cotacaoId: string,
    organizationId: string
  ) => {
    try {
      setLoading(true);
      console.log(`🔄 [UPLOAD] Iniciando upload de ${imagensExtraidas.length} imagens...`);
      
      if (imagensExtraidas.length === 0) {
        throw new Error('Nenhuma imagem foi encontrada para upload');
      }

      const imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string}[] = [];
      
      for (const [index, imagem] of imagensExtraidas.entries()) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `${cotacaoId}_${timestamp}_${imagem.nome}`;
          const filePath = `${organizationId}/${cotacaoId}/imagens/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('cotacoes-arquivos')
            .upload(filePath, imagem.blob);

          if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('cotacoes-arquivos')
            .getPublicUrl(filePath);

          imagensUpload.push({
            nome: imagem.nome,
            url: urlData.publicUrl,
            linha: imagem.linha,
            coluna: imagem.coluna,
            sku: imagem.sku
          });

          console.log(`✅ [UPLOAD] Imagem ${index + 1}/${imagensExtraidas.length} enviada: ${imagem.nome}`);
        } catch (error) {
          console.error('Erro ao fazer upload da imagem:', error);
        }
      }

      return imagensUpload;
    } catch (error) {
      console.error('Erro geral no upload das imagens:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const processarDados = useCallback((dados: any[], imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string}[] = []): any[] => {
    console.log('🔄 [SKU_SYSTEM] Processamento completo de dados com imagens');
    console.log('📊 [SKU_SYSTEM] Dados recebidos:', dados.length);
    console.log('🖼️ [SKU_SYSTEM] Imagens para associação:', imagensUpload.length);
    
    return dados.map((item, index) => {
      // Mapeamento de campos
      const produtoMapeado = {
        ...item,
        sku: item.SKU || item.sku || `PROD-${index + 1}`,
        nome_produto: item.PRODUTO || item.produto || item.nome_produto || '',
        preco: Number(item.PRECO_UNITARIO || item.preco_unitario || item.preco) || 0,
        quantidade: Number(item.QUANTIDADE || item.quantidade) || 1,
        valor_total: Number(item.PRECO_TOTAL || item.preco_total || item.valor_total) || 0,
        material: item.material || item.Material || '',
        cor: item.cor || item.Cor || item.COR || '',
        package: item.package || item.Package || item.PACKAGE || '',
        unit: item.unit || item.Unit || item.UNIT || 'pc',
        pcs_ctn: Number(item.pcs_ctn || item.PCS_CTN) || 0,
        caixas: Number(item.caixas || item.Caixas || item.CAIXAS) || 1,
        imagem: '',
        imagem_fornecedor: ''
      };
      
      // ASSOCIAÇÃO DE IMAGENS POR SKU
      const imagensPorSku = imagensUpload.filter(img => 
        img.sku && img.sku === produtoMapeado.sku
      );
      
      if (imagensPorSku.length > 0) {
        produtoMapeado.imagem = imagensPorSku[0].url;
        if (imagensPorSku[1]) {
          produtoMapeado.imagem_fornecedor = imagensPorSku[1].url;
        }
        console.log(`✅ [SKU_SYSTEM] Produto ${produtoMapeado.sku}: ${imagensPorSku.length} imagem(ns) associada(s) por SKU`);
      } else {
        console.log(`📝 [SKU_SYSTEM] Produto ${produtoMapeado.sku}: Sem imagens associadas`);
      }
      
      return produtoMapeado;
    });
  }, []);

  const processarArquivo = useCallback(async (arquivoId: string, dados: any[]) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .update({
          dados_processados: dados,
          status: 'processado',
          total_linhas: dados.length,
          linhas_processadas: dados.length,
          linhas_erro: 0
        })
        .eq('id', arquivoId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo processado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      
      await supabase
        .from('cotacoes_arquivos')
        .update({
          status: 'erro',
          detalhes_erro: [{ error: error instanceof Error ? error.message : 'Erro desconhecido' }]
        })
        .eq('id', arquivoId);

      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const processarArquivoLocal = useCallback(async (file: File): Promise<any[]> => {
    try {
      setLoading(true);
      
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('Planilha não encontrada');
      }

      const dados: any[] = [];
      const headers: string[] = [];
      
      // Extrair cabeçalhos da primeira linha
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || `Coluna${colNumber}`;
      });

      // Processar dados das linhas subsequentes
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData: any = {};
        
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          dados.push(rowData);
        }
      }

      return dados;
    } catch (error) {
      console.error('Erro ao processar arquivo local:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    getArquivosCotacao,
    uploadArquivo,
    processarArquivo,
    processarArquivoLocal,
    deletarArquivo,
    downloadTemplate,
    lerArquivoComImagens,
    uploadImagensExtraidas,
    processarDados,
  };
}