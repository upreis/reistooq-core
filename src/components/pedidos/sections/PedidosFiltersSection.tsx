import { memo } from 'react';
import { PedidosFilters } from '../PedidosFilters';
import { SavedFiltersManager } from '../SavedFiltersManager';
import { Card } from '@/components/ui/card';
import { PedidosFilters as FiltersType, PedidosManagerActions } from '@/hooks/usePedidosManager';

interface PedidosFiltersSectionProps {
  filters: FiltersType;
  appliedFilters: FiltersType;
  accounts: any[];
  selectedAccount: string;
  actions: PedidosManagerActions;
  onAccountChange: (accountId: string) => void;
}

export const PedidosFiltersSection = memo<PedidosFiltersSectionProps>(({
  filters,
  appliedFilters,
  accounts,
  selectedAccount,
  actions,
  onAccountChange
}) => {
  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        <div className="text-sm font-medium mb-2">Filtros</div>
        <div className="text-xs text-muted-foreground">
          Sistema de filtros será implementado em breve
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Filtros salvos será implementado em breve
          </div>
        </div>
      </div>
    </Card>
  );
});

PedidosFiltersSection.displayName = 'PedidosFiltersSection';