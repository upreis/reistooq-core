/**
 * 📊 PAINEL DE MONITORAMENTO DA FILA
 * Mostra progresso do processamento em background
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const QueueMonitorCard = () => {
  const { data: queueStats, isLoading, refetch } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fila_processamento_claims')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        completed: data.filter(d => d.status === 'completed').length,
        pending: data.filter(d => d.status === 'pending').length,
        processing: data.filter(d => d.status === 'processing').length,
        failed: data.filter(d => d.status === 'failed').length,
      };
      
      const processed = stats.completed + stats.failed;
      const progress = stats.total > 0 ? (processed / stats.total) * 100 : 0;
      
      return { ...stats, progress };
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  if (isLoading || !queueStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando status da fila...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProcessing = queueStats.pending > 0 || queueStats.processing > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            🔄 Processamento em Background
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Total</span>
            <span className="font-medium">{Math.round(queueStats.progress)}%</span>
          </div>
          <Progress value={queueStats.progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Completed */}
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Completos</div>
              <div className="text-lg font-semibold text-success">
                {queueStats.completed.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
            <Clock className="h-4 w-4 text-warning" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Pendentes</div>
              <div className="text-lg font-semibold text-warning">
                {queueStats.pending.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Processing */}
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Processando</div>
              <div className="text-lg font-semibold text-primary">
                {queueStats.processing.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Failed */}
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
            <XCircle className="h-4 w-4 text-destructive" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Falhados</div>
              <div className="text-lg font-semibold text-destructive">
                {queueStats.failed.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
          isProcessing 
            ? 'bg-primary/10 text-primary' 
            : queueStats.failed > 0 
              ? 'bg-warning/10 text-warning'
              : 'bg-success/10 text-success'
        }`}>
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mt-0.5 animate-spin flex-shrink-0" />
              <div>
                <div className="font-medium">Processamento ativo</div>
                <div className="text-xs opacity-80">
                  O cron job processa 10 claims por minuto. Restam aproximadamente{' '}
                  {Math.ceil(queueStats.pending / 10)} minutos.
                </div>
              </div>
            </>
          ) : queueStats.failed > 0 ? (
            <>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Processamento concluído com erros</div>
                <div className="text-xs opacity-80">
                  {queueStats.failed} claims falharam após 3 tentativas. 
                  Verifique os logs para mais detalhes.
                </div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Processamento concluído</div>
                <div className="text-xs opacity-80">
                  Todos os claims foram processados com sucesso!
                </div>
              </div>
            </>
          )}
        </div>

        {/* Total Count */}
        <div className="pt-2 border-t text-center text-sm text-muted-foreground">
          Total na fila: <span className="font-medium text-foreground">{queueStats.total.toLocaleString()}</span> claims
        </div>
      </CardContent>
    </Card>
  );
};
