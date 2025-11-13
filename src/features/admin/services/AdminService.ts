// 🎯 Service para sistema completo de RBAC
// Gestão de roles, permissões, usuários e convites

import { supabase } from '@/integrations/supabase/client';
import { DETAILED_PERMISSIONS } from '@/config/detailed-permissions';
import type { 
  Role, 
  Permission, 
  UserProfile, 
  Invitation, 
  InvitationCreate,
  UserRoleAssignment,
  SystemAlert,
  AuditLog 
} from '../types/admin.types';

export class AdminService {
  private cache = new Map<string, any>();
  private cacheTime = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Clear cache on instantiation to ensure fresh data
    this.clearCache();
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // ==================== ROLES ====================

  async getRoles(): Promise<Role[]> {
    const cacheKey = 'roles';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permission_key,
          app_permissions (
            key,
            name,
            description
          )
        ),
        user_role_assignments!inner(count)
      `)
      .eq('organization_id', await this.getCurrentOrgId())
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    const roles = (data || []).map(role => ({
      ...role,
      permissions: role.role_permissions?.map((rp: any) => ({
        ...rp.app_permissions,
        category: this.getCategoryFromKey(rp.app_permissions.key)
      })) || [],
      user_count: role.user_role_assignments?.[0]?.count || 0
    })) as Role[];

    this.cache.set(cacheKey, { data: roles, timestamp: Date.now() });
    return roles;
  }

  private getCategoryFromKey(key: string): string {
    const categoryMap: Record<string, string> = {
      'dashboard:view': 'DASHBOARD',
      'pedidos:marketplace': 'VENDAS (OMS)',
      'oms:pedidos': 'VENDAS (OMS)',
      'oms:clientes': 'VENDAS (OMS)',
      'oms:configuracoes': 'VENDAS (OMS)',
      'oms:view': 'VENDAS (OMS)',
      'compras:view': 'COMPRAS',
      'estoque:view': 'ESTOQUE',
      'estoque:compositions': 'ESTOQUE',
      'ecommerce:view': 'ECOMMERCE',
      'configuracoes:view': 'CONFIGURAÇÕES',
      'admin:access': 'ADMINISTRAÇÃO',
      'users:read': 'ADMINISTRAÇÃO',
      'roles:manage': 'ADMINISTRAÇÃO',
      'invites:manage': 'ADMINISTRAÇÃO',
      'system:audit': 'ADMINISTRAÇÃO',
      'integrations:manage': 'ADMINISTRAÇÃO',
      'alerts:view': 'ADMINISTRAÇÃO',
      'calendar:view': 'APLICATIVOS',
      'notes:view': 'APLICATIVOS',
      'scanner:use': 'FERRAMENTAS',
      'depara:view': 'FERRAMENTAS',
      'orders:read': 'VENDAS (OMS)',
      'settings:view': 'CONFIGURAÇÕES',
      'historico:view': 'ADMINISTRAÇÃO',
      'demo:access': 'OUTROS'
    };
    return categoryMap[key] || 'OUTROS';
  }

  private async getCurrentOrgId(): Promise<string> {
    const { data, error } = await supabase.rpc('get_current_org_id');
    if (error || !data) {
      throw new Error('Could not get current organization ID');
    }
    return data;
  }

  async createRole(data: { name: string; permissions: string[] }): Promise<Role> {
    // Get current organization ID
    const orgId = await this.getCurrentOrgId();
    
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '_'),
        is_system: false,
        organization_id: orgId
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error creating role:', roleError);
      throw new Error(`Failed to create role: ${roleError.message}`);
    }

    // Assign permissions
    if (data.permissions.length > 0) {
      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(
          data.permissions.map(permission => ({
            role_id: role.id,
            permission_key: permission
          }))
        );

      if (permError) {
        console.error('Error assigning permissions:', permError);
        // Clean up created role
        await supabase.from('roles').delete().eq('id', role.id);
        throw new Error(`Failed to assign permissions: ${permError.message}`);
      }
    }

    this.clearCache();
    return role as Role;
  }

  async updateRole(id: string, data: { name?: string; permissions?: string[] }): Promise<Role> {
    // Update role basic info
    if (data.name) {
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: data.name,
          slug: data.name.toLowerCase().replace(/\s+/g, '_')
        })
        .eq('id', id);

      if (roleError) {
        console.error('Error updating role:', roleError);
        throw new Error(`Failed to update role: ${roleError.message}`);
      }
    }

    // Update permissions if provided
    if (data.permissions) {
      // Remove existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      // Add new permissions
      if (data.permissions.length > 0) {
        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(
            data.permissions.map(permission => ({
              role_id: id,
              permission_key: permission
            }))
          );

        if (permError) {
          console.error('Error updating permissions:', permError);
          throw new Error(`Failed to update permissions: ${permError.message}`);
        }
      }
    }

    this.clearCache();
    
    // Return updated role
    const { data: updatedRole, error } = await supabase
      .from('roles')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch updated role: ${error.message}`);
    }

    return updatedRole as Role;
  }

  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting role:', error);
      throw new Error(`Failed to delete role: ${error.message}`);
    }

    this.clearCache();
  }

  async cleanupDuplicateRoles(): Promise<{ cleaned: number; kept: number }> {
    // Get current organization ID
    const orgId = await this.getCurrentOrgId();
    
    // Get all roles to find duplicates (only from current org)
    const { data: allRoles, error } = await supabase
      .from('roles')
      .select('id, name, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching roles:', error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    // Group roles by name to find duplicates
    const roleGroups = new Map<string, any[]>();
    
    allRoles?.forEach(role => {
      if (!roleGroups.has(role.name)) {
        roleGroups.set(role.name, []);
      }
      roleGroups.get(role.name)?.push(role);
    });

    let totalCleaned = 0;
    let totalKept = 0;

    // Process each group to remove duplicates
    for (const [roleName, roles] of roleGroups) {
      if (roles.length > 1) {
        // Keep the oldest one (first in sorted array) and delete the rest
        const toKeep = roles[0];
        const toDelete = roles.slice(1);

        // Delete duplicate roles
        const { error: deleteError } = await supabase
          .from('roles')
          .delete()
          .in('id', toDelete.map(r => r.id));

        if (deleteError) {
          console.error(`Error deleting duplicate roles for ${roleName}:`, deleteError);
          continue; // Continue with next group
        }

        totalCleaned += toDelete.length;
        totalKept += 1;
      } else if (roles.length === 1) {
        totalKept += 1;
      }
    }

    this.clearCache();
    return { cleaned: totalCleaned, kept: totalKept };
  }

  // ==================== PERMISSIONS ====================

  async getPermissions(): Promise<Permission[]> {
    const cacheKey = 'permissions';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('app_permissions')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching permissions:', error);
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    // Apply categories from detailed permissions config
    const categorizedPermissions = (data || []).map(permission => ({
      ...permission,
      category: this.getCategoryFromKey(permission.key)
    }));

    this.cache.set(cacheKey, { data: categorizedPermissions, timestamp: Date.now() });
    return categorizedPermissions as Permission[];
  }

  // ==================== USERS ====================

  async getUsers(): Promise<UserProfile[]> {
    // 1) Load basic profiles via secured RPC (includes masking as needed)
    const { data: profiles, error } = await supabase
      .rpc('admin_list_profiles', {
        _search: null,
        _limit: 100,
        _offset: 0
      })
      .order('nome_completo');

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const users = (profiles || []) as UserProfile[];

    // 2) Enrich with roles assigned in the current organization
    try {
      const orgId = await this.getCurrentOrgId();
      if (orgId) {
        const { data: assignments } = await supabase
          .from('user_role_assignments')
          .select(`
            user_id, 
            role:roles(
              id, name, slug, is_system, organization_id, created_at, updated_at, 
              role_permissions(
                permission_key,
                app_permissions(key, name, description)
              )
            )
          `)
          .eq('organization_id', orgId);

        if (assignments) {
          const rolesByUser = new Map<string, Role[]>();
          assignments.forEach((row: any) => {
            const arr = rolesByUser.get(row.user_id) ?? [];
            if (row.role) {
              const role = {
                ...row.role,
                permissions: row.role.role_permissions?.map((rp: any) => ({
                  ...rp.app_permissions,
                  category: this.getCategoryFromKey(rp.app_permissions.key)
                })) || []
              } as Role;
              arr.push(role);
            }
            rolesByUser.set(row.user_id, arr);
          });

          users.forEach(u => {
            u.roles = rolesByUser.get(u.id) ?? [];
          });
        }
      }
    } catch (e) {
      console.warn('Could not enrich users with roles:', e);
    }

    return users;
  }

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    // Remove roles from data since they can't be updated directly here
    const { roles, ...updateData } = data;
    
    const { data: updatedProfile, error } = await supabase
      .rpc('admin_update_profile', {
        p_user_id: id,
        p_updates: updateData
      })
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return updatedProfile as UserProfile;
  }

  async deleteUser(id: string): Promise<void> {
    // Admin users can delete profiles through service role backend only
    throw new Error('User deletions must be performed through secure backend operations');
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    // Get current organization ID
    const orgId = await this.getCurrentOrgId();
    
    // First, remove any existing role assignments for this user in this organization
    await supabase
      .from('user_role_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', orgId);
    
    // Then, insert the new role assignment
    const { error } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id: roleId,
        organization_id: orgId
      });

    if (error) {
      console.error('Error assigning role:', error);
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_role_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      console.error('Error removing role:', error);
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }

  // ==================== INVITATIONS ====================

  async getInvitations(): Promise<Invitation[]> {
    // First get the invitations
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('Error fetching invitations:', invError);
      throw new Error(`Failed to fetch invitations: ${invError.message}`);
    }

    if (!invitations || invitations.length === 0) {
      return [];
    }

    // Get the roles separately
    const roleIds = [...new Set(invitations.map(inv => inv.role_id))];
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('id, name, slug, is_system, organization_id, created_at, updated_at')
      .in('id', roleIds);

    if (roleError) {
      console.error('Error fetching roles:', roleError);
      throw new Error(`Failed to fetch roles: ${roleError.message}`);
    }

    // Map roles to invitations
    const roleMap = new Map(roles?.map(role => [role.id, role]) || []);
    
    const transformedData = invitations.map(invitation => ({
      ...invitation,
      role: roleMap.get(invitation.role_id) || null
    }));

    return transformedData as Invitation[];
  }

  async createInvitation(data: InvitationCreate): Promise<Invitation> {
    // Calculate days between now and expiration date
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Use the standard create_invitation function
    const { data: result, error } = await supabase
      .rpc('create_invitation', {
        _email: data.email,
        _role_id: data.role_id,
        _expires_in_days: Math.max(1, diffDays)
      });

    if (error) {
      console.error('Error creating invitation:', error);
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    // The result is the invitation object directly
    const invitationData = result;
    
    if (!invitationData || !invitationData.id) {
      throw new Error('Failed to create invitation');
    }

    // Get role data separately
    const { data: roleData } = await supabase
      .from('roles')
      .select('*')
      .eq('id', invitationData.role_id)
      .single();

    // Send invitation email automatically
    try {
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: { invitation_id: invitationData.id }
      });
      
      if (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't throw here - invitation was created successfully, just email failed
      }
    } catch (emailError) {
      console.error('Error calling send-invitation-email function:', emailError);
      // Don't throw here - invitation was created successfully, just email failed
    }

    return { ...invitationData, role: roleData } as Invitation;
  }

  async revokeInvitation(id: string): Promise<void> {
    const { error } = await supabase
      .rpc('revoke_invitation', { _id: id });

    if (error) {
      console.error('Error revoking invitation:', error);
      throw new Error(`Failed to revoke invitation: ${error.message}`);
    }
  }

  async deleteInvitation(id: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)
      .eq('organization_id', await this.getCurrentOrgId());

    if (error) {
      console.error('Error deleting invitation:', error);
      throw new Error(`Failed to delete invitation: ${error.message}`);
    }
  }

  // ==================== SYSTEM ALERTS ====================

  async getSystemAlerts(): Promise<SystemAlert[]> {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching system alerts:', error);
      throw new Error(`Failed to fetch system alerts: ${error.message}`);
    }

    return (data || []) as SystemAlert[];
  }

  async createSystemAlert(data: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>): Promise<SystemAlert> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    // Prepare the alert data with required fields
    const alertData = {
      ...data,
      created_by: user.id,
      organization_id: profile?.organizacao_id || null
    };

    const { data: alert, error } = await supabase
      .from('system_alerts')
      .insert(alertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating system alert:', error);
      throw new Error(`Failed to create system alert: ${error.message}`);
    }

    return alert as SystemAlert;
  }

  async updateSystemAlert(id: string, data: Partial<SystemAlert>): Promise<SystemAlert> {
    const { data: alert, error } = await supabase
      .from('system_alerts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating system alert:', error);
      throw new Error(`Failed to update system alert: ${error.message}`);
    }

    return alert as SystemAlert;
  }

  async deleteSystemAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting system alert:', error);
      throw new Error(`Failed to delete system alert: ${error.message}`);
    }
  }

  async dismissAlert(notificationId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('user_dismissed_notifications')
      .insert({
        notification_type: 'system_alert',
        notification_id: notificationId,
        user_id: userData.user?.id!
      });

    if (error) {
      console.error('Error dismissing alert:', error);
      throw new Error(`Failed to dismiss alert: ${error.message}`);
    }
  }

  // ==================== AUDIT LOGS ====================

  async getAuditLogs(filters: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditLog[]> {
    // This would require an audit logs table to be created
    // For now, return empty array
    console.warn('Audit logs not yet implemented - requires audit table creation');
    return [];
  }

  // ==================== CACHE MANAGEMENT ====================

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}