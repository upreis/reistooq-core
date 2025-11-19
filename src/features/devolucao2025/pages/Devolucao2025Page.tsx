/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES DE VENDA
 * Implementação completa com 65 colunas + Sistema de Alertas + Cache Inteligente
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { Devolucao2025Table } from '../components/Devolucao2025Table';
import { Devolucao2025FilterBar } from '../components/Devolucao2025FilterBar';
import { Devolucao2025Stats } from '../components/Devolucao2025Stats';
import { Devolucao2025Resumo, FiltroResumo } from '../components/Devolucao2025Resumo';
import { Devolucao2025PaginationFooter } from '../components/Devolucao2025PaginationFooter';
import { ExportButton } from '../components/ExportButton';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { DevolucaoAlertsPanel } from '../components/DevolucaoAlertsPanel';
import { DevolucaoAlertsBadge } from '../components/DevolucaoAlertsBadge';
import { useDevolucaoAlerts } from '../hooks/useDevolucaoAlerts';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { COLUMNS_CONFIG } from '../config/columns';
import { usePersistentDevolucoesState } from '../hooks/usePersistentDevolucoesState';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevolucaoStorage } from '../hooks/useDevolucaoStorage';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '../types/devolucao-analise.types';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export const Devolucao2025Page = () => {
  const { isSidebarCollapsed } = useSidebarUI();
  
  // Estado de persistência
  const persistentCache = usePersistentDevolucoesState();
  
  // 💾 STORAGE DE ANÁLISE (localStorage)
  const {
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    removeDevolucao
  } = useDevolucaoStorage();
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [periodo, setPeriodo] = useState('60');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [filtroResumo, setFiltroResumo] = useState<FiltroResumo | null>(null);
  const [isManualSearching, setIsManualSearching] = useState(false);
  
  // Restaurar estado do cache após carregar
  useEffect(() => {
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      const cached = persistentCache.persistedState;
      setSelectedAccounts(cached.selectedAccounts || []);
      setDateRange(cached.dateRange);
      setCurrentPage(cached.currentPage);
      setItemsPerPage(cached.itemsPerPage);
      console.log('🔄 Estado restaurado do cache');
    }
  }, [persistentCache.isStateLoaded]);
  
  // Gerenciar preferências de colunas
  const { visibleColumns, setVisibleColumns } = useColumnPreferences(COLUMNS_CONFIG);

  // Buscar organization_id do usuário
  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();
        
        if (data?.organizacao_id) {
          setOrganizationId(data.organizacao_id);
        }
      }
    };
    fetchOrganization();
  }, []);

  // Buscar contas de integração
  const { data: accounts = [] } = useQuery({
    queryKey: ['integration-accounts-ml'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Buscar devoluções via Edge Function
  const { data: devolucoes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['devolucoes-2025', selectedAccounts, dateRange],
    queryFn: async () => {
      console.log('🔍 Buscando devoluções...', { selectedAccounts, dateRange });
      let result: any[] = [];
      
      // Se nenhuma conta selecionada ou todas selecionadas
      const accountsToFetch = selectedAccounts.length === 0 || selectedAccounts.length === accounts.length
        ? accounts.map(acc => acc.id)
        : selectedAccounts;
      
      const allDevolucoes = await Promise.all(
        accountsToFetch.map(async (accountId) => {
          const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
            body: {
              integration_account_id: accountId,
              date_from: dateRange.from.toISOString(),
              date_to: dateRange.to.toISOString()
            }
          });

          if (error) throw error;
          return data?.data || [];
        })
      );
      result = allDevolucoes.flat();

      // Salvar dados no cache após busca bem-sucedida
      persistentCache.saveDataCache(
        result,
        selectedAccounts,
        dateRange,
        currentPage,
        itemsPerPage,
        visibleColumns
      );

      return result;
    },
    enabled: organizationId !== null && selectedAccounts.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados considerados "frescos"
    gcTime: 30 * 60 * 1000, // 30 minutos - manter em cache do React Query
    // Inicializar com dados do localStorage se disponíveis
    initialData: () => {
      if (persistentCache.hasValidPersistedState()) {
        console.log('📦 Iniciando com dados do cache:', persistentCache.persistedState?.devolucoes.length);
        return persistentCache.persistedState?.devolucoes;
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      return persistentCache.persistedState?.cachedAt || 0;
    }
  });

  // Enriquecer devoluções com status de análise local
  const devolucoesEnriquecidas = useMemo(() => {
    return devolucoes.map(dev => ({
      ...dev,
      status_analise_local: analiseStatus[dev.order_id] || 'pendente' as StatusAnalise
    }));
  }, [devolucoes, analiseStatus]);

  // Filtrar por aba ativa
  const devolucoesFiltradasPorAba = useMemo(() => {
    if (activeTab === 'ativas') {
      return devolucoesEnriquecidas.filter(dev => 
        STATUS_ATIVOS.includes(dev.status_analise_local)
      );
    } else {
      return devolucoesEnriquecidas.filter(dev => 
        STATUS_HISTORICO.includes(dev.status_analise_local)
      );
    }
  }, [devolucoesEnriquecidas, activeTab]);

  // Aplicar filtro do resumo
  const devolucoesComFiltroResumo = useMemo(() => {
    if (!filtroResumo) return devolucoesFiltradasPorAba;
    
    const hoje = new Date();
    
    return devolucoesFiltradasPorAba.filter(dev => {
      // Filtro por prazo
      if (filtroResumo.tipo === 'prazo') {
        if (!dev.data_criacao) return false;
        const dataCriacao = parseISO(dev.data_criacao);
        const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
        
        if (filtroResumo.valor === 'vencido') {
          return diasUteis > 3;
        }
        if (filtroResumo.valor === 'a_vencer') {
          return diasUteis >= 0 && diasUteis <= 3;
        }
      }
      
      // Filtro por mediação
      if (filtroResumo.tipo === 'mediacao') {
        return dev.em_mediacao === true;
      }
      
      // Filtro por tipo
      if (filtroResumo.tipo === 'tipo') {
        if (filtroResumo.valor === 'return') {
          return dev.tipo_claim === 'return' || dev.return_id;
        }
        if (filtroResumo.valor === 'cancel') {
          return dev.status_devolucao === 'cancelled' || dev.tipo_claim === 'cancel';
        }
      }
      
      return true;
    });
  }, [devolucoesFiltradasPorAba, filtroResumo]);

  // Paginação dos dados (com filtro para remover linhas sem comprador ou produto)
  const paginatedDevolucoes = useMemo(() => {
    // Filtrar devoluções sem comprador ou produto
    const filteredDevolucoes = devolucoesComFiltroResumo.filter(dev => 
      dev.comprador_nome_completo && dev.produto_titulo
    );
    
    if (itemsPerPage === -1) return filteredDevolucoes; // "Todas"
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDevolucoes.slice(startIndex, startIndex + itemsPerPage);
  }, [devolucoesComFiltroResumo, currentPage, itemsPerPage]);

  const filteredCount = useMemo(() => 
    devolucoesComFiltroResumo.filter(dev => dev.comprador_nome_completo && dev.produto_titulo).length, 
    [devolucoesComFiltroResumo]
  );
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredCount / itemsPerPage);

  // Carregar dados em cache na inicialização
  useEffect(() => {
    if (persistentCache.isStateLoaded) {
      if (persistentCache.hasValidPersistedState()) {
        console.log('🔄 Usando cache válido, sem buscar da API');
        // React Query vai usar os dados em cache
      } else if (accounts.length > 0) {
        console.log('🔍 Sem cache válido, buscando dados...');
        refetch();
      }
    }
  }, [persistentCache.isStateLoaded, accounts.length, refetch]);

  // Atualizar cache quando página ou items por página mudar (debounced)
  useEffect(() => {
    if (devolucoes.length > 0 && persistentCache.isStateLoaded) {
      const timer = setTimeout(() => {
        persistentCache.saveDataCache(
          devolucoes,
          selectedAccounts,
          dateRange,
          currentPage,
          itemsPerPage,
          visibleColumns
        );
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, itemsPerPage, devolucoes.length, persistentCache.isStateLoaded]);

  // Handler para aplicar filtros (limpa cache e busca novos dados)
  const handleApplyFilters = useCallback(() => {
    console.log('🔄 Aplicando filtros, limpando cache...');
    persistentCache.clearPersistedState();
    refetch();
  }, [persistentCache, refetch]);

  // Handler para cancelar busca (recarrega a página)
  const handleCancelSearch = useCallback(() => {
    window.location.reload();
  }, []);

  // Handler para mudança de status de análise
  const handleStatusChange = useCallback((orderId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(orderId, newStatus);
    console.log(`✅ Status de análise atualizado: ${orderId} → ${newStatus}`);
  }, [setAnaliseStatus]);

  // Sistema de Alertas
  const { alerts, totalAlerts, alertsByType } = useDevolucaoAlerts(devolucoes);

  // Contadores para as abas
  const countAtivas = useMemo(() => 
    devolucoesEnriquecidas.filter(dev => STATUS_ATIVOS.includes(dev.status_analise_local)).length,
    [devolucoesEnriquecidas]
  );
  
  const countHistorico = useMemo(() => 
    devolucoesEnriquecidas.filter(dev => STATUS_HISTORICO.includes(dev.status_analise_local)).length,
    [devolucoesEnriquecidas]
  );

  return (
    <div className="w-full">
      <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Header */}
          <div className="px-4 md:px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold">Devoluções de Vendas</h1>
            </div>
          </div>
          
          {/* Tabs: Ativas vs Histórico + Filtros */}
          <div className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
              <div className="flex items-center gap-3 flex-nowrap">
                <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
                  <TabsTrigger value="ativas" className="h-8">
                    Ativas ({countAtivas})
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="h-8">
                    Histórico ({countHistorico})
                  </TabsTrigger>
                </TabsList>
                
                <Devolucao2025FilterBar
                  accounts={accounts}
                  selectedAccountIds={selectedAccounts}
                  onAccountsChange={setSelectedAccounts}
                  periodo={periodo}
                  onPeriodoChange={(p) => {
                    setPeriodo(p);
                    // Atualizar dateRange baseado no período
                    const hoje = new Date();
                    const inicio = new Date();
                    inicio.setDate(hoje.getDate() - parseInt(p));
                    setDateRange({ from: inicio, to: hoje });
                  }}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onBuscar={() => {
                    setIsManualSearching(true);
                    handleApplyFilters();
                  }}
                  isLoading={isManualSearching}
                  onCancel={() => {
                    setIsManualSearching(false);
                    handleCancelSearch();
                  }}
                  allColumns={COLUMNS_CONFIG}
                  visibleColumns={visibleColumns}
                  onVisibleColumnsChange={setVisibleColumns}
                />
                
                <div className="flex-shrink-0">
                  <ExportButton 
                    data={devolucoes}
                    visibleColumns={visibleColumns}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </Tabs>
          </div>

          {/* Resumo com badges clicáveis */}
          <div className="px-4 md:px-6">
            <Devolucao2025Resumo 
              devolucoes={devolucoesFiltradasPorAba}
              onFiltroClick={setFiltroResumo}
              filtroAtivo={filtroResumo}
            />
          </div>

          {/* Tabela */}
          <div className="px-4 md:px-6 pb-24"> {/* pb-24 para espaço do rodapé */}
            <Card className="p-6">
              {isLoading && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Buscando devoluções...
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Aguarde enquanto carregamos os dados do Mercado Livre
                    </p>
                  </div>
                </div>
              )}
              
              <Devolucao2025Table 
                accounts={accounts}
                devolucoes={paginatedDevolucoes}
                isLoading={isLoading}
                error={error}
                visibleColumns={visibleColumns}
                onStatusChange={handleStatusChange}
                anotacoes={anotacoes}
                activeTab={activeTab}
              />
            </Card>
          </div>

          {/* Rodapé Fixado com Paginação */}
          {!isLoading && !error && devolucoesFiltradasPorAba.length > 0 && (
            <div 
              className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
                isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
              } left-0`}
            >
              <Devolucao2025PaginationFooter
                totalItems={filteredCount}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                showFirstLastButtons={true}
                pageButtonLimit={5}
              />
            </div>
          )}
        </div>
    </div>
  );
};
