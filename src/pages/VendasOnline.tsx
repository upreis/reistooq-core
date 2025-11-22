/**
 * 📦 VENDAS ONLINE - Página Principal
 * 🎯 EVOLUÍDA: Fases 1-4 completas
 * 
 * FASE 1: Cache Validation e Versionamento ✅
 * FASE 2: URL Parameters Sync ✅
 * FASE 3: Advanced Column Management ✅
 * FASE 4: Analytics & Polling ✅
 * 
 * Gerenciamento completo de vendas do Mercado Livre
 */

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { VendasFilterBar } from '@/features/vendas-online/components/VendasFilterBar';
import { VendasOnlineTable } from '@/features/vendas-online/components/VendasOnlineTable';
import { VendasPaginationFooter } from '@/features/vendas-online/components/VendasPaginationFooter';
import { VendasResumo, type FiltroResumo } from '@/features/vendas-online/components/VendasResumo';
import { VendasAnotacoesModal } from '@/features/vendas-online/components/modals/VendasAnotacoesModal';
import { useVendasData } from '@/features/vendas-online/hooks/useVendasData';
import { useVendasStore } from '@/features/vendas-online/store/vendasStore';
import { useVendasFiltersUnified } from '@/features/vendas-online/hooks/useVendasFiltersUnified'; // 🎯 FASE 2
import { useSidebarUI } from '@/context/SidebarUIContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useVendaStorage } from '@/features/vendas-online/hooks/useVendaStorage';
import type { StatusAnalise } from '@/features/vendas-online/types/venda-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '@/features/vendas-online/types/venda-analise.types';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import { VENDAS_ALL_COLUMNS, VENDAS_DEFAULT_VISIBLE_COLUMNS } from '@/features/vendas-online/config/vendas-columns-config';
import { useVendasColumnManager } from '@/features/vendas-online/hooks/useVendasColumnManager'; // 🎯 FASE 3
import { useVendasPolling } from '@/features/vendas-online/hooks/useVendasPolling'; // 🎯 FASE 4
import { useVendasAggregator } from '@/features/vendas-online/hooks/useVendasAggregator'; // 🎯 FASE 4
import { toast } from 'sonner'; // 🎯 FASE 4
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
  
  // 🎯 FASE 3: FILTRAR COLUNAS VISÍVEIS (Padrão /reclamacoes)
  const visibleColumnKeys = useMemo(() => {
    const keysArray = Array.from(columnManager.state.visibleColumns);
    console.log('🔄 [VendasOnline] visibleColumnKeys recalculado:', {
      count: keysArray.length,
      keys: keysArray
    });
    return keysArray;
  }, [columnManager.state.visibleColumns.size, Array.from(columnManager.state.visibleColumns).join(',')]);

  console.log('🎯 [VendasOnline] Colunas visíveis:', {
    count: visibleColumnKeys.length,
    keys: visibleColumnKeys
  });
  
  // 🎯 FASE 4: POLLING AUTOMÁTICO
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const { forceRefresh, isPolling } = useVendasPolling({
    enabled: pollingEnabled,
    interval: 60000, // 1 minuto
    onNewData: (count) => {
      if (count > 0) {
        toast.success(`${count} nova${count > 1 ? 's' : ''} venda${count > 1 ? 's' : ''} detectada${count > 1 ? 's' : ''}!`);
      }
    }
  });
  
  // ✅ CONTROLE MANUAL DE BUSCA
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  
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
  
  // ✅ Hook de dados com controle manual (passar contas selecionadas)
  const { data, isLoading: loadingVendas, error, refetch } = useVendasData(shouldFetch, filters.selectedAccounts);
  
  // 🔥 CORREÇÃO: Resetar isManualSearching quando loadingVendas terminar
  useEffect(() => {
    if (!loadingVendas && isManualSearching) {
      setIsManualSearching(false);
    }
  }, [loadingVendas]);
  
  // 🎯 FASE 2: RESTAURAR CACHE + APLICAR FILTROS DA URL na montagem
  useEffect(() => {
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      const cached = persistentCache.persistedState;
      
      console.log('📦 [VENDAS] Restaurando cache:', {
        vendas: cached.vendas.length,
        contas: cached.selectedAccounts.length,
        periodo: cached.filters.periodo
      });
      
      // Restaurar dados da última busca
      setOrders(cached.vendas, cached.vendas.length);
      setPage(cached.currentPage);
      setItemsPerPage(cached.itemsPerPage);
      
      // 🎯 FASE 3: Colunas gerenciadas pelo columnManager (persistência automática)
      // Não precisa restaurar manualmente - columnManager já faz isso
      
      // 🎯 FASE 2: Filtros já foram restaurados pelo useVendasFiltersUnified
      console.log('🔗 [VENDAS] Filtros ativos:', filters);
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
        console.log('✨ [VENDAS] Contas auto-selecionadas (primeira visita):', accountIds.length);
      }
    }
  }, [persistentCache.isStateLoaded, accounts, persistentCache.persistedState, filters.selectedAccounts.length]);
  
  // ✅ Disparar refetch quando shouldFetch muda
  useEffect(() => {
    if (shouldFetch && filters.selectedAccounts.length > 0) {
      console.log('🔄 [VENDAS] Disparando refetch manual...');
      refetch();
    }
  }, [shouldFetch, filters.selectedAccounts.length]);
  
  // 🔥 FUNÇÃO DE BUSCA MANUAL
  const handleBuscar = async () => {
    console.log('🔍 [VENDAS] Iniciando busca manual:', {
      selectedAccounts: filters.selectedAccounts,
      periodo: filters.periodo,
      searchTerm: filters.searchTerm
    });
    
    if (filters.selectedAccounts.length === 0) {
      console.warn('⚠️ [VENDAS] Nenhuma conta selecionada');
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
    
    console.log('📅 [VENDAS] Período calculado:', {
      periodo: filters.periodo,
      dateFrom,
      dateTo
    });
    
    // ✅ Atualizar filtros no store com datas calculadas
    updateStoreFilters({
      search: filters.searchTerm,
      dateFrom,
      dateTo
    });
    
    // Ativar busca
    setShouldFetch(true);
    
    // 🎯 MÉDIO 4: Aguardar query concluir antes de salvar cache
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.query?.queryKey?.[0] === 'vendas-ml' &&
        event.type === 'updated' &&
        event.query.state.status === 'success'
      ) {
        // ✅ ENRIQUECER COM account_name antes de salvar cache
        const ordersEnriquecidos = orders.map(order => ({
          ...order,
          account_name: accountsMap.get((order as any).integration_account_id || filters.selectedAccounts[0])?.name || '-'
        }));
        
        persistentCache.saveDataCache(
          ordersEnriquecidos,
          filters.selectedAccounts,
          { search: filters.searchTerm, periodo: filters.periodo },
          pagination.currentPage,
          pagination.itemsPerPage,
          Array.from(columnManager.state.visibleColumns)
        );
        setIsManualSearching(false);
        setShouldFetch(false);
        unsubscribe();
      }
    });
  };
  
  // ✅ CANCELAR BUSCA
  const handleCancelarBusca = () => {
    console.log('🛑 Cancelando busca...');
    queryClient.cancelQueries({ queryKey: ['vendas-ml'] });
    setIsManualSearching(false);
    setShouldFetch(false);
  };
  
  // ✅ Criar mapa de contas para lookup rápido
  const accountsMap = useMemo(() => {
    const map = new Map();
    accounts.forEach(acc => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  // Enriquecer vendas com status_analise_local E account_name
  const vendasEnriquecidas = useMemo(() => {
    return orders.map(venda => ({
      ...venda,
      status_analise_local: analiseStatus[venda.id.toString()] || 'pendente' as StatusAnalise,
      // ✅ ADICIONAR account_name seguindo padrão /reclamacoes
      account_name: accountsMap.get((venda as any).integration_account_id || filters.selectedAccounts[0])?.name || '-'
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

  // Console de métricas para debug
  useEffect(() => {
    if (metrics.total > 0) {
      console.log('📊 [VENDAS ANALYTICS]', {
        total: metrics.total,
        ativas: metrics.totalAtivas,
        historico: metrics.totalHistorico,
        valorTotal: `R$ ${metrics.valorTotal.toFixed(2)}`,
        valorMedio: `R$ ${metrics.valorMedio.toFixed(2)}`,
        polling: isPolling ? '🔄 Ativo' : '⏸️ Pausado'
      });
    }
  }, [metrics, isPolling]);

  return (
    <div className="w-full">
      <div className="pb-20">
          {/* Sub-navegação */}
          <div className="px-4 md:px-6">
            <MLOrdersNav />
          </div>
          
          {/* Header com controle de polling */}
          <div className="px-4 md:px-6 py-3 mt-2 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Vendas Online</h1>
            
            {/* 🎯 FASE 4: Controle de Polling */}
            <div className="flex items-center gap-2">
              <Button
                variant={pollingEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setPollingEnabled(!pollingEnabled)}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
                {pollingEnabled ? 'Auto-Atualização Ativa' : 'Ativar Auto-Atualização'}
              </Button>
              
              {!pollingEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={forceRefresh}
                  className="h-8"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Agora
                </Button>
              )}
            </div>
          </div>
          
          
          {/* Tabs: Ativas vs Histórico + Filtros na mesma linha */}
          <div className="px-4 md:px-6 mt-2">
            <Tabs value={activeTab} onValueChange={(v) => {
              console.log('🔄 Mudando aba para:', v);
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
                onPageChange={setPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </div>
    </div>
  );
}
