import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredAny?: string[];
  fallbackComponent?: React.ComponentType;
}

export function PermissionRoute({ 
  children, 
  requiredPermissions = [], 
  requiredAny = [],
  fallbackComponent: FallbackComponent 
}: PermissionRouteProps) {
  const { permissions, loading, error, hasAllPermissions, hasAnyPermission } = useUserPermissions();

  // Ainda carregando permissões
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // Erro ao carregar permissões
  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium text-destructive mb-2">
              Erro ao verificar permissões
            </div>
            <div className="text-sm">
              {error}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verificar se tem as permissões necessárias
  const hasRequiredPermissions = requiredPermissions.length === 0 || hasAllPermissions(requiredPermissions);
  const hasAnyRequiredPermission = requiredAny.length === 0 || hasAnyPermission(requiredAny);

  const hasAccess = hasRequiredPermissions && hasAnyRequiredPermission;

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
              🚫 Acesso Negado
            </div>
            <div className="text-sm">
              Você não possui permissão para acessar esta página. 
              Entre em contato com seu administrador para solicitar acesso.
            </div>
            {requiredPermissions.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                Permissões obrigatórias: {requiredPermissions.map(p => `"${p}"`).join(', ')}
              </div>
            )}
            {requiredAny.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Pelo menos uma destas permissões: {requiredAny.map(p => `"${p}"`).join(', ')}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Suas permissões: {permissions.length > 0 ? permissions.map(p => `"${p}"`).join(', ') : 'Nenhuma'}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Recarregar
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
            <span>Acesso Autorizado</span>
          </div>
          <div>
            Permissões: {permissions.slice(0, 3).join(', ')}{permissions.length > 3 ? '...' : ''}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}