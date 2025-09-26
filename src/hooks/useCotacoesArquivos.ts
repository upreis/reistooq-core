import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const getArquivosCotacao = useCallback(async (cotacaoId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar arquivos da cotação:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos da cotação:', error);
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
      const fileName = `${cotacaoId}_${timestamp}_${file.name}`;
      const filePath = `${organizationId}/${cotacaoId}/${fileName}`;

      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('cotacoes-arquivos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload do arquivo:', uploadError);
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
        console.error('Erro ao registrar arquivo:', error);
        // Tentar remover o arquivo do storage se falhou o registro
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
      console.error('Erro ao fazer upload do arquivo:', error);
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
        console.error('Erro ao processar arquivo:', error);
        throw error;
      }

      toast({
        title: "Arquivo processado!",
        description: `${dados.length} linhas processadas com sucesso.`,
      });

      return data;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
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

  const deletarArquivo = useCallback(async (arquivo: CotacaoArquivo) => {
    try {
      setLoading(true);

      // Deletar arquivo do storage se existir URL
      if (arquivo.url_arquivo) {
        const path = arquivo.url_arquivo.split('/cotacoes-arquivos/')[1];
        if (path) {
          await supabase.storage
            .from('cotacoes-arquivos')
            .remove([path]);
        }
      }

      // Deletar registro da tabela
      const { error } = await supabase
        .from('cotacoes_arquivos')
        .delete()
        .eq('id', arquivo.id);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        throw error;
      }

      toast({
        title: "Arquivo removido!",
        description: "Arquivo deletado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o arquivo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadTemplate = useCallback(() => {
    try {
      // Colunas baseadas na imagem fornecida
      const headers = [
        'SKU',
        'IMAGEM',
        'IMAGEM_FORNECEDOR',
        'MATERIAL',
        'COR',
        'NOME_PRODUTO',
        'PACKAGE',
        'PRECO',
        'UNIT',
        'PCS_CTN',
        'CAIXAS',
        'PESO_UNITARIO_KG',
        'PESO_MASTER_KG',
        'PESO_SEM_MASTER_KG',
        'PESO_TOTAL_MASTER_KG',
        'PESO_TOTAL_SEM_MASTER_KG',
        'COMPRIMENTO',
        'LARGURA',
        'ALTURA',
        'CBM_CUBAGEM',
        'CBM_TOTAL',
        'QUANTIDADE_TOTAL',
        'VALOR_TOTAL',
        'OBS',
        'CHANGE_DOLAR',
        'MULTIPLICADOR_REAIS'
      ];

      // Criar CSV com exemplo
      const csvContent = [
        headers.join(','),
        'FL-800,"","","Poliéster","IGUAL DA FOTO","chapéu aeronáutica, 28*21*14cm","10pcs/opp","240","1","90","22,60","21,60","0,00","0,00","0","0","0","0,21","0,21","240","¥ 1.260,00","","","0,74","R$ 5,44"',
        'FL-801,"","","Poliéster","IGUAL DA FOTO","chapéu policia, 26,5*25*14cm","10pcs/opp","200","1","70","15,00","14,00","0,00","0,00","0","0","0","0,21","0,21","200","¥ 1.160,00","","","0,81","R$ 6,00"'
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_cotacao_internacional.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Template baixado!",
        description: "Template CSV baixado com sucesso.",
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
    deletarArquivo,
    downloadTemplate,
  };
}