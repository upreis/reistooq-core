import { supabase } from '@/integrations/supabase/client';

/**
 * Secure Profile Service
 * Handles profile access with proper security boundaries
 */
export class SecureProfileService {
  /**
   * Get current user's profile (unmasked - owner sees their own data)
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
   * Get organization profiles (masked view for privacy)
   * Phone numbers are masked for other users
   */
  static async getOrganizationProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*')
        .order('nome_completo');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization profiles:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  static async updateCurrentProfile(updates: Partial<{
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

  /**
   * Search organization profiles (returns masked data)
   */
  static async searchOrganizationProfiles(query: string) {
    try {
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*')
        .or(`nome_completo.ilike.%${query}%,nome_exibicao.ilike.%${query}%,cargo.ilike.%${query}%`)
        .order('nome_completo');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }
}