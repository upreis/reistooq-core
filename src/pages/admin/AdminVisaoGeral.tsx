import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Mail, AlertTriangle } from 'lucide-react';
import { useInvitations, useSystemAlerts } from '@/features/admin/hooks/useAdmin';

export const AdminVisaoGeral: React.FC = () => {
  const { invitations } = useInvitations();
  const { alerts } = useSystemAlerts();

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

  return (
    <div className="space-y-6">
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
    </div>
  );
};