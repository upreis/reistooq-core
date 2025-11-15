/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação completa com 65 colunas + Sistema de Alertas
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Devolucao2025Table } from '../components/Devolucao2025Table';
import { Devolucao2025Filters } from '../components/Devolucao2025Filters';
import { Devolucao2025Stats } from '../components/Devolucao2025Stats';
import { Devolucao2025Pagination } from '../components/Devolucao2025Pagination';
import { Devolucao2025Export } from '../components/Devolucao2025Export';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { DevolucaoAlertsPanel } from '../components/DevolucaoAlertsPanel';
import { DevolucaoAlertsBadge } from '../components/DevolucaoAlertsBadge';
import { useDevolucaoAlerts } from '../hooks/useDevolucaoAlerts';
import { usePersistentDevolucoes2025State } from '@/hooks/usePersistentDevolucoes2025State';
import { RefreshCw } from 'lucide-react';

const DEFAULT_VISIBLE_COLUMNS = {
  empresa: true,
  pedido: true,
  comprador: true,
  produto: true,
  sku: true,
  quantidade: true,
  valor_total: true,
  status_devolucao: true,
  status_return: true,
  status_entrega: true,
  destino: true,
  evidencias: true,
  resolucao: true,
  data_criacao: true,
  prazo_analise: true,
  tipo_logistica: true,
};

const STORAGE_KEY = 'devolucoes2025-column-visibility';

export const Devolucao2025Page = () => {
  // Hook de persistência
  const persistentState = usePersistentDevolucoes2025State();
  
  const [selectedAccount, setSelectedAccount] = useState<string>(() => 
    persistentState.persistedState?.selectedAccount || 'all'
  );
  const [dateRange, setDateRange] = useState(() => 
    persistentState.persistedState?.dateRange || {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  );
  const [currentPage, setCurrentPage] = useState(() => 
    persistentState.persistedState?.currentPage || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    persistentState.persistedState?.itemsPerPage || 50
  );
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [searchTrigger, setSearchTrigger] = useState(() => 
    persistentState.hasValidPersistedState() ? 0 : 1
  );
  
  // Estado para visibilidade de colunas
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
  });

  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

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
  // Buscar devoluções via Edge Function OU usar cache
  const { data: devolucoes = [], isLoading, error } = useQuery({
    queryKey: ['devolucoes-2025', selectedAccount, searchTrigger],
    queryFn: async () => {
      // Se tem cache válido e não precisa atualizar, retorna do cache
      if (searchTrigger === 0 && persistentState.hasValidPersistedState()) {
        console.log('📦 Usando dados do cache (sem chamada API)');
        return persistentState.persistedState!.devolucoes;
      }

      console.log('🔄 Buscando dados da API...');
      let fetchedData: any[] = [];
      
      if (selectedAccount === 'all') {
        const allDevolucoes = await Promise.all(
          accounts.map(async (account) => {
            const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
              body: {
                integration_account_id: account.id,
                date_from: dateRange.from.toISOString(),
                date_to: dateRange.to.toISOString()
              }
            });

            if (error) throw error;
            return data?.data || [];
          })
        );
        fetchedData = allDevolucoes.flat();
      } else {
        const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
          body: {
            integration_account_id: selectedAccount,
            date_from: dateRange.from.toISOString(),
            date_to: dateRange.to.toISOString()
          }
        });

        if (error) throw error;
        fetchedData = data?.data || [];
      }

      // Salvar no cache após buscar
      const validas = fetchedData.filter(dev => {
        const hasClaimId = dev.claim_id && dev.claim_id !== '-';
        const hasComprador = dev.comprador_nome_completo && dev.comprador_nome_completo !== '-';
        const hasProduto = dev.produto_titulo && dev.produto_titulo !== 'Produto não disponível';
        return hasClaimId && (hasComprador || hasProduto);
      });
      
      persistentState.saveDevolucoes(fetchedData, validas.length, currentPage);
      
      return fetchedData;
    },
    enabled: accounts.length > 0 && persistentState.isStateLoaded
  });

  // Função para disparar busca
  const handleSearch = () => {
    console.log('🔍 Aplicando filtros e buscando...');
    persistentState.saveAppliedFilters(selectedAccount, dateRange, 1, itemsPerPage);
    setSearchTrigger(prev => prev + 1);
    setCurrentPage(1);
  };

  const handleResetToDefault = () => {
    setColumnVisibility(DEFAULT_VISIBLE_COLUMNS);
  };

  const handleToggleAll = (show: boolean) => {
    const updated: Record<string, boolean> = {};
    Object.keys(DEFAULT_VISIBLE_COLUMNS).forEach(key => {
      updated[key] = show;
    });
    setColumnVisibility(updated);
  };

  // Paginação dos dados - filtrar apenas devoluções com dados completos
  const devolucoesValidas = useMemo(() => {
    console.log('[DEBUG] Total de devoluções recebidas:', devolucoes.length);
    
    const validas = devolucoes.filter(dev => {
      // Verificar se tem claim_id válido E dados mínimos essenciais
      const hasClaimId = dev.claim_id && dev.claim_id !== '-';
      const hasComprador = dev.comprador_nome_completo && dev.comprador_nome_completo !== '-';
      const hasProduto = dev.produto_titulo && dev.produto_titulo !== 'Produto não disponível';
      
      const isValid = hasClaimId && (hasComprador || hasProduto);
      
      if (!isValid) {
        console.log('[DEBUG] Registro filtrado - Order:', dev.order_id, 'Claim:', dev.claim_id, 
          'Comprador:', dev.comprador_nome_completo, 'Produto:', dev.produto_titulo);
      }
      
      return isValid;
    });
    
    console.log('[DEBUG] Devoluções válidas após filtro:', validas.length);
    return validas;
  }, [devolucoes]);

  const paginatedDevolucoes = useMemo(() => {
    if (itemsPerPage === -1) return devolucoesValidas; // "Todas"
    const startIndex = (currentPage - 1) * itemsPerPage;
    return devolucoesValidas.slice(startIndex, startIndex + itemsPerPage);
  }, [devolucoesValidas, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(devolucoesValidas.length / itemsPerPage);

  // Atualizar página no cache quando mudar
  useEffect(() => {
    if (persistentState.hasValidPersistedState()) {
      persistentState.saveCurrentPage(currentPage);
    }
  }, [currentPage, persistentState]);

  // Sistema de Alertas - usando devoluções válidas
  const { alerts, totalAlerts, alertsByType } = useDevolucaoAlerts(devolucoesValidas);

  return (
    <div className="w-full h-screen px-6 py-6 space-y-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Devoluções 2025</h1>
            <p className="text-muted-foreground">
              Gestão completa com {devolucoesValidas.length} devoluções válidas
            </p>
          </div>
          <div className="flex gap-2">
            <Devolucao2025Export 
              devolucoes={devolucoesValidas}
              disabled={isLoading}
            />
            <DevolucaoAlertsBadge alertsByType={alertsByType} />
          </div>
        </div>
        <NotificationsBell organizationId={organizationId} />
      </div>

      {/* Painel de Alertas */}
      {totalAlerts > 0 && (
        <DevolucaoAlertsPanel alerts={alerts} totalAlerts={totalAlerts} />
      )}

      <Devolucao2025Stats devolucoes={devolucoesValidas} />

      <Card className="p-6">
        <Devolucao2025Filters
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={handleSearch}
          isLoading={isLoading}
          columnVisibility={columnVisibility}
          onVisibilityChange={setColumnVisibility}
          onResetToDefault={handleResetToDefault}
          onToggleAll={handleToggleAll}
        />
      </Card>

      <Card className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
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
          devolucoes={paginatedDevolucoes}
          isLoading={isLoading}
          error={error}
          columnVisibility={columnVisibility}
        />

        {!isLoading && !error && devolucoesValidas.length > 0 && (
          <Devolucao2025Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={devolucoesValidas.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </Card>
    </div>
  );
};
