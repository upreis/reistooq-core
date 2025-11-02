/**
 * 🏢 ACCOUNT SELECTOR - DEVOLUÇÕES
 * Seletor de contas ML para Devoluções
 */

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDevolucaoStore } from '../store/useDevolucaoStore';
import { supabase } from '@/integrations/supabase/client';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
}

export const DevolucaoAccountSelector = () => {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const filters = useDevolucaoStore(state => state.filters);
  const updateFilters = useDevolucaoStore(state => state.updateFilters);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('integration_accounts')
          .select('id, name, account_identifier')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        setAccounts(data || []);
        
        // Auto-selecionar primeira conta se houver
        if (data && data.length > 0 && !filters.integrationAccountId) {
          updateFilters({ integrationAccountId: data[0].id });
        }
      } catch (error) {
        console.error('Erro ao buscar contas ML:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return <div className="h-10 w-64 bg-muted animate-pulse rounded" />;
  }

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma conta ML conectada
      </div>
    );
  }

  return (
    <Select
      value={filters.integrationAccountId}
      onValueChange={(value) => updateFilters({ integrationAccountId: value })}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecione uma conta ML" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
