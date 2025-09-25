import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CotacaoInternacional {
  id?: string;
  numero_cotacao: string;
  descricao: string;
  pais_origem: string;
  moeda_origem: string;
  fator_multiplicador: number;
  data_abertura: string;
  data_fechamento?: string;
  status: string;
  observacoes?: string;
  produtos: any[];
  total_peso_kg?: number;
  total_cbm?: number;
  total_quantidade?: number;
  total_valor_origem?: number;
  total_valor_usd?: number;
  total_valor_brl?: number;
}

export function useCotacoesInternacionais() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCotacoesInternacionais = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cotacoes_internacionais')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cotações internacionais:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar cotações internacionais:', error);
      toast({
        title: "Erro ao carregar cotações",
        description: "Não foi possível carregar as cotações internacionais.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCotacaoInternacional = useCallback(async (cotacao: CotacaoInternacional) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cotacoes_internacionais')
        .insert([{
          numero_cotacao: cotacao.numero_cotacao,
          descricao: cotacao.descricao,
          pais_origem: cotacao.pais_origem,
          moeda_origem: cotacao.moeda_origem,
          fator_multiplicador: cotacao.fator_multiplicador,
          data_abertura: cotacao.data_abertura,
          data_fechamento: cotacao.data_fechamento || null, // Convert empty string to null
          status: cotacao.status,
          observacoes: cotacao.observacoes,
          produtos: cotacao.produtos,
          total_peso_kg: cotacao.total_peso_kg,
          total_cbm: cotacao.total_cbm,
          total_quantidade: cotacao.total_quantidade,
          total_valor_origem: cotacao.total_valor_origem,
          total_valor_usd: cotacao.total_valor_usd,
          total_valor_brl: cotacao.total_valor_brl,
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cotação internacional:', error);
        throw error;
      }

      toast({
        title: "Cotação salva!",
        description: "Cotação internacional criada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar cotação internacional:', error);
      toast({
        title: "Erro ao salvar cotação",
        description: "Não foi possível salvar a cotação internacional.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateCotacaoInternacional = useCallback(async (id: string, cotacao: Partial<CotacaoInternacional>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cotacoes_internacionais')
        .update({
          ...cotacao,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cotação internacional:', error);
        throw error;
      }

      toast({
        title: "Cotação atualizada!",
        description: "Cotação internacional atualizada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar cotação internacional:', error);
      toast({
        title: "Erro ao atualizar cotação",
        description: "Não foi possível atualizar a cotação internacional.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteCotacaoInternacional = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('cotacoes_internacionais')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar cotação internacional:', error);
        throw error;
      }

      toast({
        title: "Cotação excluída!",
        description: "Cotação internacional excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar cotação internacional:', error);
      toast({
        title: "Erro ao excluir cotação",
        description: "Não foi possível excluir a cotação internacional.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    getCotacoesInternacionais,
    createCotacaoInternacional,
    updateCotacaoInternacional,
    deleteCotacaoInternacional,
  };
}