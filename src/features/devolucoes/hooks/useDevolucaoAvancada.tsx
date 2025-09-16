/**
 * 🎛️ HOOK PRINCIPAL PARA DEVOLUÇÕES AVANÇADAS - FASE 5
 * Gerencia estado, dados e ações das devoluções com as 42 novas colunas
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  DevolucaoAvancada, 
  DevolucaoFiltrosAvancados, 
  DevolucaoViewConfig, 
  DevolucaoMetrics,
  DevolucaoViewMode 
} from '../types/devolucao-avancada.types';
import { useDevolucoesFase2 } from '../hooks/useDevolucoesFase2';

interface UseDevolucaoAvancadaConfig {
  integration_account_ids: string[];
  auto_sync: boolean;
  enable_real_time: boolean;
  default_filters?: Partial<DevolucaoFiltrosAvancados>;
  default_view?: Partial<DevolucaoViewConfig>;
}

export function useDevolucaoAvancada(config: UseDevolucaoAvancadaConfig) {
  const queryClient = useQueryClient();

  // ===== ESTADOS PRINCIPAIS =====
  const [filtros, setFiltros] = useState<DevolucaoFiltrosAvancados>({
    // Filtros básicos
    search: '',
    status: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountIds: config.integration_account_ids,
    
    // Filtros avançados com defaults
    ...config.default_filters
  });

  const [viewConfig, setViewConfig] = useState<DevolucaoViewConfig>({
    mode: 'cards',
    columns_visible: [
      'status_devolucao', 'nivel_prioridade', 'valor_retido', 
      'mensagens_nao_lidas', 'data_criacao', 'acao_seller_necessaria'
    ],
    cards_per_page: 20,
    table_page_size: 25,
    sort_field: 'data_criacao',
    sort_direction: 'desc',
    compact_mode: false,
    ...config.default_view
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<DevolucaoViewMode>(viewConfig.mode);

  // ===== INTEGRAÇÃO COM FASE 2 =====
  const fase2Config = useMemo(() => ({
    integration_account_id: config.integration_account_ids[0] || '',
    auto_enrich: config.auto_sync,
    batch_size: 25,
    enable_real_time: config.enable_real_time
  }), [config]);

  const fase2 = useDevolucoesFase2(fase2Config);

  // ===== AUTO-ENRIQUECIMENTO =====
  const enrichDataMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Iniciando enriquecimento automático...');
      
      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'enrich_existing_data',
          integration_account_id: config.integration_account_ids[0],
          limit: 25
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Enriquecimento concluído:', data);
      queryClient.invalidateQueries({ queryKey: ['devolucoes-avancadas'] });
      if (data.enriched_count > 0) {
        toast.success(`${data.enriched_count} devoluções enriquecidas com dados da ML!`);
      } else {
        toast.info('Nenhuma devolução nova para enriquecer');
      }
    },
    onError: (error: any) => {
      console.error('❌ Erro no enriquecimento:', error);
      toast.error(`Erro no enriquecimento: ${error.message}`);
    }
  });

  // Função manual para enriquecer dados
  const enriquecerDadosManual = useCallback(() => {
    enrichDataMutation.mutate();
  }, [enrichDataMutation]);

  // ===== QUERY PRINCIPAL - DEVOLUÇÕES AVANÇADAS =====
  const { 
    data: devolucoes = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['devolucoes-avancadas', filtros, viewConfig.sort_field, viewConfig.sort_direction],
    queryFn: async () => {
      console.log('🔍 Carregando devoluções avançadas com filtros:', filtros);
      
      let query = supabase
        .from('devolucoes_avancadas')
        .select(`
          *,
          integration_accounts!inner(name, provider)
        `);

      // ===== APLICAR FILTROS BÁSICOS =====
      if (filtros.accountIds && filtros.accountIds.length > 0) {
        query = query.in('integration_account_id', filtros.accountIds);
      }

      if (filtros.search) {
        query = query.or(`
          order_id.ilike.%${filtros.search}%,
          claim_id.ilike.%${filtros.search}%,
          produto_titulo.ilike.%${filtros.search}%,
          sku.ilike.%${filtros.search}%
        `);
      }

      if (filtros.status && filtros.status !== 'all') {
        query = query.eq('status_devolucao', filtros.status);
      }

      if (filtros.dateFrom) {
        query = query.gte('data_criacao', filtros.dateFrom);
      }

      if (filtros.dateTo) {
        query = query.lte('data_criacao', filtros.dateTo + 'T23:59:59.999Z');
      }

      // ===== APLICAR FILTROS AVANÇADOS =====
      if (filtros.nivel_prioridade && filtros.nivel_prioridade.length > 0) {
        query = query.in('nivel_prioridade', filtros.nivel_prioridade);
      }

      if (filtros.status_moderacao && filtros.status_moderacao.length > 0) {
        query = query.in('status_moderacao', filtros.status_moderacao);
      }

      if (filtros.escalado_para_ml !== undefined) {
        query = query.eq('escalado_para_ml', filtros.escalado_para_ml);
      }

      if (filtros.em_mediacao !== undefined) {
        query = query.eq('em_mediacao', filtros.em_mediacao);
      }

      if (filtros.acao_seller_necessaria !== undefined) {
        query = query.eq('acao_seller_necessaria', filtros.acao_seller_necessaria);
      }

      if (filtros.impacto_reputacao && filtros.impacto_reputacao.length > 0) {
        query = query.in('impacto_reputacao', filtros.impacto_reputacao);
      }

      if (filtros.mensagens_nao_lidas_min !== undefined) {
        query = query.gte('mensagens_nao_lidas', filtros.mensagens_nao_lidas_min);
      }

      if (filtros.tempo_resposta_max !== undefined) {
        query = query.lte('tempo_resposta_medio', filtros.tempo_resposta_max);
      }

      if (filtros.valor_retido_min !== undefined) {
        query = query.gte('valor_retido', filtros.valor_retido_min);
      }

      if (filtros.valor_retido_max !== undefined) {
        query = query.lte('valor_retido', filtros.valor_retido_max);
      }

      if (filtros.has_tracking !== undefined) {
        if (filtros.has_tracking) {
          query = query.not('codigo_rastreamento', 'is', null);
        } else {
          query = query.is('codigo_rastreamento', null);
        }
      }

      if (filtros.has_attachments !== undefined) {
        if (filtros.has_attachments) {
          query = query.gt('anexos_count', 0);
        } else {
          query = query.or('anexos_count.is.null,anexos_count.eq.0');
        }
      }

      if (filtros.overdue_actions) {
        const now = new Date().toISOString();
        query = query.lt('data_vencimento_acao', now);
      }

      // ===== APLICAR ORDENAÇÃO =====
      query = query.order(viewConfig.sort_field, { 
        ascending: viewConfig.sort_direction === 'asc' 
      });

      // ===== APLICAR PAGINAÇÃO =====
      const limit = viewConfig.mode === 'table' 
        ? viewConfig.table_page_size 
        : viewConfig.cards_per_page;
      
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao carregar devoluções:', error);
        throw error;
      }

      console.log('✅ Devoluções carregadas:', data?.length);
      return (data || []) as any[];
    },
    enabled: config.integration_account_ids.length > 0,
    refetchInterval: config.enable_real_time ? 30000 : false, // Auto-refresh se real-time ativo
  });

  // ===== AUTO-ENRIQUECIMENTO APÓS CARREGAR DADOS =====
  useEffect(() => {
    if (config.auto_sync && config.integration_account_ids.length > 0 && devolucoes.length > 0) {
      const hasEmptyColumns = devolucoes.some(dev => 
        !dev.timeline_mensagens || 
        dev.timeline_mensagens.length === 0 ||
        !dev.nivel_prioridade ||
        dev.anexos_count === null
      );
      
      if (hasEmptyColumns) {
        console.log('🔄 Detectadas colunas vazias, iniciando enriquecimento automático...');
        enrichDataMutation.mutate();
      }
    }
  }, [config.auto_sync, config.integration_account_ids, devolucoes.length, enrichDataMutation]);

  // ===== CALCULAR MÉTRICAS =====
  const metricas = useMemo((): DevolucaoMetrics => {
    const total = devolucoes.length;
    
    // Distribuição por prioridade
    const byPriority = devolucoes.reduce((acc, dev) => {
      const priority = dev.nivel_prioridade || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribuição por status
    const byStatus = devolucoes.reduce((acc, dev) => {
      const status = dev.status_devolucao || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribuição por tipo
    const byType = devolucoes.reduce((acc, dev) => {
      const type = dev.tipo_claim || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Métricas de tempo
    const validResponseTimes = devolucoes.filter(d => d.tempo_resposta_medio);
    const avgResponseTime = validResponseTimes.length > 0
      ? validResponseTimes.reduce((sum, d) => sum + (d.tempo_resposta_medio || 0), 0) / validResponseTimes.length
      : 0;

    const validResolutionTimes = devolucoes.filter(d => d.tempo_total_resolucao);
    const avgResolutionTime = validResolutionTimes.length > 0
      ? validResolutionTimes.reduce((sum, d) => sum + (d.tempo_total_resolucao || 0), 0) / validResolutionTimes.length
      : 0;

    // Satisfação média
    const validSatisfaction = devolucoes.filter(d => d.taxa_satisfacao);
    const avgSatisfaction = validSatisfaction.length > 0
      ? validSatisfaction.reduce((sum, d) => sum + (d.taxa_satisfacao || 0), 0) / validSatisfaction.length
      : 0;

    // Taxas
    const escalationRate = total > 0 ? (devolucoes.filter(d => d.escalado_para_ml).length / total) * 100 : 0;
    const mediationRate = total > 0 ? (devolucoes.filter(d => d.em_mediacao).length / total) * 100 : 0;

    // Contadores
    const highPriorityCount = devolucoes.filter(d => 
      d.nivel_prioridade === 'high' || d.nivel_prioridade === 'critical'
    ).length;

    const unreadMessagesCount = devolucoes.reduce((sum, d) => sum + (d.mensagens_nao_lidas || 0), 0);
    
    const now = new Date();
    const overdueActionsCount = devolucoes.filter(d => 
      d.data_vencimento_acao && new Date(d.data_vencimento_acao) < now
    ).length;

    // Valores financeiros
    const totalValue = devolucoes.reduce((sum, d) => sum + (d.valor_retido || 0), 0);
    const shippingCosts = devolucoes.reduce((sum, d) => sum + (d.custo_envio_devolucao || 0), 0);
    const compensationCosts = devolucoes.reduce((sum, d) => sum + (d.valor_compensacao || 0), 0);

    return {
      total_count: total,
      by_priority: byPriority,
      by_status: byStatus,
      by_type: byType,
      avg_response_time: Math.round(avgResponseTime),
      avg_resolution_time: Math.round(avgResolutionTime),
      avg_satisfaction: Math.round(avgSatisfaction * 100) / 100,
      escalation_rate: Math.round(escalationRate * 100) / 100,
      mediation_rate: Math.round(mediationRate * 100) / 100,
      high_priority_count: highPriorityCount,
      unread_messages_count: unreadMessagesCount,
      overdue_actions_count: overdueActionsCount,
      total_value: totalValue,
      financial_impact: {
        shipping_costs: shippingCosts,
        compensation_costs: compensationCosts,
        refund_amounts: totalValue
      }
    };
  }, [devolucoes]);

  // ===== MUTATION PARA AÇÕES EM LOTE =====
  const batchActionMutation = useMutation({
    mutationFn: async ({ action, items, data }: { 
      action: string; 
      items: string[]; 
      data?: any 
    }) => {
      console.log(`🔄 Executando ação em lote: ${action} para ${items.length} itens`);

      const updates = items.map(id => ({
        id,
        data: {
          ...data,
          updated_at: new Date().toISOString()
        }
      }));

      const { data: result, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'update_phase2_columns',
          integration_account_id: config.integration_account_ids[0],
          updates
        }
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Ação executada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['devolucoes-avancadas'] });
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(`Erro na ação: ${error.message}`);
    }
  });

  // ===== FUNÇÕES DE AÇÃO =====
  const marcarComoLidas = useCallback((items: string[]) => {
    batchActionMutation.mutate({
      action: 'mark_as_read',
      items,
      data: { mensagens_nao_lidas: 0 }
    });
  }, [batchActionMutation]);

  const atualizarPrioridade = useCallback((items: string[], prioridade: string) => {
    batchActionMutation.mutate({
      action: 'update_priority',
      items,
      data: { nivel_prioridade: prioridade }
    });
  }, [batchActionMutation]);

  const marcarAcaoSeller = useCallback((items: string[], necessaria: boolean) => {
    batchActionMutation.mutate({
      action: 'seller_action',
      items,
      data: { acao_seller_necessaria: necessaria }
    });
  }, [batchActionMutation]);

  // ===== FUNÇÕES DE FILTRO =====
  const atualizarFiltros = useCallback((novosFiltros: Partial<DevolucaoFiltrosAvancados>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      search: '',
      status: 'all',
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      accountIds: config.integration_account_ids
    });
  }, [config.integration_account_ids]);

  // ===== FUNÇÕES DE VIEW =====
  const alterarViewMode = useCallback((mode: DevolucaoViewMode) => {
    setViewMode(mode);
    setViewConfig(prev => ({ ...prev, mode }));
  }, []);

  const alterarOrdenacao = useCallback((field: string, direction: 'asc' | 'desc') => {
    setViewConfig(prev => ({ 
      ...prev, 
      sort_field: field, 
      sort_direction: direction 
    }));
  }, []);

  // ===== RETORNO DO HOOK =====
  return {
    // Dados
    devolucoes,
    metricas,
    isLoading,
    error,

    // Estados
    filtros,
    viewConfig,
    viewMode,
    selectedItems,

    // Fase 2 Integration
    fase2,

    // Ações de dados
    refetch,
    marcarComoLidas,
    atualizarPrioridade,
    marcarAcaoSeller,

    // Ações de filtro
    atualizarFiltros,
    limparFiltros,

    // Ações de view
    alterarViewMode,
    alterarOrdenacao,
    setSelectedItems,

    // Estados de loading
    isLoadingAction: batchActionMutation.isPending,
    isEnriching: enrichDataMutation.isPending,

    // Ações de enriquecimento
    enriquecerDadosManual
  };
}