// Fase 6: Componente de feedback visual para ações
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ActionFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: AlertTriangle,
};

const colorMap = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const bgMap = {
  success: 'border-green-500/20 bg-green-500/10',
  error: 'border-destructive/20 bg-destructive/10',
  warning: 'border-yellow-500/20 bg-yellow-500/10',
  info: 'border-blue-500/20 bg-blue-500/10',
};

export function ActionFeedback({
  type,
  title,
  message,
  onRetry,
  onDismiss,
  showRetry = false,
}: ActionFeedbackProps) {
  const Icon = iconMap[type];
  const colorClass = colorMap[type];
  const bgClass = bgMap[type];

  return (
    <Alert className={bgClass}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${colorClass} mt-0.5 flex-shrink-0`} />
        <AlertDescription className="flex-1">
          <div className="space-y-2">
            <div className={`font-medium text-sm ${colorClass}`}>{title}</div>
            <div className="text-sm text-muted-foreground">{message}</div>
            {(showRetry || onDismiss) && (
              <div className="flex gap-2 mt-3">
                {showRetry && onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                )}
                {onDismiss && (
                  <Button variant="ghost" size="sm" onClick={onDismiss}>
                    Fechar
                  </Button>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}
