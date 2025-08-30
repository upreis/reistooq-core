import { memo } from 'react';
import { PedidosFilters, PedidosFiltersState } from '../PedidosFilters';
import { SavedFiltersManager } from '../SavedFiltersManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PedidosFilters as FiltersType, PedidosManagerActions } from '@/hooks/usePedidosManager';
import { AlertTriangle, Filter as FilterIcon } from 'lucide-react';

interface PedidosFiltersSectionProps {
  filters: FiltersType;
  appliedFilters: FiltersType;
  accounts: any[];
  selectedAccounts: string[];
  actions: PedidosManagerActions;
  onAccountChange: (accountIds: string[]) => void;
  hasPendingChanges?: boolean;
  hasActiveFilters?: boolean;
}

export const PedidosFiltersSection = memo<PedidosFiltersSectionProps>(({
  filters,
  appliedFilters,
  accounts,
  selectedAccounts,
  actions,
  onAccountChange,
  hasPendingChanges,
  hasActiveFilters
}) => {
  // Converter filters para o tipo correto do componente PedidosFilters
  const filtersAsState: PedidosFiltersState = {
    search: filters.search,
    situacao: Array.isArray(filters.situacao) ? filters.situacao : (filters.situacao ? [filters.situacao] : []),
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    cidade: filters.cidade,
    uf: filters.uf,
    valorMin: filters.valorMin,
    valorMax: filters.valorMax,
  };

  const handleFiltersChange = (newFilters: PedidosFiltersState) => {
    actions.setFilters(newFilters);
  };

  const handleClearFilters = () => {
    actions.clearFilters();
  };

  const handleApplyFilters = () => {
    actions.applyFilters();
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        {/* Contas de integração - Multi-select */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Contas</label>
            <select
              multiple
              value={selectedAccounts}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                onAccountChange(selected);
              }}
              className="h-20 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name || acc.id}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              variant={hasPendingChanges ? "default" : "outline"}
              className={hasPendingChanges ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {hasPendingChanges ? "Aplicar Filtros" : "Aplicar"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <FilterIcon className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </div>

        <PedidosFilters
          filters={filtersAsState}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          hasPendingChanges={hasPendingChanges}
        />
        
        <div className="flex items-center justify-between pt-4 border-t">
          <SavedFiltersManager
            onSaveFilters={actions.saveCurrentFilters}
            onLoadFilters={actions.loadSavedFilters}
            savedFilters={actions.getSavedFilters()}
            hasActiveFilters={Boolean(hasActiveFilters)}
          />
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              variant={hasPendingChanges ? "default" : "outline"}
              className={hasPendingChanges ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {hasPendingChanges ? "Aplicar Filtros" : "Aplicar"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

PedidosFiltersSection.displayName = 'PedidosFiltersSection';