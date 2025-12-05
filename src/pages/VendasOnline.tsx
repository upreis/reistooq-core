/**
 * 📦 VENDAS CANCELADAS - Página Principal
 * 🎯 EVOLUÍDA: Fases 1-4 completas
 * 
 * FASE 1: Cache Validation e Versionamento ✅
 * FASE 2: URL Parameters Sync ✅
 * FASE 3: Advanced Column Management ✅
 * FASE 4: Analytics & Polling ✅
 * 
 * Gerenciamento completo de vendas canceladas do Mercado Livre
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { VendasFilterBar } from '@/features/vendas-online/components/VendasFilterBar';
import { VendasOnlineTable } from '@/features/vendas-online/components/VendasOnlineTable';
import { VendasPaginationFooter } from '@/features/vendas-online/components/VendasPaginationFooter';
import { VendasResumo, type FiltroResumo } from '@/features/vendas-online/components/VendasResumo';
import { VendasAnotacoesModal } from '@/features/vendas-online/components/modals/VendasAnotacoesModal';
import { useVendasData } from '@/features/vendas-online/hooks/useVendasData';
import { useVendasStore } from '@/features/vendas-online/store/vendasStore';
import { useVendasFiltersUnified } from '@/features/vendas-online/hooks/useVendasFiltersUnified';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useVendaStorage } from '@/features/vendas-online/hooks/useVendaStorage';
import type { StatusAnalise } from '@/features/vendas-online/types/venda-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '@/features/vendas-online/types/venda-analise.types';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import { useVendasColumnManager } from '@/features/vendas-online/hooks/useVendasColumnManager';
import { useVendasAggregator } from '@/features/vendas-online/hooks/useVendasAggregator';
import { LoadingIndicator } from '@/components/pedidos/LoadingIndicator';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
}

// 🔧 CORREÇÃO: Hook com React Query (igual /reclamacoes)
import { useQuery } from '@tanstack/react-query';

const useMLAccounts = () => {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['ml-accounts-vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as MLAccount[];
    },
  });
  
  return { accounts, isLoading };
};

export default function VendasOnline() {
  const queryClient = useQueryClient();
  const { orders, pagination, isLoading, setPage, setItemsPerPage, updateFilters: updateStoreFilters, setOrders, anotacoes, setAnotacao } = useVendasStore();
  const { isSidebarCollapsed } = useSidebarUI();
  const { accounts } = useMLAccounts();

  // 🎯 FASE 2: SISTEMA UNIFICADO DE FILTROS (URL Sync)
  const filtersManager = useVendasFiltersUnified();
  const { filters, updateFilter, updateFilters } = filtersManager;
  
  // 💾 STORAGE DE ANÁLISE (localStorage)
  const {
    analiseStatus,
    setAnaliseStatus
  } = useVendaStorage();
  
  // Modal de anotações
  const [anotacoesModalOpen, setAnotacoesModalOpen] = useState(false);
  const [selectedOrderForAnotacoes, setSelectedOrderForAnotacoes] = useState<any | null>(null);
  
  // 🎯 FASE 3: COLUMN MANAGER AVANÇADO
  const columnManager = useVendasColumnManager();
  
  // 🎯 FASE 3: FILTRAR COLUNAS VISÍVEIS - CORREÇÃO: usar referência estável
  const visibleColumnsSet = columnManager.state.visibleColumns;
  const visibleColumnKeys = useMemo(() => {
    return Array.from(visibleColumnsSet);
  }, [visibleColumnsSet]);
  
  
  // ✅ CONTROLE MANUAL DE BUSCA
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // ✅ CORREÇÃO PROBLEMA 3: Ref para trackear filtros anteriores (igual /reclamacoes)
  const previousFiltersRef = useRef<string>('');
  
  // Estado de abas
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  
  // Estado de filtro ativo do resumo
  const [filtroResumoAtivo, setFiltroResumoAtivo] = useState<FiltroResumo | null>(null);

  // Handler para mudança de status de análise
  const handleStatusChange = (orderId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(orderId, newStatus);
  };
  
  // Handler para abrir modal de anotações
  const handleOpenAnotacoes = (order: any) => {
    setSelectedOrderForAnotacoes(order);
    setAnotacoesModalOpen(true);
  };
  
  // ✅ Criar mapa de contas para lookup rápido (DEVE VIR ANTES dos useEffects que usam)
  const accountsMap = useMemo(() => {
    const map = new Map();
    accounts.forEach(acc => map.set(acc.id, acc));
    return map;
  }, [accounts]);
  
  // ✅ Hook de dados com controle manual (passar contas selecionadas)
  const { data, isLoading: loadingVendas, error, refetch } = useVendasData(shouldFetch, filters.selectedAccounts);
  
  // 🔥 CORREÇÃO: Resetar isManualSearching quando loadingVendas terminar
  useEffect(() => {
    if (!loadingVendas && isManualSearching) {
      setIsManualSearching(false);
    }
  }, [loadingVendas]);
  
  // ✅ SIMPLIFICADO (igual /reclamacoes): Store Zustand já restaura automaticamente
  // Não há necessidade de useEffect adicional para restaurar cache
  // vendasStore.loadPersistedState() já faz isso na inicialização
  
  // ✅ AUTO-SELECIONAR CONTAS na primeira visita (igual /reclamacoes)
  useEffect(() => {
    if (accounts && accounts.length > 0 && filters.selectedAccounts.length === 0) {
      const accountIds = accounts.map(acc => acc.id);
      updateFilter('selectedAccounts', accountIds);
    }
  }, [accounts, filters.selectedAccounts.length, updateFilter]);
  
  // ✅ CORREÇÃO PROBLEMA 3: Resetar shouldFetch quando filtros mudam (força busca manual)
  useEffect(() => {
    const currentFiltersKey = JSON.stringify({
      accounts: filters.selectedAccounts,
      periodo: filters.periodo
    });
    
    // Se filtros mudaram E já houve busca anterior, resetar shouldFetch
    if (previousFiltersRef.current && previousFiltersRef.current !== currentFiltersKey) {
      setShouldFetch(false);
    }
    
    previousFiltersRef.current = currentFiltersKey;
  }, [filters.selectedAccounts, filters.periodo]);
  
  // 🔧 CORREÇÃO #2: REMOVIDO useEffect redundante que chamava refetch()
  // useVendasData já usa `enabled: shouldFetch` - React Query dispara automaticamente
  
  // 🔧 CORREÇÃO #6: useEffect SEPARADO - apenas salvar no store (igual /reclamacoes)
  useEffect(() => {
    if (data?.orders?.length && shouldFetch) {
      // ✅ ENRIQUECER COM account_name antes de salvar
      const ordersEnriquecidos = data.orders.map((order: any) => ({
        ...order,
        account_name: accountsMap.get(order.integration_account_id || (filters.selectedAccounts || [])[0])?.name || '-'
      }));
      
      // ✅ Salvar no store (que persiste automaticamente)
      setOrders(ordersEnriquecidos, data.total);
      
      console.log('💾 [VENDAS] Salvando no Store:', ordersEnriquecidos.length);
    }
  }, [data?.orders, shouldFetch, accountsMap, filters.selectedAccounts, setOrders]);
  
  // 🔧 CORREÇÃO #6: useEffect SEPARADO - resetar shouldFetch após dados carregarem
  useEffect(() => {
    if (data?.orders?.length && shouldFetch && !loadingVendas) {
      setShouldFetch(false);
    }
  }, [data?.orders, shouldFetch, loadingVendas]);
  
  // 🔥 FUNÇÃO DE BUSCA MANUAL (simplificada - sem subscribe)
  const handleBuscar = async () => {
    if (filters.selectedAccounts.length === 0) {
      return;
    }
    
    setIsManualSearching(true);
    
    // ✅ Calcular dateFrom baseado no período (igual /reclamacoes)
    const calcularDataInicio = (periodo: string) => {
      const hoje = new Date();
      const dias = parseInt(periodo);
      hoje.setDate(hoje.getDate() - dias);
      return hoje.toISOString();
    };
    
    const dateFrom = calcularDataInicio(filters.periodo);
    const dateTo = new Date().toISOString();
    
    // ✅ Atualizar filtros no store com datas calculadas
    updateStoreFilters({
      search: filters.searchTerm,
      dateFrom,
      dateTo
    });
    
    // ✅ Ativar busca - o useEffect acima cuida de salvar o cache quando dados chegarem
    setShouldFetch(true);
    
    // 🔧 CORREÇÃO: QueryKey CONSISTENTE com fallback para array vazio
    const accountsKey = (filters.selectedAccounts || []).slice().sort().join(',');
    const queryKey = ['ml-orders-cache', accountsKey];
    
    // Invalidar cache para forçar nova busca
    await queryClient.invalidateQueries({ queryKey });
  };
  
  // ✅ CANCELAR BUSCA - 🔧 CORREÇÃO: Usar MESMO queryKey com fallback
  const handleCancelarBusca = () => {
    const accountsKey = (filters.selectedAccounts || []).slice().sort().join(',');
    const queryKey = ['ml-orders-cache', accountsKey];
    queryClient.cancelQueries({ queryKey });
    setIsManualSearching(false);
    setShouldFetch(false);
  };

  // 🚀 OTIMIZAÇÃO: Sets para lookup O(1) ao invés de O(n)
  const STATUS_ATIVOS_SET = useMemo(() => new Set(STATUS_ATIVOS), []);
  const STATUS_HISTORICO_SET = useMemo(() => new Set(STATUS_HISTORICO), []);

  // 🚀 OTIMIZAÇÃO: Single-pass enrichment + filtering + counting
  const { vendasEnriquecidas, vendasFiltradasPorAba, countAtivas, countHistorico, stats } = useMemo(() => {
    // Early return para array vazio
    if (!orders || orders.length === 0) {
      return {
        vendasEnriquecidas: [],
        vendasFiltradasPorAba: [],
        countAtivas: 0,
        countHistorico: 0,
        stats: { total: 0, pending: 0, completed: 0, revenue: 0 }
      };
    }

    const hoje = new Date();
    const enriched: any[] = [];
    const filteredByTab: any[] = [];
    let ativasCount = 0;
    let historicoCount = 0;
    
    // Stats para vendasFiltradasPorAba
    let statsTotal = 0;
    let statsPending = 0;
    let statsCompleted = 0;
    let statsRevenue = 0;

    // 🚀 SINGLE LOOP: enrich + filter + count tudo de uma vez
    for (let i = 0; i < orders.length; i++) {
      const venda = orders[i];
      const statusAnalise = analiseStatus[venda.id.toString()] || 'pendente' as StatusAnalise;
      const accountName = (venda as any).account_name || 
        accountsMap.get((venda as any).integration_account_id || filters.selectedAccounts[0])?.name || '-';
      
      // Enriquecer
      const vendaEnriquecida = {
        ...venda,
        status_analise_local: statusAnalise,
        account_name: accountName
      };
      enriched.push(vendaEnriquecida);
      
      // Contar ativas/histórico
      const isAtiva = STATUS_ATIVOS_SET.has(statusAnalise);
      const isHistorico = STATUS_HISTORICO_SET.has(statusAnalise);
      
      if (isAtiva) ativasCount++;
      if (isHistorico) historicoCount++;
      
      // Verificar se passa no filtro de aba
      const passaFiltroAba = activeTab === 'ativas' ? isAtiva : isHistorico;
      
      if (passaFiltroAba) {
        // Verificar filtro do resumo
        let passaFiltroResumo = true;
        
        if (filtroResumoAtivo) {
          switch (filtroResumoAtivo.tipo) {
            case 'prazo':
              if (!venda.date_created) {
                passaFiltroResumo = false;
              } else {
                const dataCriacao = parseISO(venda.date_created);
                const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
                
                if (filtroResumoAtivo.valor === 'vencido') {
                  passaFiltroResumo = diasUteis > 3;
                } else if (filtroResumoAtivo.valor === 'a_vencer') {
                  passaFiltroResumo = diasUteis >= 0 && diasUteis <= 3;
                }
              }
              break;
              
            case 'mediacao':
              passaFiltroResumo = venda.tags?.includes('mediacao') || venda.status === 'mediation';
              break;
              
            case 'tipo':
              if (filtroResumoAtivo.valor === 'venda') {
                passaFiltroResumo = venda.status === 'paid' || venda.status === 'confirmed';
              } else if (filtroResumoAtivo.valor === 'cancel') {
                passaFiltroResumo = venda.status === 'cancelled';
              }
              break;
          }
        }
        
        if (passaFiltroResumo) {
          filteredByTab.push(vendaEnriquecida);
          
          // Calcular stats inline
          statsTotal++;
          if (venda.status === 'payment_in_process') statsPending++;
          if (venda.status === 'paid') statsCompleted++;
          statsRevenue += venda.total_amount || 0;
        }
      }
    }

    return {
      vendasEnriquecidas: enriched,
      vendasFiltradasPorAba: filteredByTab,
      countAtivas: ativasCount,
      countHistorico: historicoCount,
      stats: {
        total: statsTotal,
        pending: statsPending,
        completed: statsCompleted,
        revenue: statsRevenue
      }
    };
  }, [orders, analiseStatus, accountsMap, filters.selectedAccounts, activeTab, filtroResumoAtivo, STATUS_ATIVOS_SET, STATUS_HISTORICO_SET]);
  
  // 🎯 FASE 4: MÉTRICAS AGREGADAS (já otimizado com single-pass)
  const metrics = useVendasAggregator(vendasEnriquecidas, analiseStatus);

  return (
    <div className="w-full">
      <div className="pb-20">
          {/* Sub-navegação */}
          <div className="px-4 md:px-6">
            <MLOrdersNav />
          </div>
          
          {/* Espaçamento padrão - igual /reclamacoes */}
          <div className="py-3 mt-2"></div>
          
          {/* Tabs: Ativas vs Histórico + Filtros na mesma linha */}
          <div className="px-4 md:px-6 mt-2">
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as 'ativas' | 'historico');
            }}>
              <div className="flex items-center gap-3 flex-nowrap">
                <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
                  <TabsTrigger value="ativas" className="h-10">
                    Ativas ({countAtivas})
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="h-10">
                    Histórico ({countHistorico})
                  </TabsTrigger>
                </TabsList>
                
                {/* Filtros integrados na mesma linha */}
                <div className="flex-1 min-w-0">
                  <VendasFilterBar
                    accounts={accounts}
                    selectedAccountIds={filters.selectedAccounts}
                    onAccountsChange={(ids) => updateFilter('selectedAccounts', ids)}
                    periodo={filters.periodo}
                    onPeriodoChange={(p) => updateFilter('periodo', p)}
                    searchTerm={filters.searchTerm}
                    onSearchChange={(s) => updateFilter('searchTerm', s)}
                    onBuscar={handleBuscar}
                    onCancel={handleCancelarBusca}
                    isLoading={isManualSearching}
                    columnManager={columnManager} // 🎯 FASE 3
                  />
                </div>
              </div>
              
              {/* Conteúdo das Tabs */}
              <TabsContent value="ativas" className="mt-12 px-4 md:px-6">
                <VendasResumo 
                  vendas={vendasEnriquecidas}
                  onFiltroClick={setFiltroResumoAtivo}
                  filtroAtivo={filtroResumoAtivo}
                />
              </TabsContent>
              
              <TabsContent value="historico" className="mt-12 px-4 md:px-6">
                <VendasResumo 
                  vendas={vendasEnriquecidas}
                  onFiltroClick={setFiltroResumoAtivo}
                  filtroAtivo={filtroResumoAtivo}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Table com loader localizado */}
          <div className="px-4 md:px-6 mt-2 relative">
            {/* 🔄 LOADER APENAS NA ÁREA DA TABELA */}
            {(loadingVendas || isManualSearching) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                <LoadingIndicator />
              </div>
            )}
            
            <VendasOnlineTable
              onStatusChange={handleStatusChange}
              onOpenAnotacoes={handleOpenAnotacoes}
              anotacoes={anotacoes}
              activeTab={activeTab}
              visibleColumnKeys={visibleColumnKeys}
              filteredOrders={vendasFiltradasPorAba}
            />
          </div>
          
          {/* Modal de anotações */}
          {selectedOrderForAnotacoes && (
            <VendasAnotacoesModal
              open={anotacoesModalOpen}
              onOpenChange={setAnotacoesModalOpen}
              orderId={selectedOrderForAnotacoes.id.toString()}
              packId={selectedOrderForAnotacoes.pack_id}
              anotacaoAtual={anotacoes[selectedOrderForAnotacoes.id.toString()] || ''}
              onSave={setAnotacao}
            />
          )}
          
          {/* Rodapé Fixado com Paginação */}
          {!isLoading && pagination.total > 0 && (
            <div 
              className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
                isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
              } left-0`}
            >
              <VendasPaginationFooter
                totalItems={pagination.total}
                currentPage={pagination.currentPage}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={(page) => {
                  setPage(page);
                  setShouldFetch(true); // 🔧 FASE 2: Disparar busca server-side
                }}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setPage(1); // Voltar para página 1
                  setShouldFetch(true); // 🔧 FASE 2: Disparar busca server-side
                }}
              />
            </div>
          )}
        </div>
    </div>
  );
}
