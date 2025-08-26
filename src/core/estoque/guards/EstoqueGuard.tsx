import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EstoqueGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export function EstoqueGuard({ children, fallbackComponent: FallbackComponent }: EstoqueGuardProps) {
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

      // Tentar acessar a tabela produtos para verificar se tem acesso
      const { data, error } = await supabase
        .from('produtos')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Erro ao verificar acesso ao estoque:', error);
        setHasAccess(false);
        return;
      }

      // Se chegou até aqui, o usuário tem acesso
      setHasAccess(true);
      console.info('✅ Acesso ao estoque autorizado');
      
    } catch (error) {
      console.error('❌ Erro na verificação de acesso ao estoque:', error);
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
          <span>Verificando permissões de estoque...</span>
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
              🚫 Acesso Negado ao Estoque
            </div>
            <div className="text-sm">
              Você não possui permissão para visualizar o estoque. 
              Entre em contato com seu administrador para solicitar acesso.
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Permissões necessárias: <code>estoque:view</code>
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
  return (
    <div>
      {/* Header de status (só em dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-muted/30 border-b px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-green-600" />
            <Package className="h-3 w-3" />
            <span>Acesso ao Estoque Autorizado</span>
          </div>
          <div>
            Última verificação: {lastCheck.toLocaleTimeString()}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// Hook para usar o guard em outros componentes
export function useEstoqueGuard() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasAccess(false);
          return;
        }

        const { error } = await supabase
          .from('produtos')
          .select('id')
          .limit(1);

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