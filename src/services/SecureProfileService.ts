import { supabase } from '@/integrations/supabase/client';

/**
 * Secure Profile Service
 * Uses only safe views and proper security boundaries
 */
export class SecureProfileService {
  /**
   * Get current user's profile (my own data - unmasked via RLS)
   */
  static async getMe() {
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
      console.error('Error fetching own profile:', error);
      throw error;
    }
  }

  /**
   * Get profile by ID (masked data via safe view)
   */
  static async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      throw error;
    }
  }

  /**
   * Get organization profiles (masked view for privacy)
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
   * Update display/personal data (own profile only)
   */
  static async updateDisplay(updates: Partial<{
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