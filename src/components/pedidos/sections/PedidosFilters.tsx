import { memo } from 'react';
import { Card } from '@/components/ui/card';

interface PedidosFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  accounts: any[];
  selectedAccount: string;
  onAccountChange: (accountId: string) => void;
}

export const PedidosFilters = memo<PedidosFiltersProps>(({
  filters,
  onFiltersChange,
  accounts,
  selectedAccount,
  onAccountChange
}) => {
  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">
        Filtros em desenvolvimento...
      </div>
    </Card>
  );
});

PedidosFilters.displayName = 'PedidosFilters';