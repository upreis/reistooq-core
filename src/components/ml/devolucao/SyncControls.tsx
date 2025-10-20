import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSyncDevolucoes } from '@/features/devolucoes/hooks/useSyncDevolucoes';
import { useSyncControl } from '@/features/devolucoes/hooks/useSyncControl';
import { RefreshCw, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export const SyncControls = React.memo(function SyncControls() {
  const { syncStatus, syncNow } = useSyncDevolucoes();
  const [integrationAccountId, setIntegrationAccountId] = useState<string | null>(null);
  const { data: syncControl } = useSyncControl(integrationAccountId || undefined);

  // Buscar integration_account_id do usuário
  useEffect(() => {
    const fetchAccountId = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (data) {
        setIntegrationAccountId(data.id);
      }
    };
    fetchAccountId();
  }, []);

  const handleSync = async () => {
    if (!integrationAccountId) {
      console.error('Nenhuma conta de integração encontrada');
      return;
    }
    try {
      await syncNow(integrationAccountId);
    } catch (error) {
      // Error já tratado no hook
    }
  };

  // Calcular progresso
  const progressPercentage = syncControl && syncControl.progress_total > 0
    ? Math.round((syncControl.progress_current / syncControl.progress_total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sincronização Automática</CardTitle>
            <CardDescription>
              Devoluções são sincronizadas automaticamente a cada 2 horas
            </CardDescription>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={syncStatus.isRunning}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.isRunning ? 'animate-spin' : ''}`} />
            {syncStatus.isRunning ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              {syncControl?.status === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <span className="text-muted-foreground">Sincronizando em background...</span>
                </>
              ) : syncControl?.status === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Erro na última sincronização</span>
                </>
              ) : syncControl?.last_sync_date ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    Última sincronização: {formatDistanceToNow(new Date(syncControl.last_sync_date), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Aguardando primeira sincronização</span>
                </>
              )}
            </div>

            {/* Badge de status */}
            <Badge variant={syncControl?.status === 'running' ? "default" : "secondary"}>
              {syncControl?.status === 'running' ? 'Rodando' : 
               syncControl?.status === 'completed' ? 'Concluída' :
               syncControl?.status === 'error' ? 'Erro' : 'Agendada'}
            </Badge>
          </div>

          {/* Barra de progresso */}
          {syncControl?.status === 'running' && syncControl.progress_total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {syncControl.progress_current} / {syncControl.progress_total} claims
                </span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {/* Informações adicionais */}
          {syncControl?.total_claims && syncControl.total_claims > 0 && (
            <div className="text-sm text-muted-foreground">
              Total de devoluções sincronizadas: <span className="font-medium">{syncControl.total_claims}</span>
            </div>
          )}

          {/* Erro */}
          {syncControl?.error_message && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{syncControl.error_message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
