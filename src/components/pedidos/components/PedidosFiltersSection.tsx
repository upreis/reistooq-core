/**
 * 🎯 SEÇÃO DE FILTROS DE PEDIDOS - Componente Extraído
 * Mantém toda funcionalidade de filtros com otimização
 */

import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import PedidosFiltersMemo from '../PedidosFiltersMemo';
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
  className
}) => {
  // PedidosFiltersSection rendering

  // Contagem de filtros ativos memoizada
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.situacao?.length > 0) count++;
    if (filters.dataInicio) count++;
    if (filters.dataFim) count++;
    if (filters.cidade) count++;
    if (filters.uf) count++;
    if (filters.valorMin) count++;
    if (filters.valorMax) count++;
    return count;
  }, [filters]);

  const hasFilters = activeFiltersCount > 0;

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {/* Cabeçalho dos Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Filtros</h3>
          {hasFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de mudanças pendentes */}
          {hasPendingChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              Mudanças pendentes
            </Badge>
          )}
          
          {/* ✅ REMOVIDO: Botão "Aplicar Filtros" - agora é automático */}
          
          {/* Gerenciador de colunas */}
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
      </div>

      {/* Componente de Filtros Otimizado */}
      <div className="space-y-4">
        <PedidosFiltersMemo
          filters={filters}
          onFiltersChange={onFiltersChange || actions?.setFilters}
          onClearFilters={onClearFilters || actions?.clearFilters}
          hasPendingChanges={hasPendingChanges}
          isLoading={loading}
        />
        
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

      {/* Resumo dos Filtros Aplicados */}
      {hasFilters && (
        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2">Filtros ativos:</div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outline">Busca: {filters.search}</Badge>
            )}
            {filters.situacao?.length > 0 && (
              <Badge variant="outline">Status: {filters.situacao.length} selecionado(s)</Badge>
            )}
            {filters.dataInicio && (
              <Badge variant="outline">Data início: {filters.dataInicio.toLocaleDateString()}</Badge>
            )}
            {filters.dataFim && (
              <Badge variant="outline">Data fim: {filters.dataFim.toLocaleDateString()}</Badge>
            )}
            {filters.cidade && (
              <Badge variant="outline">Cidade: {filters.cidade}</Badge>
            )}
            {filters.uf && (
              <Badge variant="outline">UF: {filters.uf}</Badge>
            )}
            {filters.valorMin && (
              <Badge variant="outline">Valor mín: R$ {filters.valorMin}</Badge>
            )}
            {filters.valorMax && (
              <Badge variant="outline">Valor máx: R$ {filters.valorMax}</Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
});

PedidosFiltersSection.displayName = 'PedidosFiltersSection';