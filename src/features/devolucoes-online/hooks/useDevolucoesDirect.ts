/**
 * 🎣 HOOK DEVOLUCOES DIRECT - BUSCA DIRETO DA API ML
 * Cópia EXATA do padrão de useReclamacoes que FUNCIONA
 * ✅ FASE 2: Feedback de progresso em tempo real
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DevolucaoFilters {
  periodo: string;
  date_from?: string;
  date_to?: string;
}

export function useDevolucoesDirect(
  filters: DevolucaoFilters, 
  selectedAccountIds: string[], 
  shouldFetch: boolean = false
) {
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDevolucoes = async (showLoading = true) => {
    // ✅ Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    if (!selectedAccountIds || selectedAccountIds.length === 0) {
      setDevolucoes([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Calcular datas
      const calcularDataInicio = (periodo: string) => {
        const hoje = new Date();
        const dias = parseInt(periodo);
        hoje.setDate(hoje.getDate() - dias);
        return hoje.toISOString().split('T')[0]; // YYYY-MM-DD
      };

      let dataInicio: string;
      let dataFim: string;

      if (filters.date_from && filters.date_to) {
        dataInicio = filters.date_from;
        dataFim = filters.date_to;
      } else {
        dataInicio = calcularDataInicio(filters.periodo);
        dataFim = new Date().toISOString().split('T')[0];
      }

      console.log('🔍 Buscando devoluções:', {
        contas: selectedAccountIds.length,
        periodo: `${filters.periodo} dias`,
        dateFrom: dataInicio,
        dateTo: dataFim
      });

      // ✅ FASE 2: Toast inicial de progresso
      toast.loading(`📡 Iniciando sincronização...`, {
        id: 'fetch-devolucoes',
        duration: Infinity
      });

      // ✅ BUSCAR PARA CADA CONTA
      const allDevolucoes: any[] = [];
      
      for (let accountIndex = 0; accountIndex < selectedAccountIds.length; accountIndex++) {
        const accountId = selectedAccountIds[accountIndex];
        
        if (signal.aborted) {
          console.log('🛑 Busca cancelada pelo usuário');
          throw new Error('Busca cancelada');
        }

        // ✅ FASE 2: Atualizar progresso da conta
        toast.loading(
          `📡 Conta ${accountIndex + 1}/${selectedAccountIds.length}: Buscando devoluções...`,
          { id: 'fetch-devolucoes', duration: Infinity }
        );

        console.log(`📡 Buscando conta ${accountId}...`);

        const { data, error: functionError } = await supabase.functions.invoke('get-devolucoes-direct', {
          body: {
            integration_account_id: accountId,
            date_from: dataInicio,
            date_to: dataFim
          }
        });

        if (functionError) {
          console.error('Erro ao buscar devoluções:', functionError);
          throw functionError;
        }

        if (!data || !data.success) {
          console.error('Resposta inválida:', data);
          throw new Error(data?.error || 'Erro ao buscar devoluções');
        }

        const claims = data.data || [];
        console.log(`✅ ${claims.length} devoluções recebidas da conta ${accountId}`);
        
        allDevolucoes.push(...claims);

        // ✅ FASE 2: Atualizar progresso acumulado
        toast.loading(
          `✅ ${allDevolucoes.length} devoluções processadas (conta ${accountIndex + 1}/${selectedAccountIds.length})`,
          { id: 'fetch-devolucoes', duration: Infinity }
        );
      }

      console.log(`✅ Total: ${allDevolucoes.length} devoluções de ${selectedAccountIds.length} conta(s)`);
      
      setDevolucoes(allDevolucoes);
      setError(null);

      toast.success(`✅ ${allDevolucoes.length} devoluções recebidas DIRETO da API ML!`, {
        id: 'fetch-devolucoes'
      });

    } catch (err: any) {
      if (err.message !== 'Busca cancelada') {
        console.error('Erro ao buscar devoluções:', err);
        setError(err.message || 'Erro ao buscar devoluções');
        toast.error('Erro ao buscar devoluções', {
          description: err.message,
          id: 'fetch-devolucoes'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast.info('Busca cancelada', { id: 'fetch-devolucoes' });
    }
  };

  return {
    devolucoes,
    isLoading,
    error,
    fetchDevolucoes,
    cancelFetch
  };
}
