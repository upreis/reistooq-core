/**
 * 🎯 SEÇÃO DE FILTROS DE DEVOLUÇÕES - Container
 * Baseado no sistema de filtros de pedidos
 */

import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevolucaoFiltersSectionProps {
  children: React.ReactNode;
  activeFiltersCount: number;
  hasPendingChanges: boolean;
  className?: string;
}

export const DevolucaoFiltersSection = memo<DevolucaoFiltersSectionProps>(({
  children,
  activeFiltersCount,
  hasPendingChanges,
  className
}) => {
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
        
        {hasPendingChanges && (
          <Badge variant="outline" className="text-amber-600 border-amber-200">
            Mudanças pendentes
          </Badge>
        )}
      </div>

      {/* Conteúdo dos filtros */}
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  );
});

DevolucaoFiltersSection.displayName = 'DevolucaoFiltersSection';
