import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredAny?: string[];
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
}

export function PermissionRoute({ 
  children, 
  requiredPermissions = [], 
  requiredAny = [],
  fallbackComponent: FallbackComponent,
  redirectTo = '/'
}: PermissionRouteProps) {
  const { permissions, loading, error, hasAllPermissions, hasAnyPermission } = useUserPermissions();

  console.log('🔍 PermissionRoute Debug:', {
    path: window.location.pathname,
    requiredPermissions,
    userPermissions: permissions,
    loading,
    error
  });

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

  // Acesso negado - redirecionar para página inicial
  if (!hasAccess) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    // Redirecionar silenciosamente para a página inicial ou destino configurado
    return <Navigate to={redirectTo} replace />;
  }

  // Acesso autorizado - renderizar children
  return children;
}