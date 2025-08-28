import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadPermissions() {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: permError } = await supabase
          .rpc('get_user_permissions');

        if (permError) {
          console.error('Erro ao carregar permissões:', permError);
          setError(permError.message);
          setPermissions([]);
          return;
        }

        setPermissions(data || []);
      } catch (err) {
        console.error('Erro inesperado ao carregar permissões:', err);
        setError('Erro inesperado ao carregar permissões');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [user]);

  // Helper functions
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
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