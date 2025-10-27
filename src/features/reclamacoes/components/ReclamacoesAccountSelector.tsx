/**
 * 🏢 SELETOR DE CONTAS ML PARA RECLAMAÇÕES
 */

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  is_active: boolean;
}

interface ReclamacoesAccountSelectorProps {
  accounts: MLAccount[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ReclamacoesAccountSelector({ 
  accounts, 
  selectedIds, 
  onSelectionChange 
}: ReclamacoesAccountSelectorProps) {
  const handleToggle = (accountId: string) => {
    if (selectedIds.includes(accountId)) {
      onSelectionChange(selectedIds.filter(id => id !== accountId));
    } else {
      onSelectionChange([...selectedIds, accountId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(accounts.map(acc => acc.id));
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Contas Mercado Livre</h3>
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline"
          >
            {selectedIds.length === accounts.length ? 'Desmarcar todas' : 'Selecionar todas'}
          </button>
        </div>

        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center space-x-2">
              <Checkbox
                id={account.id}
                checked={selectedIds.includes(account.id)}
                onCheckedChange={() => handleToggle(account.id)}
              />
              <Label
                htmlFor={account.id}
                className="text-sm cursor-pointer flex-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{account.name || account.account_identifier}</span>
                  <span className="text-xs text-muted-foreground">
                    {account.account_identifier}
                  </span>
                </div>
              </Label>
            </div>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {selectedIds.length} conta{selectedIds.length > 1 ? 's' : ''} selecionada{selectedIds.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Card>
  );
}
