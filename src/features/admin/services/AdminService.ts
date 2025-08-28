// 🎯 Service para sistema completo de RBAC
// Gestão de roles, permissões, usuários e convites

import { supabase } from '@/integrations/supabase/client';
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
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    const roles = (data || []).map(role => ({
      ...role,
      permissions: role.role_permissions?.map((rp: any) => rp.app_permissions) || []
    })) as Role[];

    this.cache.set(cacheKey, { data: roles, timestamp: Date.now() });
    return roles;
  }

  async createRole(data: { name: string; permissions: string[] }): Promise<Role> {
    // Get current organization ID
    const { data: orgData } = await supabase.rpc('get_current_org_id');
    
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '_'),
        is_system: false,
        organization_id: orgData
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

    this.cache.set(cacheKey, { data: data || [], timestamp: Date.now() });
    return (data || []) as Permission[];
  }

  // ==================== USERS ====================

  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
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

    return (data || []) as UserProfile[];
  }

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    // Admin users can update profiles through service role backend only
    throw new Error('User updates must be performed through secure backend operations');
  }

  async deleteUser(id: string): Promise<void> {
    // Admin users can delete profiles through service role backend only
    throw new Error('User deletions must be performed through secure backend operations');
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    // Get current organization ID
    const { data: orgData } = await supabase.rpc('get_current_org_id');
    
    // First, remove any existing role assignments for this user in this organization
    await supabase
      .from('user_role_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', orgData);
    
    // Then, insert the new role assignment
    const { error } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id: roleId,
        organization_id: orgData
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
    // Calcular dias entre agora e a data de expiração
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const { data: invitation, error } = await supabase
      .rpc('create_invitation', {
        _email: data.email,
        _role_id: data.role_id,
        _expires_in_days: Math.max(1, diffDays) // Mínimo de 1 dia
      })
      .single() as { data: Invitation | null; error: any };

    if (error) {
      console.error('Error creating invitation:', error);
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    if (!invitation) {
      throw new Error('Failed to create invitation: no data returned');
    }

    // Send invitation email
    try {
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: { invitation_id: invitation.id }
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the entire operation if email sending fails
      }
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr);
      // Continue without failing - invitation was created successfully
    }

    return invitation as Invitation;
  }

  async revokeInvitation(id: string): Promise<void> {
    const { error } = await supabase
      .rpc('revoke_invitation', { _id: id });

    if (error) {
      console.error('Error revoking invitation:', error);
      throw new Error(`Failed to revoke invitation: ${error.message}`);
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
    const { data: alert, error } = await supabase
      .from('system_alerts')
      .insert(data)
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

  private clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}