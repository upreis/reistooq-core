// 🎯 Componente principal de administração
// Dashboard completo para RBAC, usuários, convites e sistema

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Shield, Mail, Bell, History, AlertTriangle } from 'lucide-react';

import { RoleManager } from './RoleManager';
import { UserManager } from './UserManager';
import { InvitationManager } from './InvitationManager';
import { SystemAlertsManager } from './SystemAlertsManager';
import { AuditLogsViewer } from './AuditLogsViewer';
import { SecurityDashboard } from '@/features/security/components/SecurityDashboard';
import { useRoles, useUsers, useInvitations, useSystemAlerts } from '../hooks/useAdmin';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
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

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

  const RecentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recent invitations */}
          {invitations.slice(0, 3).map(invitation => (
            <div key={invitation.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Convite enviado</p>
                  <p className="text-xs text-muted-foreground">{invitation.email}</p>
                </div>
              </div>
              <Badge variant={invitation.status === 'pending' ? 'default' : 'secondary'}>
                {invitation.status === 'pending' ? 'Pendente' : 
                 invitation.status === 'accepted' ? 'Aceito' : 'Revogado'}
              </Badge>
            </div>
          ))}
          
          {/* Recent alerts */}
          {alerts.slice(0, 2).map(alert => (
            <div key={alert.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Alerta criado</p>
                  <p className="text-xs text-muted-foreground">{alert.message.slice(0, 50)}...</p>
                </div>
              </div>
              <Badge variant={alert.kind === 'error' ? 'destructive' : 'default'}>
                {alert.kind}
              </Badge>
            </div>
          ))}

          {invitations.length === 0 && alerts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade recente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (rolesLoading || usersLoading || invitationsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administração</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, cargos, permissões e configurações do sistema
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Convites
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <StatsCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autenticação</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Banco de Dados</span>
                    <Badge variant="default">Conectado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Integrações</span>
                    <Badge variant="secondary">Parcial</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notificações</span>
                    <Badge variant="default">Funcionando</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserManager />
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <RoleManager />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <InvitationManager />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <AuditLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};