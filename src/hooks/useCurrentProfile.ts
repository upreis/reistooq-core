import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  nome_completo: string;
  nome_exibicao: string;
  cargo?: string;
  departamento?: string;
  organizacao_id: string;
  avatar_url?: string;
  created_at: string;
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: profileError } = await supabase
          .rpc('get_profile_safe', { profile_id: user.id });

        if (profileError) {
          console.error('Erro ao carregar perfil:', profileError);
          setError(profileError.message);
          return;
        }

        if (data && data.length > 0) {
          setProfile(data[0] as UserProfile);
        } else {
          // Fallback para dados básicos do auth se não encontrar perfil
          setProfile({
            id: user.id,
            nome_completo: user.email || 'Usuário',
            nome_exibicao: user.email?.split('@')[0] || 'Usuário',
            organizacao_id: '',
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Erro inesperado ao carregar perfil:', err);
        setError('Erro inesperado ao carregar perfil');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    // Helpers para facilitar o uso
    displayName: profile?.nome_exibicao || profile?.nome_completo || user?.email || 'Usuário',
    fullName: profile?.nome_completo || user?.email || 'Usuário',
    initials: profile?.nome_exibicao?.charAt(0).toUpperCase() || 
              profile?.nome_completo?.charAt(0).toUpperCase() || 
              user?.email?.charAt(0).toUpperCase() || 'U'
  };
}