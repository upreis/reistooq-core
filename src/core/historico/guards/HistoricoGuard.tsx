import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HistoricoGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export function HistoricoGuard({ children, fallbackComponent: FallbackComponent }: HistoricoGuardProps) {
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

      // Tentar acessar a função RPC para verificar permissões
      const { data, error } = await supabase.rpc('get_historico_vendas_masked', {
        _limit: 1,
        _offset: 0
      });

      if (error) {
        console.error('❌ Erro ao verificar acesso ao histórico:', error);
        setHasAccess(false);
        return;
      }

      // Se chegou até aqui, o usuário tem acesso
      setHasAccess(true);
      console.info('✅ Acesso ao histórico autorizado');
      
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
              🚫 Acesso Negado ao Histórico
            </div>
            <div className="text-sm">
              Você não possui permissão para visualizar o histórico de vendas. 
              Entre em contato com seu administrador para solicitar acesso.
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Permissões necessárias: <code>historico:view</code> ou <code>vendas:read</code>
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
export function useHistoricoGuard() {
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

        const { error } = await supabase.rpc('get_historico_vendas_masked', {
          _limit: 1,
          _offset: 0
        });

        setHasAccess(!error);
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