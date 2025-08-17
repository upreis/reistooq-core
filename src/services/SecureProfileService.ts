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
        .rpc('get_my_profile')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching own profile:', error);
      throw error;
    }
  }

  /**
   * Get profile by ID (secure RPC with proper data masking)
   */
  static async getById(id: string) {
    try {
      const { data, error } = await supabase.rpc('get_profiles_safe');

      if (error) throw error;
      // Find the specific profile by ID
      const profile = data?.find(p => p.id === id);
      return profile || null;
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      throw error;
    }
  }

  /**
   * Get organization profiles (secure view with phone masking)
   */
  static async getOrganizationProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nome_completo');

      if (error) throw error;
      return data || [];
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
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.data.user.id)
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
   * Search organization profiles (secure view with filtering)
   */
  static async searchOrganizationProfiles(query: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`nome_completo.ilike.%${query}%,nome_exibicao.ilike.%${query}%,cargo.ilike.%${query}%`)
        .order('nome_completo');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }
}