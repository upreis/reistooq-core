import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageMapping } from './useImageMapping';

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
  const { processExcelFile, uploadImages, mapDataWithImages } = useImageMapping();

  const getArquivosCotacao = useCallback(async (cotacaoId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar arquivos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Não foi possível carregar os arquivos da cotação.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadArquivo = useCallback(async (file: File, cotacaoId: string, organizationId: string) => {
    try {
      setLoading(true);

      // Gerar nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Sanitizar nome do arquivo removendo caracteres especiais
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Substituir caracteres especiais por underscore
        .replace(/_{2,}/g, '_'); // Substituir múltiplos underscores por um só
      const fileName = `${cotacaoId}_${timestamp}_${sanitizedFileName}`;
      const filePath = `${organizationId}/${cotacaoId}/${fileName}`;

      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('cotacoes-arquivos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('cotacoes-arquivos')
        .getPublicUrl(filePath);

      // Registrar arquivo na tabela
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .insert([{
          cotacao_id: cotacaoId,
          nome_arquivo: file.name,
          tipo_arquivo: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 'csv',
          url_arquivo: urlData.publicUrl,
          status: 'pendente'
        }])
        .select()
        .single();

      if (error) {
        // Remover arquivo do storage se falhou o registro
        await supabase.storage
          .from('cotacoes-arquivos')
          .remove([filePath]);
        throw error;
      }

      toast({
        title: "Arquivo enviado!",
        description: "Arquivo enviado com sucesso. Processando dados...",
      });

      return data;
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const processarArquivo = useCallback(async (arquivoId: string, dadosProcessados: any[]) => {
    try {
      const { error } = await supabase
        .from('cotacoes_arquivos')
        .update({
          dados_processados: dadosProcessados,
          status: 'processado',
          total_linhas: dadosProcessados.length,
          linhas_processadas: dadosProcessados.length,
          linhas_erro: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', arquivoId);

      if (error) {
        throw error;
      }

      toast({
        title: "Processamento concluído!",
        description: `Arquivo processado com sucesso. ${dadosProcessados.length} itens importados.`,
      });

    } catch (error) {
      console.error('Erro no processamento:', error);
      
      await supabase
        .from('cotacoes_arquivos')
        .update({
          status: 'erro',
          detalhes_erro: [{ erro: error.message }],
          updated_at: new Date().toISOString()
        })
        .eq('id', arquivoId);

      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const processarArquivoLocal = useCallback(async (
    file: File, 
    cotacao: any, 
    onImportSuccess: (dados: any[]) => void
  ) => {
    try {
      setLoading(true);
      console.log('🚀 [CLEAN] Processando arquivo:', file.name, 'para cotação:', cotacao.numero);

      // 1. Upload do arquivo
      const organizationId = cotacao.organization_id;
      const arquivoUpload = await uploadArquivo(file, cotacao.id, organizationId);

      // 2. Processar Excel e extrair imagens (NOVO SISTEMA)
      const { dados, imagens } = await processExcelFile(file);

      // 3. Upload das imagens extraídas (NOVO SISTEMA)
      const imageUrls = await uploadImages(imagens, cotacao.id, organizationId);

      // 4. Mapear dados com URLs das imagens (NOVO SISTEMA)
      const dadosComImagens = mapDataWithImages(dados, imageUrls);

      // 5. Salvar dados processados
      await processarArquivo(arquivoUpload.id, dadosComImagens);

      // 6. Notificar sucesso
      onImportSuccess(dadosComImagens);

      console.log('✅ [CLEAN] Processamento completo:', {
        arquivo: file.name,
        dados: dados.length,
        imagens: imagens.length,
        imageUrls: Object.keys(imageUrls).length
      });

    } catch (error) {
      console.error('❌ [CLEAN] Erro no processamento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [uploadArquivo, processExcelFile, uploadImages, mapDataWithImages, processarArquivo]);

  const deletarArquivo = useCallback(async (arquivoId: string) => {
    try {
      const { error } = await supabase
        .from('cotacoes_arquivos')
        .delete()
        .eq('id', arquivoId);

      if (error) {
        throw error;
      }

      toast({
        title: "Arquivo removido",
        description: "Arquivo removido com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: "Erro ao remover arquivo",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const downloadTemplate = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      
      const templateData = [
        {
          'SKU': 'EXEMPLO-001',
          'Produto': 'Produto Exemplo',
          'Descrição': 'Descrição do produto',
          'Quantidade': 10,
          'Preço Unitário': 25.50,
          'IMAGEM': 'imagem_produto.jpg',
          'IMAGEM_FORNECEDOR': 'imagem_fornecedor.jpg'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

      XLSX.writeFile(workbook, 'template_cotacao_internacional.xlsx');

      toast({
        title: "Template baixado",
        description: "Template de importação baixado com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o template.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    loading,
    getArquivosCotacao,
    uploadArquivo,
    processarArquivo,
    processarArquivoLocal,
    deletarArquivo,
    downloadTemplate
  };
}