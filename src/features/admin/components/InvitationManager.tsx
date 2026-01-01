// 🎯 Gerenciador de Convites
// Sistema completo de convites por email com gestão de tokens

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInvitations, useRoles } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Plus, RotateCcw, X, CalendarIcon, Shield, User, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { InvitationCreate, Invitation } from '../types/admin.types';

interface InvitationFormProps {
  roles: any[];
  onSave: (data: InvitationCreate) => Promise<void>;
  onCancel: () => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ roles, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    role_id: '',
    expires_at: undefined as Date | undefined
  });
  const [loading, setLoading] = useState(false);
  const [orgFantasia, setOrgFantasia] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  // Buscar fantasia da organização
  React.useEffect(() => {
    const fetchOrgFantasia = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.rpc('get_current_organization_data');
      if (data && (data as any).fantasia) {
        setOrgFantasia((data as any).fantasia);
      }
    };
    fetchOrgFantasia();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.role_id || !formData.expires_at) return;
    
    setLoading(true);
    setError(null);
    try {
      const invitationData = {
        username: formData.username.toLowerCase().trim(),
        role_id: formData.role_id,
        expires_at: formData.expires_at.toISOString()
      };
      await onSave(invitationData);
      setFormData({ username: '', role_id: '', expires_at: undefined });
      onCancel();
    } catch (err) {
      console.error('Failed to create invitation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar convite';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Nome de Usuário *</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">{orgFantasia}.</span>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
            placeholder="nome_usuario"
            required
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          O login será: <strong>{orgFantasia}.{formData.username || 'nome_usuario'}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Cargo *</Label>
        <Select 
          value={formData.role_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar cargo..." />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {role.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expires_at">Data de Expiração *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.expires_at && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.expires_at ? (
                format(formData.expires_at, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.expires_at}
              onSelect={(date) => setFormData(prev => ({ ...prev, expires_at: date }))}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.username.trim() || !formData.role_id || !formData.expires_at}>
          {loading ? 'Criando...' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  );
};

export const InvitationManager: React.FC = () => {
  const { invitations, loading, createInvitation, revokeInvitation, resendInvitation, deleteInvitation } = useInvitations();
  const { roles } = useRoles();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredInvitations = invitations.filter(invitation =>
    (invitation.username || invitation.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (data: InvitationCreate) => {
    await createInvitation(data);
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copiado!",
      description: "O link do convite foi copiado para a área de transferência",
    });
  };

  const getStatusBadge = (invitation: Invitation) => {
    const isExpired = new Date(invitation.expires_at) < new Date();
    
    if (invitation.status === 'accepted') {
      return <Badge variant="default">Aceito</Badge>;
    }
    if (invitation.status === 'revoked') {
      return <Badge variant="destructive">Revogado</Badge>;
    }
    if (isExpired) {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getStatusColor = (invitation: Invitation) => {
    const isExpired = new Date(invitation.expires_at) < new Date();
    
    if (invitation.status === 'accepted') return 'text-green-600';
    if (invitation.status === 'revoked') return 'text-red-600';
    if (isExpired) return 'text-gray-500';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Gerenciar Convites</h2>
            <p className="text-muted-foreground text-sm">
              Convide novos usuários para sua organização
            </p>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2.5 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Novo Convite
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <InvitationForm
              roles={roles}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome de usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm h-7 text-xs"
        />
      </div>

      {/* Invitations List */}
      <div className="grid gap-4">
        {filteredInvitations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum convite encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece enviando seu primeiro convite'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInvitations.map(invitation => (
            <Card key={invitation.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {invitation.username ? (
                          <span className="font-mono">{invitation.email?.split('@')[0] || invitation.username}</span>
                        ) : (
                          invitation.email
                        )}
                      </CardTitle>
                      {getStatusBadge(invitation)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {invitation.role && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          {invitation.role.name}
                        </div>
                      )}
                       <div className="flex items-center gap-1">
                         <CalendarIcon className="w-4 h-4" />
                         Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                       </div>
                       <div className="flex items-center gap-1">
                         <User className="w-4 h-4" />
                         Criado em {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                       </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {invitation.status === 'pending' && new Date(invitation.expires_at) > new Date() && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitation(invitation.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </>
                     )}
                     {invitation.status === 'pending' && (
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm">
                             <X className="w-4 h-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Revogar Convite</AlertDialogTitle>
                             <AlertDialogDescription>
                               Tem certeza que deseja revogar o convite para "{invitation.email}"? 
                               Esta ação não pode ser desfeita e o link do convite ficará inválido.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => revokeInvitation(invitation.id)}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                               Revogar
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     )}
                     {(invitation.status === 'revoked' || invitation.status === 'accepted' || new Date(invitation.expires_at) < new Date()) && (
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm">
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Excluir Convite</AlertDialogTitle>
                             <AlertDialogDescription>
                               Tem certeza que deseja excluir permanentemente o convite para "{invitation.email}"? 
                               Esta ação não pode ser desfeita e removerá o convite do histórico.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => deleteInvitation(invitation.id)}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                               Excluir
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     )}
                  </div>
                </div>
              </CardHeader>
              {invitation.status === 'pending' && new Date(invitation.expires_at) > new Date() && (
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Link do convite:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono flex-1 truncate">
                      {`${window.location.origin}/convite/${invitation.token}`}
                    </code>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};