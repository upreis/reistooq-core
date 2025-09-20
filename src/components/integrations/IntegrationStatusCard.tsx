import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { IntegrationStatus } from '@/utils/apiHelpers';
import { useState } from 'react';
import { toast } from 'sonner';

interface IntegrationStatusCardProps {
  status: IntegrationStatus;
  onReconnect?: (accountId: string, provider: string) => Promise<any>;
}

export function IntegrationStatusCard({ status, onReconnect }: IntegrationStatusCardProps) {
  const [reconnecting, setReconnecting] = useState(false);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'rate_limited':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (status.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'rate_limited':
        return <Badge variant="secondary" className="bg-yellow-500">Rate Limited</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Desconectado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'connected':
        return status.lastSuccess 
          ? `Última sincronização: ${status.lastSuccess.toLocaleString()}`
          : 'Funcionando normalmente';
      case 'error':
        return status.lastError || 'Erro de conexão';
      case 'rate_limited':
        return 'Muitas requisições - aguarde alguns minutos';
      case 'disconnected':
        return 'Integração não conectada';
      default:
        return 'Status desconhecido';
    }
  };

  const handleReconnect = async () => {
    if (!onReconnect) return;

    setReconnecting(true);
    try {
      const result = await onReconnect('', status.provider); // Será preenchido no hook
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        
        if (result.requiresOAuth) {
          // Redirecionar para OAuth se necessário
        }
      }
    } catch (error) {
      toast.error('Erro na reconexão');
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          {status.provider.charAt(0).toUpperCase() + status.provider.slice(1)}
        </CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {getStatusMessage()}
          </p>
          
          {status.errorCount > 0 && (
            <p className="text-xs text-red-500">
              {status.errorCount} erro(s) recente(s)
            </p>
          )}

          {(status.status === 'error' || status.status === 'disconnected') && onReconnect && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleReconnect}
              disabled={reconnecting}
              className="w-full mt-2"
            >
              {reconnecting && <RefreshCw className="mr-2 h-3 w-3 animate-spin" />}
              {reconnecting ? 'Reconectando...' : 'Tentar Reconectar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}