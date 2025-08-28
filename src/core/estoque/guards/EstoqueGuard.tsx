import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw, Package } from 'lucide-react';

interface EstoqueGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export function EstoqueGuard({ children, fallbackComponent: FallbackComponent }: EstoqueGuardProps) {
  const { hasPermission, loading, error } = useUserPermissions();

  // Ainda carregando permissões
  if (loading) {
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
  if (!hasPermission('estoque:view')) {
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
            {error && (
              <div className="text-xs text-destructive">
                Erro: {error}
              </div>
            )}
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
            <span>Acesso ao Estoque Autorizado (estoque:view)</span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// Hook para usar o guard em outros componentes
export function useEstoqueGuard() {
  const { hasPermission } = useUserPermissions();
  return { hasAccess: hasPermission('estoque:view') };
}