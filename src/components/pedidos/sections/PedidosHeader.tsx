import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PedidosHeaderProps {
  totalPedidos: number;
  loading: boolean;
  isRefreshing: boolean;
  hasPendingChanges: boolean;
  hasActiveFilters: boolean;
  onRefresh: () => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export const PedidosHeader = memo<PedidosHeaderProps>(({
  totalPedidos,
  loading,
  isRefreshing,
  hasPendingChanges,
  hasActiveFilters,
  onRefresh,
  onApplyFilters,
  onClearFilters
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Badge variant="secondary" className="text-sm">
          {totalPedidos.toLocaleString()} pedidos
        </Badge>
        {hasActiveFilters && (
          <Badge variant="outline" className="text-xs">
            Filtros ativos
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {hasPendingChanges && (
          <Button
            onClick={onApplyFilters}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </Button>
        )}
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
          >
            <Filter className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", (loading || isRefreshing) && "animate-spin")} />
          Atualizar
        </Button>
      </div>
    </div>
  );
});

PedidosHeader.displayName = 'PedidosHeader';