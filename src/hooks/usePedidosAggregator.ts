/**
 * Hook para buscar contadores agregados de pedidos (totais de todas as páginas)
 * Usado nos cards de status para mostrar totais globais em vez de apenas da página atual
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Tipo temporário compatível com ambos os sistemas
interface CompatibleFiltersState {
  search?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  statusEnvio?: string | string[];
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  contasML?: string[];
  situacao?: string | string[]; // Para compatibilidade
}
import { mapSituacaoToApiStatus } from '@/utils/statusMapping';

interface PedidosAggregatorCounts {
  total: number;
  prontosBaixa: number;
  mapeamentoPendente: number;
  baixados: number;
  shipped: number;
  delivered: number;
}

interface UsePedidosAggregatorReturn {
  counts: PedidosAggregatorCounts | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePedidosAggregator(
  integrationAccountId: string,
  appliedFilters: CompatibleFiltersState
): UsePedidosAggregatorReturn {
  const [counts, setCounts] = useState<PedidosAggregatorCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    console.log('🔢 [Aggregator] Iniciando busca com filtros:', appliedFilters);
    
    const accountIds = (appliedFilters?.contasML && appliedFilters.contasML.length > 0)
      ? appliedFilters.contasML
      : (integrationAccountId ? [integrationAccountId] : []);
    
    if (!accountIds.length) {
      console.warn('🔢 [Aggregator] Nenhuma conta disponível');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Converter filtros para formato da API
      const apiFilters: any = {};
      
      if (appliedFilters.search) {
        apiFilters.search = appliedFilters.search;
        console.log('🔍 [Aggregator] Search aplicado:', appliedFilters.search);
      }
      
      // ✅ CORREÇÃO: Normalizar datas corretamente
      if (appliedFilters.dataInicio) {
        const d = appliedFilters.dataInicio instanceof Date 
          ? appliedFilters.dataInicio 
          : new Date(appliedFilters.dataInicio);
        
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0); // Início do dia
          apiFilters.date_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          console.log('📅 [Aggregator] Data início:', appliedFilters.dataInicio, '=>', apiFilters.date_from);
        }
      }

      if (appliedFilters.dataFim) {
        const d = appliedFilters.dataFim instanceof Date 
          ? appliedFilters.dataFim 
          : new Date(appliedFilters.dataFim);
        
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999); // Fim do dia
          apiFilters.date_to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          console.log('📅 [Aggregator] Data fim:', appliedFilters.dataFim, '=>', apiFilters.date_to);
        }
      }

      if (appliedFilters.cidade) {
        apiFilters.cidade = appliedFilters.cidade;
        console.log('🏙️ [Aggregator] Cidade:', appliedFilters.cidade);
      }

      if (appliedFilters.uf) {
        apiFilters.uf = appliedFilters.uf;
        console.log('🗺️ [Aggregator] UF:', appliedFilters.uf);
      }

      if (appliedFilters.valorMin !== undefined) {
        apiFilters.valorMin = appliedFilters.valorMin;
        console.log('💰 [Aggregator] Valor mín:', appliedFilters.valorMin);
      }

      if (appliedFilters.valorMax !== undefined) {
        apiFilters.valorMax = appliedFilters.valorMax;
        console.log('💰 [Aggregator] Valor máx:', appliedFilters.valorMax);
      }

      // ✅ CORREÇÃO: Mapear statusEnvio corretamente
      if (appliedFilters.statusEnvio) {
        const statusList = Array.isArray(appliedFilters.statusEnvio) 
          ? appliedFilters.statusEnvio 
          : [appliedFilters.statusEnvio];
        
        // Mapear valores da UI para API
        const statusMapping: Record<string, string> = {
          'Pendente': 'pending',
          'Pronto para Envio': 'ready_to_ship', 
          'Enviado': 'shipped',
          'Entregue': 'delivered',
          'Cancelado': 'cancelled'
        };
        
        const mapped = statusList
          .map(status => statusMapping[status] || status)
          .filter(Boolean);
          
        if (mapped.length === 1) {
          apiFilters.shipping_status = mapped[0];
          console.log('📊 [Aggregator] Status envio:', mapped[0]);
        }
      }

      // ✅ CORREÇÃO: Suportar múltiplas contas
      const requestBody: any = {
        filters: apiFilters
      };
      
      if (accountIds.length > 1) {
        requestBody.integration_account_ids = accountIds;
        console.log('🔗 [Aggregator] Múltiplas contas:', accountIds.length);
      } else {
        requestBody.integration_account_id = accountIds[0];
        console.log('🔗 [Aggregator] Conta única:', accountIds[0]);
      }
      
      console.log('🔢 [Aggregator] Request body completo:', requestBody);

      // Como a função pedidos-aggregator foi removida, retornar dados mockados temporariamente
      console.log('⚠️ [Aggregator] Função removida - retornando dados mockados');
      setCounts({
        total: 0,
        prontosBaixa: 0,
        mapeamentoPendente: 0,
        baixados: 0,
        shipped: 0,
        delivered: 0
      });

    } catch (err: any) {
      console.error('❌ [Aggregator] Erro ao buscar contadores:', err);
      setError(err.message || 'Erro ao buscar contadores agregados');
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [integrationAccountId, appliedFilters]);

  // Buscar contadores quando dependências mudarem
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts
  };
}