import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ComprasGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export function ComprasGuard({ children, fallbackComponent: FallbackComponent }: ComprasGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkAccess = async () => {
    try {
      setIsChecking(true);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Liberação global para o email do proprietário
      const email = user.email?.toLowerCase();
      if (email === 'nildoreiz@hotmail.com') {
        setHasAccess(true);
        return;
      }

      // Verificar permissões do usuário
      const { data: permissions, error } = await supabase.rpc('get_user_permissions');

      if (error) {
        console.error('❌ Erro ao verificar permissões:', error);
        setHasAccess(false);
        return;
      }

      // Verificar se tem a permissão compras:view
      const hasPermission = permissions && permissions.includes('compras:view');
      
      if (hasPermission) {
        setHasAccess(true);
        console.info('✅ Acesso ao sistema de compras autorizado');
      } else {
        console.warn('❌ Permissão compras:view não encontrada');
        setHasAccess(false);
      }
      
    } catch (error) {
      console.error('❌ Erro na verificação de acesso:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkAccess();
    
    // Verificação periódica a cada 2 minutos
    const interval = setInterval(checkAccess, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // Ainda verificando acesso
  if (isChecking || hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Verificando permissões de acesso...</span>
        </div>
      </div>
    );
  }

  // Acesso negado
  if (!hasAccess) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <div className="p-6 space-y-4">
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div className="font-medium text-destructive">
              🚫 Acesso Negado ao Sistema de Compras
            </div>
            <div className="text-sm">
              Você não possui permissão para acessar o sistema de compras. 
              Entre em contato com seu administrador para solicitar acesso.
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Permissões necessárias: <code>compras:view</code>
            </div>
            <div className="text-xs text-muted-foreground">
              Última verificação: {lastCheck.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkAccess}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Acesso autorizado - renderizar children
  return children;
}

// Hook para usar o guard em outros componentes
export function useComprasGuard() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasAccess(false);
          return;
        }

        const email = user.email?.toLowerCase();
        if (email === 'nildoreiz@hotmail.com') {
          setHasAccess(true);
          return;
        }

        const { data: permissions, error } = await supabase.rpc('get_user_permissions');
        const hasPermission = permissions && permissions.includes('compras:view');
        
        setHasAccess(hasPermission && !error);
      } catch (error) {
        setHasAccess(false);
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 120000);

    return () => clearInterval(interval);
  }, []);

  return { hasAccess };
}