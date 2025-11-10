/**
 * 🔄 SYNC STATUS INDICATOR - FASE 5
 * Componente para mostrar status de sincronização e ações
 */

import { RefreshCw, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SyncStatusIndicatorProps {
  syncStatus: any;
  onSync: () => void;
  onEnrich: () => void;
  isSyncing: boolean;
  isEnriching: boolean;
}

export function SyncStatusIndicator({
  syncStatus,
  onSync,
  onEnrich,
  isSyncing,
  isEnriching,
}: SyncStatusIndicatorProps) {
  const getStatusBadge = () => {
    if (!syncStatus) {
      return (
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Não sincronizado
        </Badge>
      );
    }

    if (syncStatus.last_sync_status === 'running' || syncStatus.last_sync_status === 'in_progress') {
      return (
        <Badge variant="default" className="gap-1 animate-pulse">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Sincronizando...
        </Badge>
      );
    }

    if (syncStatus.last_sync_status === 'completed' || syncStatus.last_sync_status === 'success') {
      return (
        <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600 text-white">
          <RefreshCw className="h-3 w-3" />
          Sincronizado
        </Badge>
      );
    }

    if (syncStatus.last_sync_status === 'failed' || syncStatus.last_sync_status === 'error') {
      return (
        <Badge variant="destructive" className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Falhou
        </Badge>
      );
    }

    return null;
  };

  const getSyncInfo = () => {
    if (!syncStatus || !syncStatus.last_sync_at) return null;

    return (
      <div className="text-xs text-muted-foreground">
        Última sincronização:{' '}
        {formatDistanceToNow(new Date(syncStatus.last_sync_at), {
          addSuffix: true,
          locale: ptBR,
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{getStatusBadge()}</div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {getSyncInfo()}
              {syncStatus && (
                <>
                  <div className="text-xs">
                    Processados: {syncStatus.items_synced || 0}
                    {syncStatus.items_total && syncStatus.items_total > 0 && ` / ${syncStatus.items_total}`}
                  </div>
                  {syncStatus.items_failed && syncStatus.items_failed > 0 && (
                    <div className="text-xs text-destructive">
                      Falhas: {syncStatus.items_failed}
                    </div>
                  )}
                  {syncStatus.duration_ms && (
                    <div className="text-xs">
                      Duração: {(syncStatus.duration_ms / 1000).toFixed(1)}s
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <Button
          onClick={onSync}
          disabled={isSyncing || syncStatus?.last_sync_status === 'running' || syncStatus?.last_sync_status === 'in_progress'}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Sincronizar
            </>
          )}
        </Button>

        <Button
          onClick={onEnrich}
          disabled={isEnriching}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {isEnriching ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              Enriquecendo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Enriquecer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
