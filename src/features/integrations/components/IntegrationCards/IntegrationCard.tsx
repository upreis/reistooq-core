// 🎯 Card individual de integração
// Exibe status, ações e saúde de uma integração específica

import React, { useCallback } from 'react';
import { Settings, Play, Square, TestTube, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Integration, HealthCheck, Provider } from '@/features/integrations/types/integrations.types';

interface IntegrationCardProps {
  integration: Integration;
  health?: HealthCheck | null;
  onConnect: (provider: Provider) => void;
  onDisconnect: (provider: Provider) => void;
  onTest: (provider: Provider) => void | Promise<void>;
  onConfigure: (provider: Provider) => void;
  onOAuth?: (provider: Provider) => void;
  isAuthenticating?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'connected':
      return 'default' as const;
    case 'error':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

const getHealthColor = (status?: string) => {
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

const supportsOAuth = (provider: Provider): boolean => {
  return ['mercadolivre', 'shopee'].includes(provider);
};

export const IntegrationCard: React.FC<IntegrationCardProps> = React.memo(({
  integration,
  health,
  onConnect,
  onDisconnect,
  onTest,
  onConfigure,
  onOAuth,
  isAuthenticating = false
}) => {
  const handleConnect = useCallback(() => {
    onConnect(integration.provider);
  }, [onConnect, integration.provider]);

  const handleDisconnect = useCallback(() => {
    onDisconnect(integration.provider);
  }, [onDisconnect, integration.provider]);

  const handleTest = useCallback(() => {
    onTest(integration.provider);
  }, [onTest, integration.provider]);

  const handleConfigure = useCallback(() => {
    onConfigure(integration.provider);
  }, [onConfigure, integration.provider]);

  const handleOAuth = useCallback(() => {
    if (onOAuth) {
      onOAuth(integration.provider);
    }
  }, [onOAuth, integration.provider]);

  const isConnected = integration.status === 'connected';
  const hasError = integration.status === 'error';
  const needsOAuth = supportsOAuth(integration.provider) && !isConnected;

  return (
    <Card 
      className="h-full flex flex-col"
      data-testid={`integration-card-${integration.provider}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {integration.name}
              {getStatusIcon(integration.status)}
            </CardTitle>
            <CardDescription className="mt-1">
              {integration.description}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(integration.status)}>
            {integration.status}
          </Badge>
        </div>

        {/* Health & Last Sync Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          {health && (
            <span className={`flex items-center gap-1 ${getHealthColor(health.status)}`}>
              <div className={`w-2 h-2 rounded-full bg-current`} />
              {health.status}
            </span>
          )}
          {integration.last_sync && (
            <span>
              Sync: {new Date(integration.last_sync).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Error Message */}
        {hasError && integration.last_error && (
          <div className="mt-2 text-sm text-destructive bg-destructive/10 rounded-md p-2">
            {integration.last_error}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex flex-col gap-2">
          {/* Primary Action Button */}
          {needsOAuth ? (
            <Button
              onClick={handleOAuth}
              disabled={isAuthenticating}
              className="w-full"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isAuthenticating ? 'Conectando...' : 'Conectar via OAuth'}
            </Button>
          ) : (
            <Button
              onClick={isConnected ? handleDisconnect : handleConnect}
              variant={isConnected ? 'outline' : 'default'}
              className="w-full"
              size="sm"
            >
              {isConnected ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Desconectar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!isConnected}
            >
              <TestTube className="h-4 w-4 mr-1" />
              Testar
            </Button>
            <Button
              onClick={handleConfigure}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-1" />
              Config
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

IntegrationCard.displayName = 'IntegrationCard';