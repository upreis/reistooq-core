// 🎯 Gerenciador de Cargos e Permissões
// Interface completa para RBAC - Atualizado com estrutura granular por abas

import React, { useState } from 'react';
import { useRoles, usePermissions } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, Plus, Edit, Trash2, Users, Key, ChevronDown, ChevronRight } from 'lucide-react';
import type { Role, Permission } from '../types/admin.types';

interface RoleFormProps {
  role?: Role;
  permissions: Permission[];
  onSave: (data: { name: string; permissions: string[] }) => Promise<void>;
  onCancel: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ role, permissions, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    selectedPermissions: role?.permissions?.map(p => p.key) || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    try {
      await onSave({
        name: formData.name,
        permissions: formData.selectedPermissions
      });
      onCancel();
    } catch (err) {
      console.error('Failed to save role:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionKey)
        ? prev.selectedPermissions.filter(p => p !== permissionKey)
        : [...prev.selectedPermissions, permissionKey]
    }));
  };

  // Group permissions by their category from DETAILED_PERMISSIONS
  const groupedPermissions = React.useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.category || permission.key.split(':')[0].toUpperCase();
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(permission);
    });
    
    return grouped;
  }, [permissions]);

  // Sort categories by importance
  const categoryOrder = [
    'DASHBOARD',
    'VENDAS (OMS)', 
    'COMPRAS',
    'ESTOQUE',
    'ECOMMERCE',
    'CONFIGURAÇÕES',
    'ADMINISTRAÇÃO',
    'APLICATIVOS',
    'FERRAMENTAS'
  ];
  
  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    // Initialize all categories as collapsed
    const initialState: Record<string, boolean> = {};
    categoryOrder.forEach(category => {
      initialState[category] = false;
    });
    return initialState;
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryPermissions = (category: string): string[] => {
    const categoryData = groupedPermissions[category] || [];
    return categoryData.map(p => p.key);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Cargo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Administrador, Gerente, Operador..."
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Permissões</Label>
        <ScrollArea className="h-96 border rounded p-4">
          {sortedCategories.map(category => {
            const categoryData = groupedPermissions[category] || [];
            const categoryPermissions = getCategoryPermissions(category);
            const isExpanded = expandedCategories[category];
            
            if (categoryData.length === 0) return null;
            
            return (
              <div key={category} className="mb-6">
                <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <div className="flex items-center justify-between mb-3">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-medium text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {category}
                        <Badge variant="secondary" className="text-xs">
                          {categoryPermissions.length}
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const allSelected = categoryPermissions.every(p => formData.selectedPermissions.includes(p));
                          
                          if (allSelected) {
                            setFormData(prev => ({
                              ...prev,
                              selectedPermissions: prev.selectedPermissions.filter(p => !categoryPermissions.includes(p))
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              selectedPermissions: [...new Set([...prev.selectedPermissions, ...categoryPermissions])]
                            }));
                          }
                        }}
                      >
                        {categoryPermissions.every(p => formData.selectedPermissions.includes(p)) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </Button>
                    </div>
                  </div>
                  
                  <CollapsibleContent className="space-y-2">
                    {categoryData.map(permission => (
                      <div key={permission.key} className="flex items-start space-x-3 pl-6">
                        <Checkbox
                          checked={formData.selectedPermissions.includes(permission.key)}
                          onCheckedChange={() => togglePermission(permission.key)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium">{permission.name}</Label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                <Separator className="mt-4" />
              </div>
            );
          })}
        </ScrollArea>
        <p className="text-sm text-muted-foreground">
          {formData.selectedPermissions.length} permissões selecionadas
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.name.trim()}>
          {loading ? 'Salvando...' : role ? 'Atualizar' : 'Criar'} Cargo
        </Button>
      </div>
    </form>
  );
};

export const RoleManager: React.FC = () => {
  const { roles, loading, createRole, updateRole, deleteRole, cleanupDuplicates } = useRoles();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (data: { name: string; permissions: string[] }) => {
    if (editingRole) {
      await updateRole(editingRole.id, data);
    } else {
      await createRole(data);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRole(undefined);
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningDuplicates(true);
    try {
      await cleanupDuplicates();
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando cargos...</p>
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
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Cargos</h2>
            <p className="text-muted-foreground">
              Configure cargos e permissões baseados nos módulos reais do sistema: Dashboard, OMS, Compras, Estoque, Administração, etc.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isCleaningDuplicates}>
                {isCleaningDuplicates ? 'Limpando...' : 'Limpar Duplicatas'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar Cargos Duplicados</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover todos os cargos com nomes duplicados, mantendo apenas o mais antigo de cada grupo.
                  Esta operação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupDuplicates}>
                  Limpar Duplicatas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRole(undefined)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="role-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? 'Editar Cargo' : 'Criar Novo Cargo'}
                </DialogTitle>
              </DialogHeader>
              <div id="role-form-description" className="sr-only">
                Formulário para {editingRole ? 'editar um cargo existente' : 'criar um novo cargo'} com suas respectivas permissões
              </div>
              <RoleForm
                role={editingRole}
                permissions={permissions}
                onSave={handleSave}
                onCancel={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar cargos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Roles List */}
      <div className="grid gap-4">
        {filteredRoles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum cargo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro cargo'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Cargo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRoles.map(role => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      {role.is_system && (
                        <Badge variant="secondary">Sistema</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Key className="w-4 h-4" />
                        {role.permissions?.length || 0} permissões
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {role.user_count || 0} usuários
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(role)}
                      disabled={role.is_system}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!role.is_system && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Cargo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o cargo "{role.name}"? 
                              Esta ação não pode ser desfeita e afetará todos os usuários com este cargo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRole(role.id)}
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
              {role.permissions && role.permissions.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Permissões:</Label>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map(permission => (
                        <Badge key={permission.key} variant="outline" className="text-xs">
                          {permission.name}
                        </Badge>
                      ))}
                      {role.permissions.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 6} mais
                        </Badge>
                      )}
                    </div>
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