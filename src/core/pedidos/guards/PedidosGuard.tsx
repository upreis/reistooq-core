import React, { useEffect, useState } from 'react';
import { verifyPedidosSystemIntegritySync, PEDIDOS_SYSTEM_VERSION } from '../index';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';

interface PedidosGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export function PedidosGuard({ children, fallbackComponent: FallbackComponent }: PedidosGuardProps) {
  const [isSystemHealthy, setIsSystemHealthy] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkSystemHealth = () => {
    const healthy = verifyPedidosSystemIntegritySync();
    setIsSystemHealthy(healthy);
    setLastCheck(new Date());
    
    if (!healthy) {
      console.error('🚨 SISTEMA DE PEDIDOS COMPROMETIDO - Verificação de integridade falhou');
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Verificação periódica (a cada 30 segundos)
    const interval = setInterval(checkSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Sistema não verificado ainda
  if (isSystemHealthy === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Verificando integridade do sistema...</span>
        </div>
      </div>
    );
  }

  // Sistema comprometido
  if (!isSystemHealthy) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <div className="p-6 space-y-4">
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div className="font-medium text-destructive">
              🚨 Sistema de Pedidos Comprometido
            </div>
            <div className="text-sm">
              A integridade do sistema foi comprometida. Por favor, recarregue a página ou contate o suporte.
            </div>
            <div className="text-xs text-muted-foreground">
              Última verificação: {lastCheck.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Recarregar Página
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Sistema saudável - renderizar children
  return (
    <div>
      {children}
    </div>
  );
}

// Hook para usar o guard em outros componentes
export function usePedidosGuard() {
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    const checkHealth = () => {
      const healthy = verifyPedidosSystemIntegritySync();
      setIsHealthy(healthy);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { isHealthy };
}