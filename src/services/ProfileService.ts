import { supabase } from '@/integrations/supabase/client';

export class ProfileService {
  /**
   * Get current user profile (unmasked - owner can see their own data)
   */
  static async getCurrentProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nome_completo,
          nome_exibicao,
          telefone,
          cargo,
          departamento,
          organizacao_id,
          avatar_url,
          created_at,
          updated_at,
          onboarding_banner_dismissed,
          configuracoes_notificacao
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current profile:', error);
      throw error;
    }
  }

  /**
   * Get organization profiles (secure RPC with proper data masking)
   */
  static async getOrganizationProfiles() {
    try {
      const { data, error } = await supabase.rpc('get_profiles_safe');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization profiles:', error);
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  static async updateProfile(updates: Partial<{
    nome_completo: string;
    nome_exibicao: string;
    telefone: string;
    cargo: string;
    departamento: string;
    avatar_url: string;
    configuracoes_notificacao: any;
  }>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}