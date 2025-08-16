// 🎯 Mini dashboard de saúde das integrações
// Exibe status resumido de todas as integrações

import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIntegrationHealth } from '@/features/integrations/hooks/useIntegrationHealth';
import { cn } from '@/lib/utils';

interface HealthMiniProps {
  className?: string;
}

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'down':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getHealthColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-success';
    case 'degraded':
      return 'text-warning';
    case 'down':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};

const getOverallHealthVariant = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'default' as const;
    case 'degraded':
      return 'secondary' as const;
    case 'down':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
};

export const HealthMini: React.FC<HealthMiniProps> = ({ className }) => {
  const { healthStatus, overallHealth, loading } = useIntegrationHealth();

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status das Integrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-pulse bg-muted rounded" />
            Verificando status...
          </div>
        </CardContent>
      </Card>
    );
  }

  const providers = Object.keys(healthStatus);
  
  if (providers.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status das Integrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Nenhuma integração monitorada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status das Integrações
          </div>
          <Badge variant={getOverallHealthVariant(overallHealth)}>
            {overallHealth}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {providers.map((provider) => {
            const health = healthStatus[provider as keyof typeof healthStatus];
            if (!health) return null;

            return (
              <div
                key={provider}
                className="flex items-center gap-2 text-sm"
              >
                {getHealthIcon(health.status)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium capitalize truncate">
                    {provider}
                  </div>
                  <div className={cn(
                    "text-xs truncate",
                    getHealthColor(health.status)
                  )}>
                    {health.response_time > 0 && (
                      <span>{health.response_time}ms</span>
                    )}
                    {health.status === 'down' && health.last_error && (
                      <span>Error</span>
                    )}
                    {health.status === 'healthy' && (
                      <span>Online</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Health Summary */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Última verificação:</span>
            <span>
              {providers.length > 0 && healthStatus[providers[0] as keyof typeof healthStatus]?.last_check
                ? new Date(healthStatus[providers[0] as keyof typeof healthStatus]!.last_check).toLocaleTimeString()
                : 'Nunca'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};