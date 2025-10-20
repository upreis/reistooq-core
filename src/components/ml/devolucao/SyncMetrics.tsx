import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyncMetrics } from '@/features/devolucoes/hooks/useSyncMetrics';
import { Activity, CheckCircle, XCircle, Clock, Database, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export const SyncMetrics = React.memo(function SyncMetrics() {
  const { data: metrics, isLoading } = useSyncMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas de Sincronização</CardTitle>
          <CardDescription>Estatísticas das últimas 100 sincronizações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const successRate = metrics.totalSyncs > 0 
    ? Math.round((metrics.successfulSyncs / metrics.totalSyncs) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Métricas de Sincronização
        </CardTitle>
        <CardDescription>
          Estatísticas das últimas {metrics.totalSyncs} sincronizações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total de Sincronizações */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Total</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalSyncs}</p>
          </div>

          {/* Sincronizações Bem-sucedidas */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Sucesso</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.successfulSyncs}</p>
          </div>

          {/* Sincronizações Falhadas */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>Falhas</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{metrics.failedSyncs}</p>
          </div>

          {/* Taxa de Sucesso */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Taxa de Sucesso</span>
            </div>
            <p className="text-2xl font-bold">{successRate}%</p>
          </div>

          {/* Duração Média */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duração Média</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics.averageDuration > 0 
                ? `${(metrics.averageDuration / 1000).toFixed(1)}s`
                : '-'}
            </p>
          </div>

          {/* Registros Sincronizados */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Registros</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalRecordsSynced}</p>
          </div>
        </div>

        {/* Última Sincronização */}
        {metrics.lastSyncTime && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Última sincronização:{' '}
              <span className="font-medium text-foreground">
                {formatDistanceToNow(metrics.lastSyncTime, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
