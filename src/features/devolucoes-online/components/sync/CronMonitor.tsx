/**
 * 📊 CRON MONITOR COMPONENT - FASE 6
 * Componente para monitorar execuções de cron jobs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CronMonitor() {
  // Buscar últimas 10 sincronizações
  const { data: syncHistory, isLoading } = useQuery({
    queryKey: ['cron-sync-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devolucoes_sync_status')
        .select('*')
        .order('last_sync_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Concluído
          </Badge>
        );
      case 'running':
      case 'in_progress':
        return (
          <Badge variant="default" className="gap-1 animate-pulse">
            <Clock className="h-3 w-3 animate-spin" />
            Em execução
          </Badge>
        );
      case 'failed':
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitor de Sincronizações</CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Monitor de Sincronizações Automáticas
        </CardTitle>
        <CardDescription>
          Últimas 10 execuções dos cron jobs de devoluções
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!syncHistory || syncHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma sincronização registrada ainda</p>
            <p className="text-sm mt-1">
              A primeira execução automática ocorrerá no próximo horário agendado
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {syncHistory.map((sync) => (
              <div
                key={sync.id}
                className="flex items-start justify-between border-b pb-3 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sync.last_sync_status || 'unknown')}
                    <span className="text-sm text-muted-foreground">
                      {sync.last_sync_at && formatDistanceToNow(new Date(sync.last_sync_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  
                  {(sync.last_sync_status === 'success' || sync.last_sync_status === 'completed') && (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        ✅ {sync.items_synced || 0} devoluções sincronizadas
                        {sync.items_total > 0 && ` de ${sync.items_total} total`}
                        {sync.items_failed > 0 && ` (${sync.items_failed} falharam)`}
                      </p>
                      {sync.duration_ms && (
                        <p className="text-muted-foreground">
                          ⏱️ Duração: {(sync.duration_ms / 1000).toFixed(1)}s
                        </p>
                      )}
                      {sync.sync_type && (
                        <p className="text-muted-foreground text-xs">
                          Tipo: {sync.sync_type}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {(sync.last_sync_status === 'failed' || sync.last_sync_status === 'error') && sync.error_message && (
                    <p className="text-sm text-destructive">
                      ❌ Erro: {sync.error_message}
                    </p>
                  )}
                  
                  {(sync.last_sync_status === 'running' || sync.last_sync_status === 'in_progress') && (
                    <p className="text-sm text-muted-foreground">
                      🔄 Processando: {sync.items_synced || 0} / {sync.items_total || '?'}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  {sync.last_sync_at && (
                    <div>{new Date(sync.last_sync_at).toLocaleString('pt-BR')}</div>
                  )}
                  {sync.created_at && (
                    <div className="text-xs opacity-70">
                      Criado: {new Date(sync.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
