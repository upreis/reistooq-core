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

// Mock de contas ML (substituir por hook real depois)
const useMLAccounts = () => {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);
      
      if (data) setAccounts(data);
    };
    
    fetchAccounts();
  }, []);
  
  return { accounts };
};

export default function VendasOnline() {
  const queryClient = useQueryClient();
  const { orders, pagination, isLoading, setPage, setItemsPerPage, updateFilters: updateStoreFilters, setOrders, anotacoes, setAnotacao } = useVendasStore();
  const { isSidebarCollapsed } = useSidebarUI();
  const { accounts } = useMLAccounts();

  // 🎯 FASE 2: SISTEMA UNIFICADO DE FILTROS (URL + Cache)
  const filtersManager = useVendasFiltersUnified();
  const { filters, updateFilter, updateFilters, persistentCache } = filtersManager;
  
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
  
  // 🎯 FASE 2: RESTAURAR CACHE + APLICAR FILTROS DA URL na montagem
  // ✅ CORREÇÃO PROBLEMA 2: Validar cache antes de restaurar (evita race condition com 0 vendas)
  useEffect(() => {
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      const cached = persistentCache.persistedState;
      
      // ✅ SÓ restaurar se cache tem dados válidos (evita zerar store)
      if (cached.vendas && cached.vendas.length > 0) {
        console.log('📦 [VENDAS] Restaurando cache válido:', cached.vendas.length, 'vendas');
        setOrders(cached.vendas, cached.vendas.length);
        setPage(cached.currentPage);
        setItemsPerPage(cached.itemsPerPage);
      } else {
        console.log('⚠️ [VENDAS] Cache vazio ignorado, aguardando busca manual');
      }
    }
  }, [persistentCache.isStateLoaded, persistentCache.persistedState]);
  
  // ✅ AUTO-SELECIONAR CONTAS na primeira visita
  useEffect(() => {
    if (persistentCache.isStateLoaded && accounts && accounts.length > 0) {
      // Se há cache OU filtros na URL, não auto-selecionar
      if (persistentCache.persistedState || filters.selectedAccounts.length > 0) {
        return;
      }
      
      // Se não há cache E não há seleção, auto-selecionar todas (primeira visita)
      if (filters.selectedAccounts.length === 0) {
        const accountIds = accounts.map(acc => acc.id);
        updateFilter('selectedAccounts', accountIds);
      }
    }
  }, [persistentCache.isStateLoaded, accounts, persistentCache.persistedState, filters.selectedAccounts.length]);
  
  // ✅ CORREÇÃO PROBLEMA 3: Resetar shouldFetch quando filtros mudam (força busca manual)
  useEffect(() => {
    const currentFiltersKey = JSON.stringify({
      accounts: filters.selectedAccounts,
      periodo: filters.periodo
    });
    
    // Se filtros mudaram E já houve busca anterior, resetar shouldFetch
    if (previousFiltersRef.current && previousFiltersRef.current !== currentFiltersKey) {
      console.log('🔄 [VENDAS] Filtros mudaram - resetando shouldFetch para aguardar clique');
      setShouldFetch(false);
    }
    
    previousFiltersRef.current = currentFiltersKey;
  }, [filters.selectedAccounts, filters.periodo]);
  
  // ✅ Disparar refetch quando shouldFetch muda
  useEffect(() => {
    if (shouldFetch && filters.selectedAccounts.length > 0) {
      refetch();
    }
  }, [shouldFetch, filters.selectedAccounts.length]);
  
  // ✅ CORREÇÃO PROBLEMA 1: Salvar cache via useEffect (igual /reclamacoes)
  // Reage ao 'data' do hook quando tem dados novos, não usa closure stale
  useEffect(() => {
    if (data?.orders?.length && shouldFetch) {
      console.log('💾 [VENDAS] Salvando no cache via useEffect:', data.orders.length);
      
      // ✅ ENRIQUECER COM account_name antes de salvar cache
      const ordersEnriquecidos = data.orders.map((order: any) => ({
        ...order,
        account_name: accountsMap.get(order.integration_account_id || filters.selectedAccounts[0])?.name || '-'
      }));
      
      persistentCache.saveDataCache(
        ordersEnriquecidos,
        filters.selectedAccounts,
        { search: filters.searchTerm, periodo: filters.periodo },
        pagination.currentPage,
        pagination.itemsPerPage,
        Array.from(columnManager.state.visibleColumns)
      );
      
      // ✅ Resetar estados após salvar
      setIsManualSearching(false);
      setShouldFetch(false);
    }
  }, [data?.orders, shouldFetch, accountsMap, filters.selectedAccounts, filters.searchTerm, filters.periodo, pagination.currentPage, pagination.itemsPerPage, columnManager.state.visibleColumns, persistentCache]);
  
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
    
    // Invalidar cache para forçar nova busca
    await queryClient.invalidateQueries({ 
      queryKey: ['ml-orders-cache', filters.selectedAccounts.slice().sort().join(',')]
    });
  };
  
  // ✅ CANCELAR BUSCA
  const handleCancelarBusca = () => {
    queryClient.cancelQueries({ queryKey: ['vendas-ml'] });
    setIsManualSearching(false);
    setShouldFetch(false);
  };

  // Enriquecer vendas com status_analise_local E account_name
  const vendasEnriquecidas = useMemo(() => {
    return orders.map(venda => ({
      ...venda,
      status_analise_local: analiseStatus[venda.id.toString()] || 'pendente' as StatusAnalise,
      // ✅ CORREÇÃO: Priorizar account_name já existente nos dados (cache)
      // Só fazer lookup no accountsMap se não existir
      account_name: (venda as any).account_name || accountsMap.get((venda as any).integration_account_id || filters.selectedAccounts[0])?.name || '-'
    }));
  }, [orders, analiseStatus, accountsMap, filters.selectedAccounts]);
  
  // 🎯 FASE 4: MÉTRICAS AGREGADAS
  const metrics = useVendasAggregator(vendasEnriquecidas, analiseStatus);
  
  // Filtrar vendas por aba ativa (Ativas vs Histórico)
  const vendasFiltradasPorAba = useMemo(() => {
    let resultado = vendasEnriquecidas;
    
    // Filtro por aba
    if (activeTab === 'ativas') {
      resultado = resultado.filter(v => 
        STATUS_ATIVOS.includes(v.status_analise_local)
      );
    } else {
      resultado = resultado.filter(v => 
        STATUS_HISTORICO.includes(v.status_analise_local)
      );
    }
    
    // Aplicar filtro do resumo (badges clicáveis)
    if (filtroResumoAtivo) {
      const hoje = new Date();
      
      switch (filtroResumoAtivo.tipo) {
        case 'prazo':
          resultado = resultado.filter(v => {
            if (!v.date_created) return false;
            const dataCriacao = parseISO(v.date_created);
            const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
            
            if (filtroResumoAtivo.valor === 'vencido') {
              return diasUteis > 3;
            } else if (filtroResumoAtivo.valor === 'a_vencer') {
              return diasUteis >= 0 && diasUteis <= 3;
            }
            return false;
          });
          break;
          
        case 'mediacao':
          resultado = resultado.filter(v => 
            v.tags?.includes('mediacao') || v.status === 'mediation'
          );
          break;
          
        case 'tipo':
          if (filtroResumoAtivo.valor === 'venda') {
            resultado = resultado.filter(v => 
              v.status === 'paid' || v.status === 'confirmed'
            );
          } else if (filtroResumoAtivo.valor === 'cancel') {
            resultado = resultado.filter(v => 
              v.status === 'cancelled'
            );
          }
          break;
      }
    }
    
    return resultado;
  }, [vendasEnriquecidas, activeTab, filtroResumoAtivo]);
  
  // Contadores de abas
  const countAtivas = vendasEnriquecidas.filter(v => 
    STATUS_ATIVOS.includes(v.status_analise_local)
  ).length;
  
  const countHistorico = vendasEnriquecidas.filter(v => 
    STATUS_HISTORICO.includes(v.status_analise_local)
  ).length;
  
  // Calcular estatísticas (baseado em vendas filtradas por aba)
  const stats = {
    total: vendasFiltradasPorAba.length,
    pending: vendasFiltradasPorAba.filter(o => o.status === 'payment_in_process').length,
    completed: vendasFiltradasPorAba.filter(o => o.status === 'paid').length,
    revenue: vendasFiltradasPorAba.reduce((sum, o) => sum + o.total_amount, 0)
  };

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
