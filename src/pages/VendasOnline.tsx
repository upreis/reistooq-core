/**
 * 📦 VENDAS ONLINE - Página Principal
 * Gerenciamento completo de vendas do Mercado Livre
 */

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { VendasFilterBar } from '@/features/vendas-online/components/VendasFilterBar';
import { VendasOnlineTable } from '@/features/vendas-online/components/VendasOnlineTable';
import { VendasPaginationFooter } from '@/features/vendas-online/components/VendasPaginationFooter';
import { VendasResumo, type FiltroResumo } from '@/features/vendas-online/components/VendasResumo';
import { useVendasData } from '@/features/vendas-online/hooks/useVendasData';
import { useVendasStore } from '@/features/vendas-online/store/vendasStore';
import { usePersistentVendasState } from '@/features/vendas-online/hooks/usePersistentVendasState';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useVendaStorage } from '@/features/vendas-online/hooks/useVendaStorage';
import type { StatusAnalise } from '@/features/vendas-online/types/venda-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '@/features/vendas-online/types/venda-analise.types';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import { VENDAS_ALL_COLUMNS, VENDAS_DEFAULT_VISIBLE_COLUMNS } from '@/features/vendas-online/config/vendas-columns-config';

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
  const { orders, pagination, isLoading, setPage, setItemsPerPage, updateFilters, setOrders } = useVendasStore();
  const { isSidebarCollapsed } = useSidebarUI();
  const { accounts } = useMLAccounts();
  
  // 💾 PERSISTÊNCIA DE ESTADO
  const persistentCache = usePersistentVendasState();
  
  // 💾 STORAGE DE ANÁLISE (localStorage)
  const {
    analiseStatus,
    setAnaliseStatus
  } = useVendaStorage();
  
  // Estados de filtros manuais
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState('60');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(VENDAS_DEFAULT_VISIBLE_COLUMNS);
  
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
  
  // ✅ Hook de dados com controle manual
  const { data, isLoading: loadingVendas, error, refetch } = useVendasData(shouldFetch);
  
  // ✅ RESTAURAR CACHE na montagem
  useEffect(() => {
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      const cached = persistentCache.persistedState;
      
      console.log('📦 Restaurando cache:', {
        vendas: cached.vendas.length,
        contas: cached.selectedAccounts.length,
        periodo: cached.filters.periodo
      });
      
      // Restaurar filtros
      setSelectedAccountIds(cached.selectedAccounts);
      setPeriodo(cached.filters.periodo);
      setSearchTerm(cached.filters.search);
      if (cached.visibleColumns) {
        setVisibleColumns(cached.visibleColumns);
      }
      
      // Restaurar dados da última busca
      setOrders(cached.vendas, cached.vendas.length);
      setPage(cached.currentPage);
      setItemsPerPage(cached.itemsPerPage);
    }
  }, [persistentCache.isStateLoaded, persistentCache.persistedState]);
  
  // ✅ AUTO-SELECIONAR CONTAS na primeira visita
  useEffect(() => {
    if (persistentCache.isStateLoaded && accounts && accounts.length > 0) {
      // Se há cache, contas já foram restauradas
      if (persistentCache.persistedState) {
        return;
      }
      
      // Se não há cache E não há seleção, auto-selecionar todas (primeira visita)
      if (selectedAccountIds.length === 0) {
        const accountIds = accounts.map(acc => acc.id);
        setSelectedAccountIds(accountIds);
        console.log('✨ Contas auto-selecionadas (primeira visita):', accountIds.length);
      }
    }
  }, [persistentCache.isStateLoaded, accounts, persistentCache.persistedState, selectedAccountIds.length]);
  
  // ✅ Disparar refetch quando shouldFetch muda
  useEffect(() => {
    if (shouldFetch && selectedAccountIds.length > 0) {
      console.log('🔄 Disparando refetch manual...');
      refetch();
    }
  }, [shouldFetch, selectedAccountIds.length]);
  
  // 🔥 FUNÇÃO DE BUSCA MANUAL
  const handleBuscar = async () => {
    console.log('🔍 Iniciando busca manual:', { selectedAccountIds, periodo, searchTerm });
    
    if (selectedAccountIds.length === 0) {
      console.warn('⚠️ Nenhuma conta selecionada');
      return;
    }
    
    setIsManualSearching(true);
    
    // Calcular dateFrom baseado no período
    const dateFrom = periodo 
      ? new Date(Date.now() - parseInt(periodo) * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    // Atualizar filtros na store
    updateFilters({
      integrationAccountId: selectedAccountIds[0],
      search: searchTerm,
      dateFrom,
      dateTo: new Date().toISOString()
    });
    
    // Ativar busca
    setShouldFetch(true);
    
    // Aguardar busca completar e salvar cache
    setTimeout(() => {
      if (orders.length > 0) {
        persistentCache.saveDataCache(
          orders,
          selectedAccountIds,
          { search: searchTerm, periodo },
          pagination.currentPage,
          pagination.itemsPerPage,
          visibleColumns
        );
      }
      setIsManualSearching(false);
      setShouldFetch(false);
    }, 2000);
  };
  
  // ✅ CANCELAR BUSCA
  const handleCancelarBusca = () => {
    console.log('🛑 Cancelando busca...');
    queryClient.cancelQueries({ queryKey: ['vendas-ml'] });
    setIsManualSearching(false);
    setShouldFetch(false);
  };
  
  // Enriquecer vendas com status_analise_local do localStorage
  const vendasEnriquecidas = useMemo(() => {
    return orders.map(venda => ({
      ...venda,
      status_analise_local: analiseStatus[venda.id.toString()] || 'pendente' as StatusAnalise
    }));
  }, [orders, analiseStatus]);
  
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
    <div className="w-full pb-20">
      <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Header - SEM py-6 */}
          <div className="px-4 md:px-6">
            <h1 className="text-3xl font-bold">Vendas Online</h1>
          </div>
          
          {/* Tabs: Ativas vs Histórico + Filtros na mesma linha */}
          <div className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
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
                    selectedAccountIds={selectedAccountIds}
                    onAccountsChange={setSelectedAccountIds}
                    periodo={periodo}
                    onPeriodoChange={setPeriodo}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onBuscar={handleBuscar}
                    onCancel={handleCancelarBusca}
                    isLoading={isManualSearching}
                    allColumns={VENDAS_ALL_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                  />
                </div>
              </div>
              
              {/* Resumo de Métricas - após as abas com mt-12 */}
              <div className="mt-12">
                <VendasResumo 
                  vendas={vendasEnriquecidas}
                  onFiltroClick={setFiltroResumoAtivo}
                  filtroAtivo={filtroResumoAtivo}
                />
              </div>
            </Tabs>
          </div>
          
          {/* Table */}
          <div className="px-4 md:px-6">
            <VendasOnlineTable 
              onStatusChange={handleStatusChange}
              activeTab={activeTab}
            />
          </div>
          
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
