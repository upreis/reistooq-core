import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface PedidosHealthCheckProps {
  integrationAccountId: string;
  onHealthChange: (isHealthy: boolean) => void;
  onReconnectClick: () => void;
}

export function PedidosHealthCheck({ integrationAccountId, onHealthChange, onReconnectClick }: PedidosHealthCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'needs_reconnect' | 'no_tokens'>('unknown');

  const checkTokensHealth = async (accountId: string) => {
    if (!accountId) return { ok: false, reason: 'no_account_id' };
    
    try {
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: { 
          integration_account_id: accountId, 
          limit: 1, 
          healthCheck: true 
        }
      });

      if (error) {
        console.warn('[HealthCheck] Error:', error);
        return { ok: false, reason: 'error' };
      }

      if (data?.error === 'reconnect_required' || data?.error === 'no_tokens') {
        return { ok: false, reason: data.error };
      }

      return { ok: data?.ok === true };
    } catch (err) {
      console.warn('[HealthCheck] Exception:', err);
      return { ok: false, reason: 'exception' };
    }
  };

  const performHealthCheck = async () => {
    if (!integrationAccountId) {
      setHealthStatus('no_tokens');
      onHealthChange(false);
      return;
    }

    setIsChecking(true);
    console.log('[HealthCheck] Verificando saúde dos tokens...');
    
    const result = await checkTokensHealth(integrationAccountId);
    
    if (result.ok) {
      setHealthStatus('healthy');
      onHealthChange(true);
      console.log('[HealthCheck] ✅ Tokens válidos');
    } else {
      const status = result.reason === 'no_tokens' 
        ? 'no_tokens' 
        : 'needs_reconnect';
      setHealthStatus(status);
      onHealthChange(false);
      console.log('[HealthCheck] ❌ Tokens inválidos:', result.reason);
    }
    
    setIsChecking(false);
  };

  useEffect(() => {
    performHealthCheck();
  }, [integrationAccountId]);

  if (healthStatus === 'healthy' || healthStatus === 'unknown') {
    return null;
  }

  const getAlertContent = () => {
    switch (healthStatus) {
      case 'needs_reconnect':
      
        return {
          title: 'Reconexão Necessária',
          description: 'Sua conexão com o Mercado Livre expirou. Clique em "Reconectar" para continuar visualizando seus pedidos.',
          action: 'Reconectar Mercado Livre'
        };
      case 'no_tokens':
        return {
          title: 'Conta não Conectada',
          description: 'Esta conta não possui tokens válidos. Conecte-se ao Mercado Livre para visualizar pedidos.',
          action: 'Conectar Mercado Livre'
        };
      default:
        return {
          title: 'Problema de Conexão',
          description: 'Houve um problema ao verificar sua conexão. Tente reconectar.',
          action: 'Tentar Reconectar'
        };
    }
  };

  const alertContent = getAlertContent();

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong className="text-orange-800">{alertContent.title}</strong>
          <p className="text-orange-700 mt-1">{alertContent.description}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={performHealthCheck}
            disabled={isChecking}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          <Button
            onClick={onReconnectClick}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {alertContent.action}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}