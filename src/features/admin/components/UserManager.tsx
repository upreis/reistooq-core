// 🎯 Gerenciador de Usuários
// Interface para administração de usuários da organização

import React, { useState } from 'react';
import { useUsers, useRoles } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Edit, Trash2, Shield, Mail, Phone, Calendar } from 'lucide-react';
import type { UserProfile, Role } from '../types/admin.types';

interface UserEditFormProps {
  user: UserProfile;
  roles: Role[];
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onAssignRole: (roleId: string) => Promise<void>;
  onCancel: () => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ user, roles, onSave, onAssignRole, onCancel }) => {
  const [formData, setFormData] = useState({
    nome_completo: user.nome_completo || '',
    nome_exibicao: user.nome_exibicao || '',
    telefone: user.telefone || '',
    cargo: user.cargo || '',
    departamento: user.departamento || ''
  });
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onCancel();
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    try {
      await onAssignRole(selectedRole);
      setSelectedRole('');
    } catch (err) {
      console.error('Failed to assign role:', err);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo</Label>
            <Input
              id="nome_completo"
              value={formData.nome_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
              placeholder="Nome completo do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_exibicao">Nome de Exibição</Label>
            <Input
              id="nome_exibicao"
              value={formData.nome_exibicao}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_exibicao: e.target.value }))}
              placeholder="Nome que aparecerá no sistema"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={formData.cargo}
              onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
              placeholder="Ex: Analista, Gerente..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Input
            id="departamento"
            value={formData.departamento}
            onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
            placeholder="Ex: TI, Vendas, Administrativo..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>

      {/* Role Assignment */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Atribuir Cargo</h4>
        <div className="flex gap-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="flex-1">
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
          <Button onClick={handleAssignRole} disabled={!selectedRole}>
            Atribuir
          </Button>
        </div>
        
        {/* Current Roles */}
        {user.roles && user.roles.length > 0 && (
          <div className="mt-4">
            <Label className="text-sm">Cargos atuais:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.roles.map(role => (
                <Badge key={role.id} variant="outline">
                  {role.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const UserManager: React.FC = () => {
  const { users, loading, updateUser, deleteUser, assignRole } = useUsers();
  const { roles } = useRoles();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nome_exibicao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditForm(true);
  };

  const handleCloseForm = () => {
    setShowEditForm(false);
    setEditingUser(null);
  };

  const handleSave = async (data: Partial<UserProfile>) => {
    if (!editingUser) return;
    await updateUser(editingUser.id, data);
  };

  const handleAssignRole = async (roleId: string) => {
    if (!editingUser) return;
    await assignRole(editingUser.id, roleId);
    // Find the role that was assigned
    const assignedRole = roles.find(r => r.id === roleId);
    if (assignedRole) {
      // Update the editing user state immediately to show the new role
      setEditingUser(prev => prev ? {
        ...prev,
        roles: [assignedRole] // Since assignRole removes existing and adds new
      } : null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
            <p className="text-muted-foreground">
              Administre os usuários da sua organização
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar usuários por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Users Grid */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar sua busca' : 'Ainda não há usuários na organização'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(user => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {getInitials(user.nome_completo || user.nome_exibicao)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {user.nome_completo || user.nome_exibicao || 'Usuário'}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                        )}
                        {user.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {user.telefone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
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
                          <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário "{user.nome_completo || user.nome_exibicao}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.id)}
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
                <div className="space-y-3">
                  {/* User Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {user.cargo && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Cargo</Label>
                        <p>{user.cargo}</p>
                      </div>
                    )}
                    {user.departamento && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Departamento</Label>
                        <p>{user.departamento}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Roles */}
                  {user.roles && user.roles.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Cargos no Sistema:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.map(role => (
                          <Badge key={role.id} variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <UserEditForm
              user={editingUser}
              roles={roles}
              onSave={handleSave}
              onAssignRole={handleAssignRole}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};