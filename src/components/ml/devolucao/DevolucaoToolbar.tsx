import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, BarChart3 } from 'lucide-react';

interface DevolucaoToolbarProps {
  onRefresh: () => void;
  onExport: () => void;
  onToggleAnalytics: () => void;
  showAnalytics: boolean;
  isLoading?: boolean;
  totalItems: number;
}

export const DevolucaoToolbar = React.memo<DevolucaoToolbarProps>(({
  onRefresh,
  onExport,
  onToggleAnalytics,
  showAnalytics,
  isLoading = false,
  totalItems
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'devolução' : 'devoluções'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isLoading || totalItems === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>

        <Button
          variant={showAnalytics ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleAnalytics}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </div>
    </div>
  );
});
