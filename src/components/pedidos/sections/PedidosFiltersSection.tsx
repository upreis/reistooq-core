import { memo } from 'react';
import { PedidosFilters } from './PedidosFilters';
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
        <PedidosFilters
          filters={filters}
          onFiltersChange={actions.setFilters}
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={onAccountChange}
        />
        
        <div className="flex items-center justify-between pt-4 border-t">
          <SavedFiltersManager
            onSave={actions.saveCurrentFilters}
            onLoad={actions.loadSavedFilters}
            savedFilters={actions.getSavedFilters()}
          />
        </div>
      </div>
    </Card>
  );
});

PedidosFiltersSection.displayName = 'PedidosFiltersSection';