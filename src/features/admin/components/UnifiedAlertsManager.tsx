// 🎯 Gerenciador Unificado de Alertas e Anúncios
// Interface centralizada para gerenciar alertas do sistema e anúncios para usuários

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Megaphone, AlertTriangle, Info, Users, Settings, Calendar, Eye, EyeOff, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { useSystemAlerts } from '../hooks/useAdmin';
import { useAnnouncements } from '../../announcements/hooks/useAnnouncements';
import type { SystemAlert } from '../types/admin.types';
import type { Announcement, AnnouncementCreate } from '../../announcements/types/announcements.types';

// Import form components
import { SystemAlertsManager } from './SystemAlertsManager';
import { AnnouncementManager } from '../../announcements/components/AnnouncementManager';

export const UnifiedAlertsManager: React.FC = () => {
  const { alerts: systemAlerts, loading: alertsLoading } = useSystemAlerts();
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Filter data based on search
  const filteredSystemAlerts = systemAlerts.filter(alert =>
    alert.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    totalSystemAlerts: systemAlerts.length,
    activeSystemAlerts: systemAlerts.filter(alert => alert.active).length,
    totalAnnouncements: announcements.length,
    activeAnnouncements: announcements.filter(announcement => announcement.active).length,
    criticalAlerts: systemAlerts.filter(alert => alert.priority >= 2).length,
    targetedAnnouncements: announcements.filter(announcement => 
      announcement.target_users?.length || announcement.target_roles?.length || announcement.target_routes?.length
    ).length
  };

  const getAlertKindIcon = (kind: string) => {
    switch (kind) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAnnouncementKindIcon = (kind: string) => {
    switch (kind) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <Info className="w-4 h-4 text-green-500" />;
      case 'promotion': return <Megaphone className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return <Badge variant="destructive">Crítica</Badge>;
    if (priority >= 2) return <Badge variant="destructive">Alta</Badge>;
    if (priority >= 1) return <Badge variant="default">Normal</Badge>;
    return <Badge variant="secondary">Baixa</Badge>;
  };

  const getTargetingInfo = (announcement: Announcement) => {
    const segments = [];
    if (announcement.target_users?.length) segments.push(`${announcement.target_users.length} usuário(s)`);
    if (announcement.target_roles?.length) segments.push(`${announcement.target_roles.length} cargo(s)`);
    if (announcement.target_routes?.length) segments.push(`${announcement.target_routes.length} página(s)`);
    return segments.length > 0 ? segments.join(', ') : 'Todos os usuários';
  };

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas do Sistema</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSystemAlerts}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSystemAlerts} total • {stats.criticalAlerts} críticos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Anúncios Ativos</CardTitle>
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAnnouncements}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalAnnouncements} total • {stats.targetedAnnouncements} segmentados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Alertas Críticos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Requerem atenção imediata
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.targetedAnnouncements + stats.activeSystemAlerts}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de comunicações ativas
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const RecentActivity = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas do Sistema Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredSystemAlerts.slice(0, 5).map(alert => (
            <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getAlertKindIcon(alert.kind)}
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityBadge(alert.priority)}
                    {alert.active ? (
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredSystemAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum alerta do sistema encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Anúncios Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAnnouncements.slice(0, 5).map(announcement => (
            <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getAnnouncementKindIcon(announcement.kind)}
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{announcement.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getTargetingInfo(announcement)}
                    </Badge>
                    {announcement.active ? (
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredAnnouncements.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum anúncio encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (alertsLoading || announcementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando alertas e anúncios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Alertas e Anúncios</h2>
            <p className="text-muted-foreground">
              Gerencie alertas do sistema e anúncios para usuários de forma centralizada
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Buscar alertas e anúncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="system-alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas do Sistema
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Anúncios
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <StatsCards />
          <RecentActivity />
        </TabsContent>

        {/* System Alerts Tab */}
        <TabsContent value="system-alerts">
          <SystemAlertsManager />
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <AnnouncementManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Relatórios de Alertas e Anúncios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalSystemAlerts}</div>
                  <p className="text-sm text-muted-foreground">Total de Alertas do Sistema</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalAnnouncements}</div>
                  <p className="text-sm text-muted-foreground">Total de Anúncios</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.criticalAlerts}</div>
                  <p className="text-sm text-muted-foreground">Alertas Críticos</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Relatórios Detalhados</h3>
                <p className="text-muted-foreground mb-4">
                  Análises detalhadas de engajamento e efetividade dos alertas e anúncios estarão disponíveis em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};