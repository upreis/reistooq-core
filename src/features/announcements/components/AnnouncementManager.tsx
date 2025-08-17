// 🎯 Gerenciador completo de anúncios
// Interface para criar, editar e excluir anúncios com segmentação avançada

import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { AnnouncementService } from '../services/AnnouncementService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone, Plus, Edit, Trash2, Users, Shield, Route, Calendar, ExternalLink, Eye, EyeOff } from 'lucide-react';
import type { Announcement, AnnouncementCreate, AnnouncementKind, AnnouncementTargeting } from '../types/announcements.types';

const ANNOUNCEMENT_KINDS: Array<{value: AnnouncementKind, label: string, color: string}> = [
  { value: 'info', label: 'Informativo', color: 'bg-blue-500' },
  { value: 'warning', label: 'Aviso', color: 'bg-yellow-500' },
  { value: 'success', label: 'Sucesso', color: 'bg-green-500' },
  { value: 'error', label: 'Erro', color: 'bg-red-500' },
  { value: 'promotion', label: 'Promoção', color: 'bg-purple-500' }
];

const ROUTE_OPTIONS = [
  { value: '/estoque', label: 'Estoque' },
  { value: '/pedidos', label: 'Pedidos' },
  { value: '/historico', label: 'Histórico' },
  { value: '/scanner', label: 'Scanner' },
  { value: '/de-para', label: 'De-Para' },
  { value: '/configuracoes', label: 'Configurações' },
  { value: '/alertas', label: 'Alertas' }
];

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSave: (data: AnnouncementCreate) => Promise<void>;
  onCancel: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ announcement, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    message: announcement?.message || '',
    kind: announcement?.kind || 'info' as AnnouncementKind,
    active: announcement?.active ?? true,
    href: announcement?.href || '',
    link_label: announcement?.link_label || '',
    expires_at: announcement?.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 16) : '',
    targeting: {
      type: 'all' as 'all' | 'users' | 'roles' | 'routes',
      users: announcement?.target_users || [],
      roles: announcement?.target_roles || [],
      routes: announcement?.target_routes || []
    }
  });

  const [users, setUsers] = useState<Array<{id: string, name: string}>>([]);
  const [roles, setRoles] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);

  const announcementService = new AnnouncementService();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          announcementService.getUsers(),
          announcementService.getRoles()
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        console.error('Failed to load form data:', err);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: AnnouncementCreate = {
        message: formData.message,
        kind: formData.kind,
        active: formData.active,
        href: formData.href || undefined,
        link_label: formData.link_label || undefined,
        expires_at: formData.expires_at || undefined,
        target_users: formData.targeting.type === 'users' ? formData.targeting.users : undefined,
        target_roles: formData.targeting.type === 'roles' ? formData.targeting.roles : undefined,
        target_routes: formData.targeting.type === 'routes' ? formData.targeting.routes : undefined
      };

      await onSave(submitData);
      onCancel();
    } catch (err) {
      console.error('Failed to save announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagem */}
      <div className="space-y-2">
        <Label htmlFor="message">Mensagem do Anúncio *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Digite a mensagem do anúncio..."
          required
          rows={3}
        />
      </div>

      {/* Tipo e Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo do Anúncio</Label>
          <Select value={formData.kind} onValueChange={(value: AnnouncementKind) => 
            setFormData(prev => ({ ...prev, kind: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_KINDS.map(kind => (
                <SelectItem key={kind.value} value={kind.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${kind.color}`} />
                    {kind.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <span className="text-sm">{formData.active ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>
      </div>

      {/* Link (opcional) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="href">Link (opcional)</Label>
          <Input
            id="href"
            value={formData.href}
            onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
            placeholder="https://exemplo.com"
            type="url"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_label">Texto do Link</Label>
          <Input
            id="link_label"
            value={formData.link_label}
            onChange={(e) => setFormData(prev => ({ ...prev, link_label: e.target.value }))}
            placeholder="Saiba mais"
            disabled={!formData.href}
          />
        </div>
      </div>

      {/* Data de Expiração */}
      <div className="space-y-2">
        <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
        <Input
          id="expires_at"
          type="datetime-local"
          value={formData.expires_at}
          onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
        />
      </div>

      {/* Segmentação */}
      <div className="space-y-4">
        <Label>Segmentação do Anúncio</Label>
        <Tabs value={formData.targeting.type} onValueChange={(value: any) => 
          setFormData(prev => ({ ...prev, targeting: { ...prev.targeting, type: value } }))
        }>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              <Users className="w-4 h-4 mr-1" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-1" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="w-4 h-4 mr-1" />
              Cargos
            </TabsTrigger>
            <TabsTrigger value="routes">
              <Route className="w-4 h-4 mr-1" />
              Páginas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="text-sm text-muted-foreground">
            O anúncio será exibido para todos os usuários da organização.
          </TabsContent>

          <TabsContent value="users" className="space-y-2">
            <Label>Selecionar Usuários</Label>
            <ScrollArea className="h-32 border rounded p-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.targeting.users.includes(user.id)}
                    onChange={(e) => {
                      const users = e.target.checked
                        ? [...formData.targeting.users, user.id]
                        : formData.targeting.users.filter(id => id !== user.id);
                      setFormData(prev => ({ 
                        ...prev, 
                        targeting: { ...prev.targeting, users } 
                      }));
                    }}
                  />
                  <span className="text-sm">{user.name}</span>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="roles" className="space-y-2">
            <Label>Selecionar Cargos</Label>
            <ScrollArea className="h-32 border rounded p-2">
              {roles.map(role => (
                <div key={role.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.targeting.roles.includes(role.id)}
                    onChange={(e) => {
                      const roles = e.target.checked
                        ? [...formData.targeting.roles, role.id]
                        : formData.targeting.roles.filter(id => id !== role.id);
                      setFormData(prev => ({ 
                        ...prev, 
                        targeting: { ...prev.targeting, roles } 
                      }));
                    }}
                  />
                  <span className="text-sm">{role.name}</span>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="routes" className="space-y-2">
            <Label>Selecionar Páginas</Label>
            <ScrollArea className="h-32 border rounded p-2">
              {ROUTE_OPTIONS.map(route => (
                <div key={route.value} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.targeting.routes.includes(route.value)}
                    onChange={(e) => {
                      const routes = e.target.checked
                        ? [...formData.targeting.routes, route.value]
                        : formData.targeting.routes.filter(r => r !== route.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        targeting: { ...prev.targeting, routes } 
                      }));
                    }}
                  />
                  <span className="text-sm">{route.label}</span>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.message.trim()}>
          {loading ? 'Salvando...' : announcement ? 'Atualizar' : 'Criar'} Anúncio
        </Button>
      </div>
    </form>
  );
};

export const AnnouncementManager: React.FC = () => {
  const { announcements, loading, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.kind.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (data: AnnouncementCreate) => {
    if (editingAnnouncement) {
      await updateAnnouncement({ ...data, id: editingAnnouncement.id });
    } else {
      await createAnnouncement(data);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAnnouncement(undefined);
  };

  const getTargetingInfo = (announcement: Announcement) => {
    const segments = [];
    if (announcement.target_users?.length) segments.push(`${announcement.target_users.length} usuário(s)`);
    if (announcement.target_roles?.length) segments.push(`${announcement.target_roles.length} cargo(s)`);
    if (announcement.target_routes?.length) segments.push(`${announcement.target_routes.length} página(s)`);
    return segments.length > 0 ? segments.join(', ') : 'Todos os usuários';
  };

  const getKindBadge = (kind: AnnouncementKind) => {
    const kindData = ANNOUNCEMENT_KINDS.find(k => k.value === kind);
    return (
      <Badge variant="secondary" className="gap-1">
        <div className={`w-2 h-2 rounded-full ${kindData?.color}`} />
        {kindData?.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Anúncios</h2>
            <p className="text-muted-foreground">
              Crie avisos para equipe, por cargo/role, usuários específicos e páginas
            </p>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAnnouncement(undefined)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
              </DialogTitle>
            </DialogHeader>
            <AnnouncementForm
              announcement={editingAnnouncement}
              onSave={handleSave}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar anúncios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Announcements List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Carregando anúncios...</div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum anúncio encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro anúncio'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Anúncio
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map(announcement => (
            <Card key={announcement.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getKindBadge(announcement.kind)}
                      {announcement.active ? (
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
                      {announcement.expires_at && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="w-3 h-3" />
                          Expira {new Date(announcement.expires_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTargetingInfo(announcement)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
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
                          <AlertDialogTitle>Excluir Anúncio</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAnnouncement(announcement.id)}
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
                <p className="text-sm mb-3">{announcement.message}</p>
                {announcement.href && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <ExternalLink className="w-4 h-4" />
                    <a href={announcement.href} target="_blank" rel="noopener noreferrer">
                      {announcement.link_label || 'Link'}
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