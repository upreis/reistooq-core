import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, BarChart3, Zap } from 'lucide-react';

interface DevolucaoToolbarProps {
  onRefresh: () => void;
  onExport: () => void;
  onToggleAnalytics: () => void;
  onSyncML?: () => void;
  showAnalytics: boolean;
  isLoading?: boolean;
  isSyncing?: boolean;
  totalItems: number;
}

export const DevolucaoToolbar = React.memo<DevolucaoToolbarProps>(({
  onRefresh,
  onExport,
  onToggleAnalytics,
  onSyncML,
  showAnalytics,
  isLoading = false,
  isSyncing = false,
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
        {onSyncML && (
          <Button
            variant="default"
            size="sm"
            onClick={onSyncML}
            disabled={isLoading || isSyncing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Zap className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Enriquecer ML'}
          </Button>
        )}
        
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
