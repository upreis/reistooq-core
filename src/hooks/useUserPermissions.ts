import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('🔍 useUserPermissions - useEffect triggered:', { 
      user: !!user, 
      userEmail: user?.email,
      authLoading 
    });

    // Se ainda está carregando auth, aguardar
    if (authLoading) {
      console.log('🔍 useUserPermissions - Auth ainda carregando, aguardando...');
      return;
    }

    async function loadPermissions() {
      // Usuário não autenticado
      if (!user) {
        console.log('🔍 useUserPermissions - Usuário não autenticado');
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 useUserPermissions - Carregando permissões para:', user.email);
        setLoading(true);
        setError(null);

        const { data, error: permError } = await supabase
          .rpc('get_user_permissions');

        console.log('🔍 useUserPermissions - RPC response:', {
          data,
          error: permError,
          user: user?.email
        });

        if (permError) {
          console.error('❌ Erro ao carregar permissões:', permError);
          setError(permError.message);
          setPermissions([]);
          setLoading(false);
          return;
        }

        console.log('✅ Permissões carregadas:', data);
        setPermissions(data || []);
        setLoading(false);
      } catch (err) {
        console.error('❌ Erro inesperado ao carregar permissões:', err);
        setError('Erro inesperado ao carregar permissões');
        setPermissions([]);
        setLoading(false);
      }
    }

    loadPermissions();
  }, [user, authLoading]);

  // Helper functions
  const hasPermission = (permission: string): boolean => {
    // Administradores têm acesso total a tudo
    if (permissions.includes('admin:access')) {
      return true;
    }
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    // Administradores têm acesso total a tudo
    if (permissions.includes('admin:access')) {
      return true;
    }
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    // Administradores têm acesso total a tudo
    if (permissions.includes('admin:access')) {
      return true;
    }
    return perms.every(perm => permissions.includes(perm));
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}