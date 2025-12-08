/**
 * 📦 VENDAS COM ENVIO - Página Principal
 * ✅ Layout igual /vendas-canceladas com abas Ativas/Histórico
 */
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useVendasComEnvioStore } from '../store/useVendasComEnvioStore';
import { 
  useVendasComEnvioFilters, 
  useVendasComEnvioData, 
  useVendasComEnvioPolling,
  useVendasComEnvioAccounts 
} from '../hooks';
import { useVendasComEnvioColumnManager } from '../hooks/useVendasComEnvioColumnManager';
import { VendasComEnvioFilterBar } from './VendasComEnvioFilterBar';
import { VendasComEnvioResumo, type FiltroResumoEnvio } from './VendasComEnvioResumo';
import { VendasComEnvioTableNew } from './VendasComEnvioTableNew';
import { VendasComEnvioPagination } from './VendasComEnvioPagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { parseISO, differenceInBusinessDays } from 'date-fns';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { StatusAnalise, STATUS_ATIVOS as STATUS_ANALISE_ATIVOS, STATUS_HISTORICO as STATUS_ANALISE_HISTORICO } from '../types/venda-analise.types';

// Status de envio que indicam "ativas" (aguardando envio)
const STATUS_ENVIO_ATIVOS = ['ready_to_ship', 'pending', 'handling'];
// Status de envio que indicam "histórico" (já processados)
const STATUS_ENVIO_HISTORICO = ['shipped', 'delivered', 'not_delivered', 'cancelled'];

// Storage key para status de análise
const STATUS_ANALISE_STORAGE_KEY = 'vendas_com_envio_analise_status';

export function VendasComEnvioPage() {
  const { accounts, isLoading: isLoadingAccounts } = useVendasComEnvioAccounts();
  const { isSidebarCollapsed } = useSidebarUI();
  
  // Column Manager
  const columnManager = useVendasComEnvioColumnManager();
  const visibleColumnKeys = useMemo(() => {
    return Array.from(columnManager.state.visibleColumns);
  }, [columnManager.state.visibleColumns]);

  const {
    vendas,
    totalCount,
    stats,
    isFetching,
    appliedFilters,
    setAppliedFilters,
  } = useVendasComEnvioStore();

  const {
    pendingFilters,
    updatePendingFilter,
    applyFilters,
    changePage,
    changeItemsPerPage,
  } = useVendasComEnvioFilters();

  const { refetch } = useVendasComEnvioData({ accounts });

  // Polling automático após primeira busca
  useVendasComEnvioPolling({ enabled: true });

  // Estado local para aba
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>(appliedFilters.activeTab || 'ativas');
  
  // Estado para filtro de resumo
  const [filtroResumoAtivo, setFiltroResumoAtivo] = useState<FiltroResumoEnvio | null>(null);

  // Estado para status de análise (persistido em localStorage)
  const [statusAnalise, setStatusAnalise] = useState<Record<string, StatusAnalise>>(() => {
    try {
      const stored = localStorage.getItem(STATUS_ANALISE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persistir status de análise em localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATUS_ANALISE_STORAGE_KEY, JSON.stringify(statusAnalise));
    } catch (e) {
      console.error('Erro ao salvar status de análise:', e);
    }
  }, [statusAnalise]);

  // Handler para mudança de status de análise
  const handleStatusAnaliseChange = useCallback((orderId: string, newStatus: StatusAnalise) => {
    setStatusAnalise(prev => ({ ...prev, [orderId]: newStatus }));
  }, []);

  // Sincronizar aba com store
  useEffect(() => {
    if (appliedFilters.activeTab !== activeTab) {
      setAppliedFilters({ ...appliedFilters, activeTab });
    }
  }, [activeTab]);

  // Contar ativas e histórico baseado no status de análise
  const countAtivas = useMemo(() => {
    return vendas.filter(v => {
      const status = statusAnalise[v.id] || 'pendente';
      return STATUS_ANALISE_ATIVOS.includes(status);
    }).length;
  }, [vendas, statusAnalise]);

  const countHistorico = useMemo(() => {
    return vendas.filter(v => {
      const status = statusAnalise[v.id] || 'pendente';
      return STATUS_ANALISE_HISTORICO.includes(status);
    }).length;
  }, [vendas, statusAnalise]);

  // Filtrar por aba baseado no status de análise
  const vendasFiltradasPorAba = useMemo(() => {
    const statusFiltro = activeTab === 'ativas' ? STATUS_ANALISE_ATIVOS : STATUS_ANALISE_HISTORICO;
    let resultado = vendas.filter(v => {
      const status = statusAnalise[v.id] || 'pendente';
      return statusFiltro.includes(status);
    });
    
    // Aplicar filtro de resumo se ativo
    if (filtroResumoAtivo) {
      const hoje = new Date();
      
      if (filtroResumoAtivo.tipo === 'prazo') {
        if (filtroResumoAtivo.valor === 'vencido') {
          resultado = resultado.filter(venda => {
            const deadline = venda.shipping_deadline || venda.date_created;
            if (!deadline) return false;
            const dataDeadline = parseISO(deadline);
            return dataDeadline < hoje;
          });
        } else if (filtroResumoAtivo.valor === 'a_vencer') {
          resultado = resultado.filter(venda => {
            const deadline = venda.shipping_deadline || venda.date_created;
            if (!deadline) return false;
            const dataDeadline = parseISO(deadline);
            const diasUteis = differenceInBusinessDays(dataDeadline, hoje);
            return diasUteis >= 0 && diasUteis <= 2;
          });
        }
      }
    }
    
    return resultado;
  }, [vendas, activeTab, filtroResumoAtivo, statusAnalise]);

  // Paginação local
  const paginatedVendas = useMemo(() => {
    const start = (appliedFilters.currentPage - 1) * appliedFilters.itemsPerPage;
    const end = start + appliedFilters.itemsPerPage;
    return vendasFiltradasPorAba.slice(start, end);
  }, [vendasFiltradasPorAba, appliedFilters.currentPage, appliedFilters.itemsPerPage]);

  // Auto-selecionar todas as contas no primeiro carregamento
  useEffect(() => {
    if (accounts.length > 0 && pendingFilters.selectedAccounts.length === 0) {
      const allAccountIds = accounts.map(a => a.id);
      updatePendingFilter('selectedAccounts', allAccountIds);
    }
  }, [accounts, pendingFilters.selectedAccounts.length, updatePendingFilter]);

  // Handler para buscar
  const handleBuscar = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  // Handler para cancelar busca
  const handleCancelarBusca = useCallback(() => {
    // Apenas para feedback visual, não faz nada real
  }, []);

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="pb-20">
        {/* Sub-navegação */}
        <div className="px-4 md:px-6">
          <MLOrdersNav />
        </div>
        
        {/* Espaçamento padrão */}
        <div className="py-3 mt-2"></div>
        
        {/* Tabs: Ativas vs Histórico + Filtros na mesma linha */}
        <div className="px-4 md:px-6 mt-2">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as 'ativas' | 'historico');
            changePage(1); // Reset para página 1
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
                <VendasComEnvioFilterBar
                  accounts={accounts}
                  selectedAccountIds={pendingFilters.selectedAccounts}
                  onAccountsChange={(ids) => updatePendingFilter('selectedAccounts', ids)}
                  periodo={pendingFilters.periodo}
                  onPeriodoChange={(p) => updatePendingFilter('periodo', p)}
                  searchTerm={pendingFilters.searchTerm}
                  onSearchChange={(s) => updatePendingFilter('searchTerm', s)}
                  onBuscar={handleBuscar}
                  onCancel={handleCancelarBusca}
                  isLoading={isFetching}
                  columnManager={columnManager}
                />
              </div>
            </div>
            
            {/* Conteúdo das Tabs - Resumo */}
            <TabsContent value="ativas" className="mt-4 px-0">
              <VendasComEnvioResumo 
                vendas={vendasFiltradasPorAba}
                onFiltroClick={setFiltroResumoAtivo}
                filtroAtivo={filtroResumoAtivo}
              />
            </TabsContent>
            
            <TabsContent value="historico" className="mt-4 px-0">
              <VendasComEnvioResumo 
                vendas={vendasFiltradasPorAba}
                onFiltroClick={setFiltroResumoAtivo}
                filtroAtivo={filtroResumoAtivo}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Tabela */}
        <div className="px-4 md:px-6 mt-4 relative">
          {isFetching && vendas.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          <VendasComEnvioTableNew
            orders={paginatedVendas}
            total={vendasFiltradasPorAba.length}
            loading={isFetching && vendas.length === 0}
            currentPage={appliedFilters.currentPage}
            itemsPerPage={appliedFilters.itemsPerPage}
            onPageChange={changePage}
            visibleColumnKeys={visibleColumnKeys}
            statusAnalise={statusAnalise}
            onStatusAnaliseChange={handleStatusAnaliseChange}
          />
        </div>
        
        {/* Rodapé Fixado com Paginação */}
        {vendasFiltradasPorAba.length > 0 && (
          <div 
            className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
              isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
            } left-0`}
          >
            <VendasComEnvioPagination
              currentPage={appliedFilters.currentPage}
              totalPages={Math.ceil(vendasFiltradasPorAba.length / appliedFilters.itemsPerPage)}
              itemsPerPage={appliedFilters.itemsPerPage}
              totalItems={vendasFiltradasPorAba.length}
              onPageChange={changePage}
              onItemsPerPageChange={changeItemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
