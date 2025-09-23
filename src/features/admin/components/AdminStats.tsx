import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Mail, Bell, History, AlertTriangle } from 'lucide-react';
import { useRoles, useUsers, useInvitations, useSystemAlerts } from '../hooks/useAdmin';

export const AdminStats: React.FC = () => {
  const { roles, loading: rolesLoading } = useRoles();
  const { users, loading: usersLoading } = useUsers();
  const { invitations, loading: invitationsLoading } = useInvitations();
  const { alerts, loading: alertsLoading } = useSystemAlerts();

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalRoles: roles.length,
    pendingInvitations: invitations.filter(inv => inv.status === 'pending').length,
    activeAlerts: alerts.filter(alert => alert.active).length,
    systemRoles: roles.filter(role => role.is_system).length,
    customRoles: roles.filter(role => !role.is_system).length
  };

  if (rolesLoading || usersLoading || invitationsLoading || alertsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Usuários ativos na organização
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cargos</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRoles}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{stats.systemRoles} sistema</Badge>
            <Badge variant="outline">{stats.customRoles} personalizados</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingInvitations}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando aceitação
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Alertas do sistema ativos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};