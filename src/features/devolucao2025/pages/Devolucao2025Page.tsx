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
import { Devolucao2025Filters } from '../components/Devolucao2025Filters';
import { Devolucao2025Stats } from '../components/Devolucao2025Stats';
import { Devolucao2025Pagination } from '../components/Devolucao2025Pagination';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { DevolucaoAlertsPanel } from '../components/DevolucaoAlertsPanel';
import { DevolucaoAlertsBadge } from '../components/DevolucaoAlertsBadge';
import { useDevolucaoAlerts } from '../hooks/useDevolucaoAlerts';
import { ColumnSelector } from '../components/ColumnSelector';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { COLUMNS_CONFIG } from '../config/columns';
import { ExportButton } from '../components/ExportButton';
import { usePersistentDevolucoesState } from '../hooks/usePersistentDevolucoesState';
import { RefreshCw } from 'lucide-react';

export const Devolucao2025Page = () => {
  // Estado de persistência
  const persistentCache = usePersistentDevolucoesState();
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
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

  // Paginação dos dados (com filtro para remover linhas sem comprador ou produto)
  const paginatedDevolucoes = useMemo(() => {
    // Filtrar devoluções sem comprador ou produto
    const filteredDevolucoes = devolucoes.filter(dev => 
      dev.comprador_nome_completo && dev.produto_titulo
    );
    
    if (itemsPerPage === -1) return filteredDevolucoes; // "Todas"
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDevolucoes.slice(startIndex, startIndex + itemsPerPage);
  }, [devolucoes, currentPage, itemsPerPage]);

  const filteredCount = useMemo(() => 
    devolucoes.filter(dev => dev.comprador_nome_completo && dev.produto_titulo).length, 
    [devolucoes]
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

  // Sistema de Alertas
  const { alerts, totalAlerts, alertsByType } = useDevolucaoAlerts(devolucoes);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto m-0">
        <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Header */}
          <div className="px-4 md:px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-3xl font-bold">Devoluções de Vendas</h1>
                    <p className="text-muted-foreground">
                      Gestão completa com {devolucoes.length} devoluções
                    </p>
                  </div>
                  <DevolucaoAlertsBadge alertsByType={alertsByType} />
                </div>
              </div>
              
              {/* Painel de Alertas - Posicionado no canto direito */}
              <div className="w-full max-w-sm shrink-0">
                {totalAlerts > 0 && (
                  <DevolucaoAlertsPanel alerts={alerts} totalAlerts={totalAlerts} />
                )}
              </div>
              
              <NotificationsBell organizationId={organizationId} />
            </div>
          </div>
          
          {/* Filtros e Cards */}
          <div className="px-4 md:px-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Devolucao2025Filters
                    accounts={accounts}
                    selectedAccounts={selectedAccounts}
                    onAccountsChange={setSelectedAccounts}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onApplyFilters={handleApplyFilters}
                    onCancelSearch={handleCancelSearch}
                    isLoading={isLoading}
                  />
                  <ColumnSelector 
                    columns={COLUMNS_CONFIG}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                  />
                  <ExportButton 
                    data={devolucoes}
                    visibleColumns={visibleColumns}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Tabela */}
          <div className="px-4 md:px-6">
            <Card className="p-6 flex-1 flex flex-col">
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
              />

              {!isLoading && !error && devolucoes.length > 0 && (
                <Devolucao2025Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={devolucoes.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
