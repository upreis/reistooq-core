// P4.1: Componente centralizado para estados de loading unificados
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoadingSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export function LoadingSkeleton({ rows = 5, showHeader = true }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {showHeader && <Skeleton className="h-8 w-full" />}
      <div className="rounded-lg border">
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = "Erro ao carregar dados" }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-2">
        <div className="font-medium">{title}</div>
        <div className="text-sm">{error}</div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title = "Nenhum resultado encontrado", 
  description = "Verifique os filtros ou tente novamente mais tarde.",
  action 
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-muted bg-muted/30 p-8 text-center space-y-3">
      <div className="text-lg font-medium text-muted-foreground">
        {title}
      </div>
      <div className="text-sm text-muted-foreground">
        {description}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

interface RefreshingIndicatorProps {
  isRefreshing: boolean;
  onRefresh?: () => void;
}

export function RefreshingIndicator({ isRefreshing, onRefresh }: RefreshingIndicatorProps) {
  if (!isRefreshing) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
      <RefreshCw className="h-4 w-4 animate-spin" />
      Atualizando dados...
    </div>
  );
}