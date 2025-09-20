// F4.4: Sistema aprimorado de permissões com fallbacks seguros
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

interface PermissionConfig {
  key: string;
  name: string;
  description: string;
  category: string;
  defaultValue: boolean;
}

// F4.4: Mapeamento de permissões com fallbacks
const PERMISSION_MAPPINGS: Record<string, PermissionConfig> = {
  // Clientes
  'customers:read': {
    key: 'customers:read',
    name: 'Visualizar Clientes',
    description: 'Permite visualizar dados dos clientes',
    category: 'customers',
    defaultValue: true
  },
  'customers:create': {
    key: 'customers:create',
    name: 'Criar Clientes',
    description: 'Permite criar novos clientes',
    category: 'customers',
    defaultValue: true
  },
  'customers:update': {
    key: 'customers:update',
    name: 'Editar Clientes',
    description: 'Permite editar dados dos clientes',
    category: 'customers',
    defaultValue: true
  },
  'customers:delete': {
    key: 'customers:delete',
    name: 'Excluir Clientes',
    description: 'Permite excluir clientes',
    category: 'customers',
    defaultValue: false
  },
  'customers:view_sensitive': {
    key: 'customers:view_sensitive',
    name: 'Dados Sensíveis',
    description: 'Permite ver dados sensíveis como CPF/CNPJ completo',
    category: 'customers',
    defaultValue: false
  },
  
  // Integrações
  'integrations:manage': {
    key: 'integrations:manage',
    name: 'Gerenciar Integrações',
    description: 'Permite configurar integrações com marketplaces',
    category: 'integrations',
    defaultValue: true
  },
  
  // Sistema
  'system:audit': {
    key: 'system:audit',
    name: 'Logs de Auditoria',
    description: 'Permite visualizar logs de auditoria do sistema',
    category: 'system',
    defaultValue: false
  },
  'system:announce': {
    key: 'system:announce',
    name: 'Gerenciar Anúncios',
    description: 'Permite criar e gerenciar anúncios do sistema',
    category: 'system',
    defaultValue: false
  },
  'system:manage_access': {
    key: 'system:manage_access',
    name: 'Gerenciar Acessos',
    description: 'Permite gerenciar horários e controles de acesso',
    category: 'system',
    defaultValue: false
  },
  'system:lgpd': {
    key: 'system:lgpd',
    name: 'LGPD/Privacidade',
    description: 'Permite gerenciar solicitações relacionadas à LGPD',
    category: 'system',
    defaultValue: false
  },
  
  // Configurações
  'settings:manage': {
    key: 'settings:manage',
    name: 'Gerenciar Configurações',
    description: 'Permite alterar configurações do sistema',
    category: 'settings',
    defaultValue: true
  },
  
  // Convites
  'invites:read': {
    key: 'invites:read',
    name: 'Visualizar Convites',
    description: 'Permite visualizar convites enviados',
    category: 'invites',
    defaultValue: true
  },
  'invites:manage': {
    key: 'invites:manage',
    name: 'Gerenciar Convites',
    description: 'Permite enviar e gerenciar convites',
    category: 'invites',
    defaultValue: false
  }
};

// F4.4: Cache de permissões para performance
let permissionsCache: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export class PermissionService {
  
  // Verificar se o cache é válido
  private static isCacheValid(): boolean {
    return permissionsCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  }
  
  // Limpar cache de permissões
  static clearCache(): void {
    permissionsCache = null;
    cacheTimestamp = 0;
  }
  
  // Obter permissões do usuário com cache
  static async getUserPermissions(): Promise<string[]> {
    try {
      // Retornar cache se válido
      if (this.isCacheValid() && permissionsCache) {
        return permissionsCache;
      }
      
      // Buscar permissões via função RPC
      const { data, error } = await supabase.rpc('get_user_permissions');
      
      if (error) {
        console.warn('[Permissions] Erro ao buscar permissões:', error.message);
        // Fallback: retornar permissões básicas
        return this.getBasicPermissions();
      }
      
      // Atualizar cache
      permissionsCache = data || [];
      cacheTimestamp = Date.now();
      
      return permissionsCache;
      
    } catch (error) {
      console.error('[Permissions] Exceção ao buscar permissões:', error);
      return this.getBasicPermissions();
    }
  }
  
  // Permissões básicas como fallback
  private static getBasicPermissions(): string[] {
    return Object.values(PERMISSION_MAPPINGS)
      .filter(perm => perm.defaultValue)
      .map(perm => perm.key);
  }
  
  // Verificar permissão específica
  static async hasPermission(permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions();
      return permissions.includes(permission);
    } catch (error) {
      console.error('[Permissions] Erro ao verificar permissão:', permission, error);
      
      // Fallback: verificar se é uma permissão básica
      const config = PERMISSION_MAPPINGS[permission];
      return config ? config.defaultValue : false;
    }
  }
  
  // Verificar múltiplas permissões
  static async hasAnyPermission(permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions();
      return permissions.some(perm => userPermissions.includes(perm));
    } catch (error) {
      console.error('[Permissions] Erro ao verificar múltiplas permissões:', error);
      
      // Fallback: verificar se alguma é permissão básica
      return permissions.some(perm => {
        const config = PERMISSION_MAPPINGS[perm];
        return config ? config.defaultValue : false;
      });
    }
  }
  
  // Verificar todas as permissões
  static async hasAllPermissions(permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions();
      return permissions.every(perm => userPermissions.includes(perm));
    } catch (error) {
      console.error('[Permissions] Erro ao verificar todas permissões:', error);
      
      // Fallback: verificar se todas são permissões básicas
      return permissions.every(perm => {
        const config = PERMISSION_MAPPINGS[perm];
        return config ? config.defaultValue : false;
      });
    }
  }
  
  // Listar permissões por categoria
  static getPermissionsByCategory(category: string): PermissionConfig[] {
    return Object.values(PERMISSION_MAPPINGS).filter(perm => perm.category === category);
  }
  
  // Obter informações de uma permissão
  static getPermissionInfo(permission: string): PermissionConfig | null {
    return PERMISSION_MAPPINGS[permission] || null;
  }
  
  // Verificar se usuário tem acesso a dados sensíveis
  static async canViewSensitiveData(): Promise<boolean> {
    return this.hasPermission('customers:view_sensitive');
  }
}

// F4.4: Hook para usar permissões de forma reativa
export function usePermissions() {
  
  const checkPermission = useCallback(async (permission: string): Promise<boolean> => {
    try {
      return await PermissionService.hasPermission(permission);
    } catch (error) {
      console.error('[usePermissions] Erro ao verificar permissão:', error);
      return false;
    }
  }, []);
  
  const checkAnyPermission = useCallback(async (permissions: string[]): Promise<boolean> => {
    try {
      return await PermissionService.hasAnyPermission(permissions);
    } catch (error) {
      console.error('[usePermissions] Erro ao verificar múltiplas permissões:', error);
      return false;
    }
  }, []);
  
  const checkAllPermissions = useCallback(async (permissions: string[]): Promise<boolean> => {
    try {
      return await PermissionService.hasAllPermissions(permissions);
    } catch (error) {
      console.error('[usePermissions] Erro ao verificar todas permissões:', error);
      return false;
    }
  }, []);
  
  const showAccessDeniedMessage = useCallback((action: string = 'esta ação') => {
    toast.error(`Você não tem permissão para ${action}. Entre em contato com o administrador.`);
  }, []);
  
  const getUserPermissions = useCallback(async (): Promise<string[]> => {
    try {
      return await PermissionService.getUserPermissions();
    } catch (error) {
      console.error('[usePermissions] Erro ao obter permissões:', error);
      return [];
    }
  }, []);
  
  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    showAccessDeniedMessage,
    getUserPermissions,
    clearCache: PermissionService.clearCache,
    getPermissionInfo: PermissionService.getPermissionInfo,
    getPermissionsByCategory: PermissionService.getPermissionsByCategory
  };
}

// F4.4: Componente para renderização condicional baseada em permissões
interface PermissionGateProps {
  permission: string | string[];
  mode?: 'any' | 'all';
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGate({ 
  permission, 
  mode = 'any', 
  fallback = null, 
  children,
  showAccessDenied = false 
}: PermissionGateProps) {
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const { checkPermission, checkAnyPermission, checkAllPermissions, showAccessDeniedMessage } = usePermissions();
  
  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        let result: boolean;
        
        if (Array.isArray(permission)) {
          result = mode === 'all' 
            ? await checkAllPermissions(permission)
            : await checkAnyPermission(permission);
        } else {
          result = await checkPermission(permission);
        }
        
        setHasAccess(result);
        
        if (!result && showAccessDenied) {
          showAccessDeniedMessage();
        }
      } catch (error) {
        console.error('[PermissionGate] Erro ao verificar permissões:', error);
        setHasAccess(false);
      }
    };
    
    checkAccess();
  }, [permission, mode, checkPermission, checkAnyPermission, checkAllPermissions, showAccessDenied, showAccessDeniedMessage]);
  
  // Loading state
  if (hasAccess === null) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  // Access granted
  if (hasAccess) {
    return React.createElement(React.Fragment, null, children);
  }
  
  // Access denied
  return React.createElement(React.Fragment, null, fallback);
}