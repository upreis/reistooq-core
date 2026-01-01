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

  // Verificar se o usuário atual é o proprietário (admin)
  const isOwner = user?.email && orgProfile?.admin_email 
    ? user.email.toLowerCase() === orgProfile.admin_email.toLowerCase()
    : false;

  // Helper para obter o login display baseado no tipo de usuário
  // Proprietário: mostra email real
  // Colaborador: mostra fantasia.nome
  const getLoginDisplay = (userEmail?: string | null) => {
    if (!userEmail) return '';
    
    // Se for o proprietário, mostra o email real
    if (isOwner) {
      return userEmail;
    }
    
    // Se for colaborador e tiver slug, mostra no formato fantasia.nome
    if (orgProfile?.slug) {
      const username = userEmail.split('@')[0];
      return `${orgProfile.slug}.${username}`;
    }
    
    return userEmail;
  };

  return {
    orgProfile,
    loading,
    error,
    // Helpers
    ownerName: orgProfile?.admin_nome || 'Proprietário',
    ownerAvatar: orgProfile?.logo_url,
    ownerEmail: orgProfile?.admin_email,
    companyName: orgProfile?.fantasia || orgProfile?.nome || '',
    slug: orgProfile?.slug || '',
    isOwner,
    getLoginDisplay,
  };
}
