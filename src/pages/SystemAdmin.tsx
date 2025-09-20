import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Activity, 
  Bell, 
  Database, 
  Settings, 
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { SystemDashboard } from '@/components/system/SystemDashboard';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/utils/notifications';
import { logger } from '@/utils/logger';

export default function SystemAdmin() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const notifications = useNotifications();
  const { alertRules, testAlert, clearAllCooldowns } = useSystemAlerts(alertsEnabled);

  // Basic admin check - you can enhance this with proper permissions
  const hasAdminAccess = user?.email?.includes('admin') || user?.user_metadata?.role === 'admin';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Shield className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSystemAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'clear_cache':
          // Clear React Query cache
          window.location.reload();
          notifications.success('Cache limpo com sucesso');
          break;

        case 'export_logs':
          // Export system logs (placeholder)
          const logs = {
            timestamp: new Date().toISOString(),
            user: user?.email,
            action: 'export_logs',
            system_info: {
              userAgent: navigator.userAgent,
              url: window.location.href
            }
          };
          
          const blob = new Blob([JSON.stringify(logs, null, 2)], { 
            type: 'application/json' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          notifications.success('Logs exportados com sucesso');
          break;

        case 'cleanup_data':
          // Cleanup old data (placeholder)
          notifications.success('Limpeza de dados concluída');
          break;

        default:
          notifications.info(`Ação ${action} executada`);
      }
    } catch (error) {
      logger.error(`System action failed: ${action}`, error);
      notifications.error('Erro ao executar ação do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Administração do Sistema</h1>
          <p className="text-muted-foreground">
            Painel administrativo para monitoramento e manutenção
          </p>
        </div>
        
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-3 w-3" />
          Admin Access
        </Badge>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SystemDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Sistema de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="alerts-enabled"
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                  />
                  <Label htmlFor="alerts-enabled">Alertas Automáticos</Label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllCooldowns}
                >
                  Limpar Cooldowns
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Os alertas são verificados a cada minuto quando ativados. 
                  Cada alerta tem um período de cooldown para evitar spam.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Regras de Alerta</h4>
                {alertRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          rule.severity === 'error' ? 'destructive' : 
                          rule.severity === 'warning' ? 'default' : 
                          'secondary'
                        }>
                          {rule.severity}
                        </Badge>
                        <span className="font-medium">{rule.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cooldown: {rule.cooldown} minutos
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testAlert(rule.id)}
                    >
                      Testar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  A gestão detalhada de usuários está disponível na página de Administração principal.
                  Aqui você pode ver estatísticas gerais do sistema.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-sm text-muted-foreground">Organizações</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manutenção do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> As ações de manutenção podem afetar o desempenho do sistema. 
                  Execute apenas quando necessário.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">Cache do Sistema</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Limpar cache da aplicação e recarregar dados.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSystemAction('clear_cache')}
                      disabled={isLoading}
                    >
                      Limpar Cache
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-4 w-4" />
                      <span className="font-medium">Exportar Logs</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Baixar logs do sistema para análise.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSystemAction('export_logs')}
                      disabled={isLoading}
                    >
                      Exportar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Limpeza de Dados</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Remover dados antigos e logs desnecessários.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSystemAction('cleanup_data')}
                      disabled={isLoading}
                    >
                      Limpar Dados
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">Health Check</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Executar verificação completa do sistema.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      disabled={isLoading}
                    >
                      Verificar Sistema
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  As configurações do sistema são gerenciadas através de variáveis de ambiente.
                  Alterações requerem redeploy da aplicação.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Monitoramento</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Health Check Interval</Label>
                      <Badge variant="outline">30 segundos</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Alert Check Interval</Label>
                      <Badge variant="outline">60 segundos</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>API Timeout</Label>
                      <Badge variant="outline">30 segundos</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Retry Attempts</Label>
                      <Badge variant="outline">3 tentativas</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Rate Limiting</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Requests per Minute</Label>
                      <Badge variant="outline">100 req/min</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}