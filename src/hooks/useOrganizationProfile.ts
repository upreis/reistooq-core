import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationProfile {
  id: string;
  nome: string;
  fantasia: string;
  slug: string;
  logo_url: string | null;
  admin_nome: string | null;
  admin_email: string | null;
  admin_celular: string | null;
}

export function useOrganizationProfile() {
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadOrgProfile() {
      if (!user) {
        setOrgProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: orgError } = await supabase
          .rpc('get_current_organization_data');

        if (orgError) {
          console.error('Erro ao carregar dados da organização:', orgError);
          setError(orgError.message);
          return;
        }

        if (data) {
          setOrgProfile(data as unknown as OrganizationProfile);
        }
      } catch (err) {
        console.error('Erro inesperado ao carregar organização:', err);
        setError('Erro inesperado ao carregar organização');
      } finally {
        setLoading(false);
      }
    }

    loadOrgProfile();
  }, [user]);

  // Helper para obter o login display (email ou fantasia.nome)
  const getLoginDisplay = (userEmail?: string | null) => {
    if (orgProfile?.slug && userEmail) {
      const username = userEmail.split('@')[0];
      return `${orgProfile.slug}.${username}`;
    }
    return userEmail || '';
  };

  return {
    orgProfile,
    loading,
    error,
    // Helpers
    ownerName: orgProfile?.admin_nome || 'Proprietário',
    ownerAvatar: orgProfile?.logo_url,
    companyName: orgProfile?.fantasia || orgProfile?.nome || '',
    slug: orgProfile?.slug || '',
    getLoginDisplay,
  };
}
