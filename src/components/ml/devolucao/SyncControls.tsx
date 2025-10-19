import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSyncDevolucoes } from '@/features/devolucoes/hooks/useSyncDevolucoes';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SyncControls() {
  const { syncStatus, syncNow } = useSyncDevolucoes();

  const handleSync = async () => {
    try {
      await syncNow();
    } catch (error) {
      // Error já tratado no hook
    }
  };

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
        <div className="flex items-center gap-6 text-sm">
          {/* Status */}
          <div className="flex items-center gap-2">
            {syncStatus.isRunning ? (
              <>
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Em execução...</span>
              </>
            ) : syncStatus.error ? (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Erro na última sincronização</span>
              </>
            ) : syncStatus.lastSync ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  Última sincronização: {formatDistanceToNow(syncStatus.lastSync, { 
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
          <Badge variant={syncStatus.isRunning ? "default" : "secondary"}>
            {syncStatus.isRunning ? 'Ativo' : 'Agendado'}
          </Badge>
        </div>

        {syncStatus.error && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{syncStatus.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
