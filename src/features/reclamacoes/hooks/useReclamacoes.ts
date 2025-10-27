/**
 * 🎣 HOOK PRINCIPAL DE RECLAMAÇÕES
 * Gerencia estado e busca de claims
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClaimFilters {
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
}

export function useReclamacoes(filters: ClaimFilters) {
  const [reclamacoes, setReclamacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar primeira conta ML disponível
  useEffect(() => {
    const fetchAccount = async () => {
      const { data: accounts } = await supabase
        .from('integration_accounts')
        .select('id')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .limit(1);
      
      if (accounts && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    };
    fetchAccount();
  }, []);

  const fetchReclamacoes = async (showLoading = true) => {
    if (!selectedAccountId) {
      setReclamacoes([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Tentar buscar do banco primeiro (cache)
      let query = supabase
        .from('reclamacoes')
        .select('*')
        .eq('integration_account_id', selectedAccountId)
        .order('date_created', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const { data: cached, error: dbError } = await query;

      if (!dbError && cached && cached.length > 0) {
        setReclamacoes(cached);
      }

      // Buscar da API ML para atualizar
      const { data, error: functionError } = await supabase.functions.invoke('ml-claims-fetch', {
        body: {
          accountId: selectedAccountId,
          filters: {
            ...filters,
            date_from: filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            date_to: filters.date_to || new Date().toISOString()
          }
        }
      });

      if (functionError) throw functionError;

      if (data?.claims) {
        setReclamacoes(data.claims);
      }

    } catch (err: any) {
      console.error('[useReclamacoes] Erro:', err);
      setError(err.message || 'Erro ao buscar reclamações');
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar reclamações',
        description: err.message || 'Tente novamente'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchReclamacoes();
    }
  }, [selectedAccountId, filters.status, filters.type]);

  return {
    reclamacoes,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchReclamacoes(false)
  };
}
