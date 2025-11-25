import { X, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UploadJob, UploadStatus } from '@/hooks/useUploadQueue';

interface UploadQueuePanelProps {
  queue: UploadJob[];
  stats: {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  onCancelJob: (jobId: string) => void;
  onCancelAll: () => void;
  onClearCompleted: () => void;
}

const getStatusIcon = (status: UploadStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'cancelled':
      return <X className="h-4 w-4 text-muted-foreground" />;
    case 'uploading':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default:
      return <Loader2 className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: UploadStatus) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
    case 'failed':
      return <Badge variant="destructive">Falhou</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Cancelado</Badge>;
    case 'uploading':
      return <Badge variant="default">Enviando</Badge>;
    case 'pending':
      return <Badge variant="outline">Aguardando</Badge>;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Painel flutuante para visualizar e gerenciar fila de uploads
 * Mostra progresso, status e permite cancelamento individual ou em lote
 */
export const UploadQueuePanel = ({
  queue,
  stats,
  onCancelJob,
  onCancelAll,
  onClearCompleted
}: UploadQueuePanelProps) => {
  // Não mostrar se fila vazia
  if (queue.length === 0) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Fila de Uploads</h3>
          <p className="text-xs text-muted-foreground">
            {stats.uploading} enviando · {stats.pending} aguardando
          </p>
        </div>
        
        <div className="flex gap-1">
          {stats.completed > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCompleted}
              title="Limpar concluídos"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          {(stats.pending > 0 || stats.uploading > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelAll}
              title="Cancelar todos"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 bg-muted/50 flex gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Total:</span>{' '}
          <span className="font-medium">{stats.total}</span>
        </div>
        {stats.completed > 0 && (
          <div>
            <span className="text-green-600">✓</span>{' '}
            <span className="font-medium">{stats.completed}</span>
          </div>
        )}
        {stats.failed > 0 && (
          <div>
            <span className="text-destructive">✗</span>{' '}
            <span className="font-medium">{stats.failed}</span>
          </div>
        )}
      </div>

      {/* Queue items */}
      <ScrollArea className="max-h-[400px]">
        <div className="p-2 space-y-2">
          {queue.map((job) => (
            <Card key={job.id} className="p-3">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  {getStatusIcon(job.status)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={job.file.name}>
                        {job.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(job.file.size)} · {job.field === 'imagem' ? 'Imagem' : 'Imagem Fornecedor'}
                      </p>
                    </div>
                    
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Progress bar */}
                  {job.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground text-right">
                        {job.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {job.status === 'failed' && job.error && (
                    <p className="text-xs text-destructive">
                      {job.error}
                      {job.retryCount > 0 && ` (Tentativa ${job.retryCount})`}
                    </p>
                  )}

                  {/* Retry info */}
                  {job.status === 'pending' && job.retryCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Aguardando retry {job.retryCount}...
                    </p>
                  )}
                </div>

                {/* Cancel button */}
                {(job.status === 'pending' || job.status === 'uploading') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancelJob(job.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
