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
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { DevolucaoAlertsPanel } from '../components/DevolucaoAlertsPanel';
import { DevolucaoAlertsBadge } from '../components/DevolucaoAlertsBadge';
import { useDevolucaoAlerts } from '../hooks/useDevolucaoAlerts';
import { RefreshCw } from 'lucide-react';

export const Devolucao2025Page = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

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
    queryKey: ['devolucoes-2025', selectedAccount, dateRange],
    queryFn: async () => {
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
        return allDevolucoes.flat();
      } else {
        const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
          body: {
            integration_account_id: selectedAccount,
            date_from: dateRange.from.toISOString(),
            date_to: dateRange.to.toISOString()
          }
        });

        if (error) throw error;
        return data?.data || [];
      }
    },
    enabled: accounts.length > 0
  });

  // Paginação dos dados
  const paginatedDevolucoes = useMemo(() => {
    if (itemsPerPage === -1) return devolucoes; // "Todas"
    const startIndex = (currentPage - 1) * itemsPerPage;
    return devolucoes.slice(startIndex, startIndex + itemsPerPage);
  }, [devolucoes, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(devolucoes.length / itemsPerPage);

  // Sistema de Alertas
  const { alerts, totalAlerts, alertsByType } = useDevolucaoAlerts(devolucoes);

  return (
    <div className="w-full h-screen px-6 py-6 space-y-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Devoluções 2025</h1>
            <p className="text-muted-foreground">
              Gestão completa com {devolucoes.length} devoluções
            </p>
          </div>
          <DevolucaoAlertsBadge alertsByType={alertsByType} />
        </div>
        <NotificationsBell organizationId={organizationId} />
      </div>

      {/* Painel de Alertas */}
      {totalAlerts > 0 && (
        <DevolucaoAlertsPanel alerts={alerts} totalAlerts={totalAlerts} />
      )}

      <Devolucao2025Stats devolucoes={devolucoes} />

      <Card className="p-6">
        <Devolucao2025Filters
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={refetch}
          isLoading={isLoading}
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
  );
};
