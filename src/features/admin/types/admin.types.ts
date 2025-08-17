// 🎯 Types para sistema completo de RBAC
// Roles, permissões, convites e gestão de usuários

export interface Role {
  id: string;
  name: string;
  slug: string;
  is_system: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  user_count?: number;
}

export interface Permission {
  key: string;
  name: string;
  description?: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string;
  created_at: string;
  user?: UserProfile;
  role?: Role;
}

export interface UserProfile {
  id: string;
  nome_completo?: string;
  nome_exibicao?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  avatar_url?: string;
  organizacao_id?: string;
  created_at: string;
  updated_at: string;
  roles?: Role[];
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked';
  role_id: string;
  organization_id: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  role?: Role;
  invited_by_user?: UserProfile;
}

export interface InvitationCreate {
  email: string;
  role_id: string;
  expires_in_days?: number;
}

export interface UserPermissionOverride {
  id: string;
  user_id: string;
  permission_key: string;
  allow: boolean;
  organization_id: string;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  message: string;
  kind: 'info' | 'warning' | 'error' | 'success';
  priority: number;
  active: boolean;
  href?: string;
  link_label?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDismissedNotification {
  id: string;
  user_id: string;
  notification_type: 'system_alert' | 'announcement';
  notification_id: string;
  dismissed_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Hook return types
export interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  createRole: (data: { name: string; permissions: string[] }) => Promise<void>;
  updateRole: (id: string, data: { name?: string; permissions?: string[] }) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  refreshRoles: () => Promise<void>;
}

export interface UseUsersReturn {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  updateUser: (id: string, data: Partial<UserProfile>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  removeRole: (userId: string, roleId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

export interface UseInvitationsReturn {
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  createInvitation: (data: InvitationCreate) => Promise<void>;
  revokeInvitation: (id: string) => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
  refreshInvitations: () => Promise<void>;
}

export interface UseSystemAlertsReturn {
  alerts: SystemAlert[];
  loading: boolean;
  error: string | null;
  createAlert: (data: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAlert: (id: string, data: Partial<SystemAlert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

export interface UseAuditLogsReturn {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  filters: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  };
  setFilters: (filters: any) => void;
  refreshLogs: () => Promise<void>;
}