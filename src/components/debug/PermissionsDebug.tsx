import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PermissionsDebug: React.FC = () => {
  const { permissions, loading, error, hasPermission } = useUserPermissions();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 animate-spin" />
            <span>Carregando permissões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Debug de Permissões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Erro: {error}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium mb-2">Total de Permissões: {permissions.length}</h4>
            {permissions.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma permissão encontrada - use a seção abaixo para atribuir um cargo</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {permissions.map(permission => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>

        <div>
          <h4 className="font-medium mb-2">Teste de Permissões Principais:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={hasPermission('dashboard:view') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('dashboard:view') ? '✓' : '✗'}
              </span>
              Dashboard
            </div>
            <div className="flex items-center gap-2">
              <span className={hasPermission('compras:view') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('compras:view') ? '✓' : '✗'}
              </span>
              Compras
            </div>
            <div className="flex items-center gap-2">
              <span className={hasPermission('estoque:view') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('estoque:view') ? '✓' : '✗'}
              </span>
              Estoque
            </div>
            <div className="flex items-center gap-2">
              <span className={hasPermission('admin:access') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('admin:access') ? '✓' : '✗'}
              </span>
              Administração
            </div>
            <div className="flex items-center gap-2">
              <span className={hasPermission('oms:view') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('oms:view') ? '✓' : '✗'}
              </span>
              OMS
            </div>
            <div className="flex items-center gap-2">
              <span className={hasPermission('users:read') ? 'text-green-600' : 'text-red-600'}>
                {hasPermission('users:read') ? '✓' : '✗'}
              </span>
              Usuários
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};