// 🎯 Gerenciador de Alertas do Sistema
// Interface para criar e gerenciar alertas globais

import React, { useState } from 'react';
import { useSystemAlerts } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bell, Plus, Edit, Trash2, ExternalLink, Eye, EyeOff, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import type { SystemAlert } from '../types/admin.types';
import { useToast } from '@/hooks/use-toast';

const ALERT_KINDS = [
  { value: 'info', label: 'Informativo', icon: Info, color: 'text-blue-500' },
  { value: 'warning', label: 'Aviso', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'error', label: 'Erro', icon: XCircle, color: 'text-red-500' },
  { value: 'success', label: 'Sucesso', icon: CheckCircle, color: 'text-green-500' }
];

// DB atualmente valida apenas alguns tipos; evitamos erros de constraint
const ALLOWED_KINDS_DB = ['info', 'warning'];
const AVAILABLE_KINDS = ALERT_KINDS.filter(k => ALLOWED_KINDS_DB.includes(k.value));

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Baixa' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Alta' },
  { value: 3, label: 'Crítica' }
];

interface AlertFormProps {
  alert?: SystemAlert;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const AlertForm: React.FC<AlertFormProps> = ({ alert, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    message: alert?.message || '',
    kind: alert?.kind || 'info',
    priority: alert?.priority || 1,
    active: alert?.active ?? true,
    href: alert?.href || '',
    link_label: alert?.link_label || '',
    expires_at: alert?.expires_at ? new Date(alert.expires_at).toISOString().slice(0, 16) : '',
    target_routes: alert?.target_routes ? alert.target_routes.join(', ') : ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    
    setLoading(true);
    try {
      const normalizedKind = (ALLOWED_KINDS_DB as string[]).includes(formData.kind)
        ? formData.kind
        : 'warning';

      const targetRoutes = formData.target_routes
        ? formData.target_routes.split(',').map(r => r.trim()).filter(Boolean)
        : undefined;

      const submitData = {
        message: formData.message,
        kind: normalizedKind as any,
        priority: formData.priority,
        active: formData.active,
        href: formData.href || undefined,
        link_label: formData.link_label || undefined,
        expires_at: formData.expires_at || undefined,
        target_routes: targetRoutes
      };

      await onSave(submitData);
      onCancel();
    } catch (err: any) {
      console.error('Failed to save alert:', err);
      toast({
        title: 'Erro ao salvar alerta',
        description: err?.message || 'Não foi possível salvar o alerta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="message">Mensagem do Alerta *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Digite a mensagem do alerta..."
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo do Alerta</Label>
          <Select value={formData.kind} onValueChange={(value: any) => 
            setFormData(prev => ({ ...prev, kind: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_KINDS.map(kind => {
                const Icon = kind.icon;
                return (
                  <SelectItem key={kind.value} value={kind.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${kind.color}`} />
                      {kind.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={formData.priority.toString()} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, priority: parseInt(value) }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(priority => (
                <SelectItem key={priority.value} value={priority.value.toString()}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <span className="text-sm">{formData.active ? 'Ativo' : 'Inativo'}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="href">Link de direcionamento (opcional)</Label>
          <Input
            id="href"
            value={formData.href}
            onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
            placeholder="/admin, /produtos, /dashboard ou URL externa"
          />
          <p className="text-sm text-muted-foreground">
            Use rotas internas (/admin) ou URLs completas (https://exemplo.com)
          </p>
        </div>

        {formData.href && (
          <div className="space-y-2">
            <Label htmlFor="link_label">Texto do botão/link</Label>
            <Input
              id="link_label"
              value={formData.link_label}
              onChange={(e) => setFormData(prev => ({ ...prev, link_label: e.target.value }))}
              placeholder="Ver detalhes, Acessar página, etc."
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
        <Input
          id="expires_at"
          type="datetime-local"
          value={formData.expires_at}
          onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Segmentação (opcional)</Label>
          <p className="text-sm text-muted-foreground">
            Deixe vazio para mostrar a todos os usuários da organização
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_routes">Rotas específicas</Label>
          <Input
            id="target_routes"
            value={formData.target_routes}
            onChange={(e) => setFormData(prev => ({ ...prev, target_routes: e.target.value }))}
            placeholder="/admin, /produtos, /dashboard"
          />
          <p className="text-sm text-muted-foreground">
            Separar por vírgula. Ex: /admin, /produtos. Deixe vazio para mostrar em todas as páginas.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.message.trim()}>
          {loading ? 'Salvando...' : alert ? 'Atualizar' : 'Criar'} Alerta
        </Button>
      </div>
    </form>
  );
};

export const SystemAlertsManager: React.FC = () => {
  const { alerts, loading, createAlert, updateAlert, deleteAlert } = useSystemAlerts();
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SystemAlert | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlerts = alerts.filter(alert =>
    alert.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (data: any) => {
    if (editingAlert) {
      await updateAlert(editingAlert.id, data);
    } else {
      await createAlert(data);
    }
  };

  const handleEdit = (alert: SystemAlert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAlert(undefined);
  };

  const getAlertKind = (kind: string) => {
    const alertKind = ALERT_KINDS.find(k => k.value === kind);
    if (!alertKind) return null;
    
    const Icon = alertKind.icon;
    return (
      <div className={`flex items-center gap-1 ${alertKind.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm">{alertKind.label}</span>
      </div>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const priorityData = PRIORITY_OPTIONS.find(p => p.value === priority);
    const variant = priority >= 2 ? 'destructive' : priority === 1 ? 'default' : 'secondary';
    return <Badge variant={variant}>{priorityData?.label || 'Normal'}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando alertas...</p>
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
            <h2 className="text-2xl font-bold">Alertas do Sistema</h2>
            <p className="text-muted-foreground">
              Gerencie alertas globais para todos os usuários
            </p>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAlert(undefined)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAlert ? 'Editar Alerta' : 'Criar Novo Alerta'}
              </DialogTitle>
            </DialogHeader>
            <AlertForm
              alert={editingAlert}
              onSave={handleSave}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar alertas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Alerts List */}
      <div className="grid gap-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro alerta'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Alerta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => (
            <Card key={alert.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getAlertKind(alert.kind)}
                      {getPriorityBadge(alert.priority)}
                      {alert.active ? (
                        <Badge variant="default" className="gap-1">
                          <Eye className="w-3 h-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="w-3 h-3" />
                          Inativo
                        </Badge>
                      )}
                      {alert.expires_at && (
                        <Badge variant="outline" className="gap-1">
                          Expira {new Date(alert.expires_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Criado em {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Alerta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAlert(alert.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{alert.message}</p>
                {alert.href && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <ExternalLink className="w-4 h-4" />
                    <a href={alert.href} target="_blank" rel="noopener noreferrer">
                      {alert.link_label || 'Link'}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};