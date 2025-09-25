// 🎯 Hooks para sistema completo de administração
// RBAC, usuários, convites, alertas e auditoria

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from '../services/AdminService';
import type {
  Role,
  Permission,
  UserProfile,
  Invitation,
  InvitationCreate,
  SystemAlert,
  AuditLog,
  UseRolesReturn,
  UseUsersReturn,
  UseInvitationsReturn,
  UseSystemAlertsReturn,
  UseAuditLogsReturn
} from '../types/admin.types';

// ==================== ROLES HOOK ====================

export const useRoles = (): UseRolesReturn => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const adminService = useMemo(() => new AdminService(), []);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getRoles();
      setRoles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load roles';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar cargos",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [adminService, toast]);

  const createRole = useCallback(async (data: { name: string; permissions: string[] }) => {
    try {
      await adminService.createRole(data);
      await loadRoles();
      toast({
        title: "Cargo criado",
        description: "O cargo foi criado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      toast({
        title: "Erro ao criar cargo",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadRoles, toast]);

  const updateRole = useCallback(async (id: string, data: { name?: string; permissions?: string[] }) => {
    try {
      await adminService.updateRole(id, data);
      await loadRoles();
      toast({
        title: "Cargo atualizado",
        description: "O cargo foi atualizado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      toast({
        title: "Erro ao atualizar cargo",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadRoles, toast]);

  const deleteRole = useCallback(async (id: string) => {
    try {
      await adminService.deleteRole(id);
      await loadRoles();
      toast({
        title: "Cargo excluído",
        description: "O cargo foi excluído com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      toast({
        title: "Erro ao excluir cargo",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadRoles, toast]);

  const cleanupDuplicates = useCallback(async () => {
    try {
      const result = await adminService.cleanupDuplicateRoles();
      await loadRoles();
      toast({
        title: "Duplicatas removidas",
        description: `${result.cleaned} cargos duplicados foram removidos. ${result.kept} cargos únicos mantidos.`,
        variant: "default"
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup duplicates';
      toast({
        title: "Erro ao limpar duplicatas",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadRoles, toast]);

  const refreshRoles = useCallback(async () => {
    await loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    cleanupDuplicates,
    refreshRoles
  };
};

// ==================== PERMISSIONS HOOK ====================

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const adminService = useMemo(() => new AdminService(), []);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const data = await adminService.getPermissions();
        setPermissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [adminService]);

  return { permissions, loading, error };
};

// ==================== USERS HOOK ====================

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const adminService = useMemo(() => new AdminService(), []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar usuários",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [adminService, toast]);

  const updateUser = useCallback(async (id: string, data: Partial<UserProfile>) => {
    try {
      await adminService.updateUser(id, data);
      await loadUsers();
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      toast({
        title: "Erro ao atualizar usuário",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadUsers, toast]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await adminService.deleteUser(id);
      await loadUsers();
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toast({
        title: "Erro ao excluir usuário",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadUsers, toast]);

  const assignRole = useCallback(async (userId: string, roleId: string) => {
    try {
      await adminService.assignRole(userId, roleId);
      await loadUsers();
      toast({
        title: "Cargo atribuído",
        description: "O cargo foi atribuído ao usuário com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      toast({
        title: "Erro ao atribuir cargo",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadUsers, toast]);

  const removeRole = useCallback(async (userId: string, roleId: string) => {
    try {
      await adminService.removeRole(userId, roleId);
      await loadUsers();
      toast({
        title: "Cargo removido",
        description: "O cargo foi removido do usuário com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      toast({
        title: "Erro ao remover cargo",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadUsers, toast]);

  const refreshUsers = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    updateUser,
    deleteUser,
    assignRole,
    removeRole,
    refreshUsers
  };
};

// ==================== INVITATIONS HOOK ====================

export const useInvitations = (): UseInvitationsReturn => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const adminService = useMemo(() => new AdminService(), []);

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getInvitations();
      setInvitations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar convites",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [adminService, toast]);

  const createInvitation = useCallback(async (data: InvitationCreate) => {
    try {
      await adminService.createInvitation(data);
      await loadInvitations();
      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${data.email}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invitation';
      toast({
        title: "Erro ao enviar convite",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadInvitations, toast]);

  const revokeInvitation = useCallback(async (id: string) => {
    try {
      await adminService.revokeInvitation(id);
      await loadInvitations();
      toast({
        title: "Convite revogado",
        description: "O convite foi revogado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke invitation';
      toast({
        title: "Erro ao revogar convite",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadInvitations, toast]);

  const resendInvitation = useCallback(async (id: string) => {
    try {
      // Call the edge function directly with the invitation ID
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: { invitation_id: id }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Convite reenviado",
        description: "O convite foi reenviado com sucesso",
        variant: "default"
      });
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      toast({
        title: "Erro ao reenviar convite",
        description: err.message || "Erro interno do servidor",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteInvitation = useCallback(async (id: string) => {
    try {
      await adminService.deleteInvitation(id);
      await loadInvitations();
      toast({
        title: "Convite removido",
        description: "O convite foi removido com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invitation';
      toast({
        title: "Erro ao remover convite",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [adminService, loadInvitations, toast]);

  const refreshInvitations = useCallback(async () => {
    await loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return {
    invitations,
    loading,
    error,
    createInvitation,
    revokeInvitation,
    resendInvitation,
    deleteInvitation,
    refreshInvitations
  };
};

// ==================== SYSTEM ALERTS HOOK ====================

export const useSystemAlerts = (): UseSystemAlertsReturn => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const adminService = useMemo(() => new AdminService(), []);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSystemAlerts();
      setAlerts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar alertas",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [adminService, toast]);

  const createAlert = useCallback(async (data: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await adminService.createSystemAlert(data);
      await loadAlerts();
      toast({
        title: "Alerta criado",
        description: "O alerta do sistema foi criado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create alert';
      toast({
        title: "Erro ao criar alerta",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadAlerts, toast]);

  const updateAlert = useCallback(async (id: string, data: Partial<SystemAlert>) => {
    try {
      await adminService.updateSystemAlert(id, data);
      await loadAlerts();
      toast({
        title: "Alerta atualizado",
        description: "O alerta foi atualizado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update alert';
      toast({
        title: "Erro ao atualizar alerta",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadAlerts, toast]);

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await adminService.deleteSystemAlert(id);
      await loadAlerts();
      toast({
        title: "Alerta excluído",
        description: "O alerta foi excluído com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete alert';
      toast({
        title: "Erro ao excluir alerta",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, loadAlerts, toast]);

  const dismissAlert = useCallback(async (id: string) => {
    try {
      await adminService.dismissAlert(id);
      toast({
        title: "Alerta dispensado",
        description: "Você não verá mais este alerta",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss alert';
      toast({
        title: "Erro ao dispensar alerta",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [adminService, toast]);

  const refreshAlerts = useCallback(async () => {
    await loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    dismissAlert,
    refreshAlerts
  };
};

// ==================== AUDIT LOGS HOOK ====================

export const useAuditLogs = (): UseAuditLogsReturn => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const { toast } = useToast();

  const adminService = useMemo(() => new AdminService(), []);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAuditLogs(filters);
      setLogs(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar logs",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [adminService, filters, toast]);

  const refreshLogs = useCallback(async () => {
    await loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    loading,
    error,
    filters,
    setFilters,
    refreshLogs
  };
};