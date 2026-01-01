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
  // Regras:
  // - Proprietário pode entrar tanto com o email real (admin_email) quanto com o login curto (slug.adminUser)
  //   que vira email interno no formato: slug.adminUser@interno.local
  const normalize = (v?: string | null) => (v ?? '').trim().toLowerCase();

  const adminEmail = normalize(orgProfile?.admin_email);
  const userEmail = normalize(user?.email);

  const adminUser = adminEmail ? adminEmail.split('@')[0] : '';
  const ownerSyntheticEmail = orgProfile?.slug && adminUser
    ? `${normalize(orgProfile.slug)}.${adminUser}@interno.local`
    : '';

  const isOwner = !!userEmail && !!adminEmail
    ? userEmail === adminEmail || (ownerSyntheticEmail ? userEmail === ownerSyntheticEmail : false)
    : false;

  // Helper para obter o login display baseado no tipo de usuário
  // Proprietário: mostra email real
  // Colaborador: mostra fantasia.nome (sem @interno.local)
  const getLoginDisplay = (rawEmail?: string | null) => {
    if (!rawEmail) return '';

    // Se for o proprietário, sempre mostra o email real cadastrado (se existir)
    if (isOwner) {
      return orgProfile?.admin_email || rawEmail;
    }

    const lowered = rawEmail.toLowerCase();

    // Colaborador via login curto (interno)
    if (lowered.endsWith('@interno.local')) {
      return rawEmail.split('@')[0];
    }

    // Fallback: se não for email interno, mantém o valor (ou prefixa com slug quando fizer sentido)
    if (orgProfile?.slug && rawEmail.includes('@')) {
      const username = rawEmail.split('@')[0];
      return `${orgProfile.slug}.${username}`;
    }

    return rawEmail;
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
