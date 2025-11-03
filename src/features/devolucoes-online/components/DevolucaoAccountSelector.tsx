/**
 * 🏢 ACCOUNT SELECTOR - DEVOLUÇÕES
 * Seletor de contas ML otimizado
 */

import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DevolucaoAccountSelectorProps {
  accounts: Array<{ id: string; name: string }>;
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  loading?: boolean;
}

export const DevolucaoAccountSelector = memo(({ 
  accounts, 
  selectedAccountId, 
  onAccountChange,
  loading = false 
}: DevolucaoAccountSelectorProps) => {

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
    <Select value={selectedAccountId} onValueChange={onAccountChange}>
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
});

DevolucaoAccountSelector.displayName = 'DevolucaoAccountSelector';
