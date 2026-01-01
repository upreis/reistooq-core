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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Plus, RotateCcw, X, CalendarIcon, Shield, User, Copy, Trash2, Check, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { InvitationCreate, Invitation } from '../types/admin.types';

interface InvitationFormProps {
  roles: any[];
  onSave: (data: InvitationCreate) => Promise<{ login: string; password: string } | null>;
  onCancel: () => void;
}

interface CredentialsResult {
  login: string;
  password: string;
  email: string;
  roleName: string;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ roles, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role_id: '',
    expires_at: undefined as Date | undefined
  });
  const [loading, setLoading] = useState(false);
  const [orgFantasia, setOrgFantasia] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null);
  const { toast } = useToast();

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
    if (!formData.email.trim() || !formData.username.trim() || !formData.role_id || !formData.expires_at) return;
    
    setLoading(true);
    setError(null);
    try {
      const invitationData = {
        email: formData.email.toLowerCase().trim(),
        username: formData.username.toLowerCase().trim(),
        role_id: formData.role_id,
        expires_at: formData.expires_at.toISOString()
      };
      const result = await onSave(invitationData);
      
      if (result) {
        const selectedRole = roles.find(r => r.id === formData.role_id);
        setCredentials({
          login: result.login,
          password: result.password,
          email: formData.email,
          roleName: selectedRole?.name || 'Cargo'
        });
      }
    } catch (err) {
      console.error('Failed to create invitation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar convite';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const handleClose = () => {
    setFormData({ email: '', username: '', role_id: '', expires_at: undefined });
    setCredentials(null);
    setError(null);
    onCancel();
  };

  // Se temos credenciais, mostrar tela de sucesso
  if (credentials) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Usuário Criado com Sucesso!</h3>
          <p className="text-sm text-muted-foreground">
            Um email foi enviado para <strong>{credentials.email}</strong> com as credenciais de acesso.
          </p>
        </div>

        <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Login</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded border text-sm font-mono">
                {credentials.login}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials.login, 'Login')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Senha</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded border text-sm font-mono">
                {credentials.password}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials.password, 'Senha')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cargo</Label>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{credentials.roleName}</span>
            </div>
          </div>
        </div>

        <Alert>
          <Key className="w-4 h-4" />
          <AlertDescription>
            Guarde essas credenciais em um local seguro. A senha não poderá ser recuperada depois.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email para Enviar Convite *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="usuario@email.com"
            required
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          O convite com login e senha será enviado para este email
        </p>
      </div>

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
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !formData.email.trim() || !formData.username.trim() || !formData.role_id || !formData.expires_at}
        >
          {loading ? 'Criando...' : 'Criar Usuário e Enviar Convite'}
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

  const handleSave = async (data: InvitationCreate): Promise<{ login: string; password: string } | null> => {
    const result = await createInvitation(data);
    return result;
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
      // Verificar se o usuário já fez o primeiro login
      const hasLoggedIn = invitation.accepted_user_profile?.first_login_at;
      
      if (hasLoggedIn) {
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            Ativo
          </Badge>
        );
      }
      // Usuário criado mas ainda não fez login
      return (
        <Badge variant="secondary" className="bg-amber-600 hover:bg-amber-700 text-white">
          Aguardando Acesso
        </Badge>
      );
    }
    if (invitation.status === 'revoked') {
      return <Badge variant="destructive">Revogado</Badge>;
    }
    if (isExpired) {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
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
              <DialogDescription>
                Preencha os dados para criar um novo usuário e enviar o convite por email.
              </DialogDescription>
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
