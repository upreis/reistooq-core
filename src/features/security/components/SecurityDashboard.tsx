// 🛡️ Dashboard de Segurança Empresarial

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthEnterpriseService, AccessAttempt, SystemBackup, DataSubjectRequest } from '@/services/AuthEnterpriseService';
import { AccessScheduleManager } from './AccessScheduleManager';
import { Shield, Clock, Archive, Scale, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecurityStats {
  accessAttempts: number;
  failedAttempts: number;
  activeSchedules: number;
  pendingBackups: number;
  lgpdRequests: number;
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats>({
    accessAttempts: 0,
    failedAttempts: 0,
    activeSchedules: 0,
    pendingBackups: 0,
    lgpdRequests: 0
  });
  const [accessAttempts, setAccessAttempts] = useState<AccessAttempt[]>([]);
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [lgpdRequests, setLgpdRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, attemptsData, backupsData, lgpdData] = await Promise.all([
        AuthEnterpriseService.getSecurityStats(),
        AuthEnterpriseService.getAccessAttempts(50),
        AuthEnterpriseService.getSystemBackups(),
        AuthEnterpriseService.getDataSubjectRequests()
      ]);

      setStats(statsData);
      setAccessAttempts(attemptsData);
      setBackups(backupsData);
      setLgpdRequests(lgpdData);
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
      toast.error('Erro ao carregar dados de segurança');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBackup = async (type: 'full' | 'incremental' | 'critical_data') => {
    const result = await AuthEnterpriseService.requestSystemBackup(type);
    if (result.success) {
      loadData(); // Recarregar dados
    }
  };

  const handleLgpdRequest = async (requestId: string, status: 'completed' | 'rejected', notes?: string) => {
    const result = await AuthEnterpriseService.processDataSubjectRequest(requestId, status, notes);
    if (result.success) {
      loadData(); // Recarregar dados
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard de segurança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tentativas de Acesso</p>
                <p className="text-2xl font-bold">{stats.accessAttempts}</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falhas de Login</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedAttempts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horários Ativos</p>
                <p className="text-2xl font-bold">{stats.activeSchedules}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Backups Pendentes</p>
                <p className="text-2xl font-bold">{stats.pendingBackups}</p>
              </div>
              <Archive className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solicitações LGPD</p>
                <p className="text-2xl font-bold">{stats.lgpdRequests}</p>
              </div>
              <Scale className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Funcionalidades */}
      <Tabs defaultValue="access" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="access">Tentativas de Acesso</TabsTrigger>
          <TabsTrigger value="schedule">Horários</TabsTrigger>
          <TabsTrigger value="backup">Backups</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD</TabsTrigger>
        </TabsList>

        {/* Tab: Tentativas de Acesso */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Tentativas de Acesso Recentes</CardTitle>
              <CardDescription>
                Últimas 50 tentativas de login no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma tentativa de acesso registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accessAttempts.map(attempt => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {attempt.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{attempt.email || 'Email não informado'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(attempt.attempt_time), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={attempt.success ? "default" : "destructive"}>
                          {attempt.success ? 'Sucesso' : 'Falha'}
                        </Badge>
                        {attempt.blocked_reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {attempt.blocked_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Horários de Acesso */}
        <TabsContent value="schedule">
          <AccessScheduleManager />
        </TabsContent>

        {/* Tab: Backups */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backups do Sistema</CardTitle>
                  <CardDescription>
                    Gerencie backups automáticos e manuais
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleBackup('critical_data')} variant="outline">
                    Backup Crítico
                  </Button>
                  <Button onClick={() => handleBackup('incremental')} variant="outline">
                    Backup Incremental
                  </Button>
                  <Button onClick={() => handleBackup('full')}>
                    Backup Completo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum backup registrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map(backup => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{backup.backup_type.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          Iniciado {formatDistanceToNow(new Date(backup.started_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <Badge 
                          variant={
                            backup.status === 'completed' ? 'default' :
                            backup.status === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {backup.status}
                        </Badge>
                        {backup.file_size && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(backup.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: LGPD */}
        <TabsContent value="lgpd">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações LGPD</CardTitle>
              <CardDescription>
                Gerencie solicitações de dados dos usuários conforme LGPD
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lgpdRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Scale className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma solicitação LGPD</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lgpdRequests.map(request => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{request.requested_by_email}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.request_type.toUpperCase()} - {formatDistanceToNow(new Date(request.requested_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleLgpdRequest(request.id, 'completed')}
                            >
                              Concluir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLgpdRequest(request.id, 'rejected', 'Solicitação rejeitada')}
                            >
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}