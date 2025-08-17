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
   * Get organization profiles (secure RPC with proper data masking)
   */
  static async getOrganizationProfiles() {
    try {
      const { data, error } = await supabase.rpc('get_profiles_safe');

      if (error) throw error;
      // Sort by nome_completo like the original
      return data?.sort((a, b) => a.nome_completo?.localeCompare(b.nome_completo || '') || 0) || [];
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
   * Search organization profiles (secure RPC with proper data masking)
   */
  static async searchOrganizationProfiles(query: string) {
    try {
      const { data, error } = await supabase.rpc('get_profiles_safe');

      if (error) throw error;
      
      // Apply client-side search filtering
      const filteredData = data?.filter(profile => 
        profile.nome_completo?.toLowerCase().includes(query.toLowerCase()) ||
        profile.nome_exibicao?.toLowerCase().includes(query.toLowerCase()) ||
        profile.cargo?.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredData?.sort((a, b) => a.nome_completo?.localeCompare(b.nome_completo || '') || 0) || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }
}