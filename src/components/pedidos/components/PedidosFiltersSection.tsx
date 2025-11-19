/**
 * 🎯 SEÇÃO DE FILTROS DE PEDIDOS - Componente Extraído
 * Mantém toda funcionalidade de filtros com otimização
 */

import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
// import PedidosFiltersMemo from '../PedidosFiltersMemo'; // REMOVIDO
import { SavedFiltersManager } from '../SavedFiltersManager';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';

interface PedidosFiltersSectionProps {
  filters: any;
  appliedFilters?: any;
  actions?: any;
  onFiltersChange?: (filters: any) => void;
  onClearFilters?: () => void;
  hasPendingChanges: boolean;
  columnManager?: any;
  loading?: boolean;
  className?: string;
  contasML?: Array<{ id: string; name: string; nickname?: string; active?: boolean; }>; // ✅ NOVO: Lista de contas ML
}

export const PedidosFiltersSection = memo<PedidosFiltersSectionProps>(({
  filters,
  appliedFilters = filters,
  actions,
  onFiltersChange,
  onClearFilters,
  hasPendingChanges,
  columnManager,
  loading = false,
  className,
  contasML = [] // ✅ NOVO: Contas ML
}) => {
  // PedidosFiltersSection rendering

  // Contagem de filtros ativos memoizada
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.situacao?.length > 0) count++;
    if (filters.dataInicio) count++;
    if (filters.dataFim) count++;
    if (filters.contasML?.length > 0) count++; // ✅ NOVO: Contas ML
    return count;
  }, [filters]);

  const hasFilters = activeFiltersCount > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Gerenciador de colunas */}
      <div className="flex items-center justify-end">
        {columnManager && (
          <ColumnManager 
            {...columnManager}
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        )}
      </div>

      {/* Componente de Filtros Otimizado */}
      <div className="space-y-4">
        {/* Componente PedidosFiltersMemo removido */}
        
        {/* Gerenciador de Filtros Salvos */}
        {actions?.saveFilters && actions?.loadFilters && (
          <div className="mt-4">
            <SavedFiltersManager
              savedFilters={actions.savedFilters || []}
              onSaveFilters={actions.saveFilters}
              onLoadFilters={actions.loadFilters}
              hasActiveFilters={hasFilters}
            />
          </div>
        )}
      </div>
    </div>
  );
});

PedidosFiltersSection.displayName = 'PedidosFiltersSection';