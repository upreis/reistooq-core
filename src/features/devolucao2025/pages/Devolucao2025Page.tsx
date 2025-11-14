/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação completa com 65 colunas
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Devolucao2025Table } from '../components/Devolucao2025Table';
import { Devolucao2025Filters } from '../components/Devolucao2025Filters';
import { Devolucao2025Stats } from '../components/Devolucao2025Stats';

export const Devolucao2025Page = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devoluções 2025</h1>
          <p className="text-muted-foreground">
            Gestão completa com {devolucoes.length} devoluções
          </p>
        </div>
      </div>

      <Devolucao2025Stats devolucoes={devolucoes} />

      <Card className="p-6">
        <Devolucao2025Filters
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={refetch}
        />
      </Card>

      <Card className="p-6">
        <Devolucao2025Table
          devolucoes={devolucoes}
          isLoading={isLoading}
          error={error}
        />
      </Card>
    </div>
  );
};
