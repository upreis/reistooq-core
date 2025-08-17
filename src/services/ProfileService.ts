import { supabase } from '@/integrations/supabase/client';

export class ProfileService {
  /**
   * Get current user profile (unmasked - owner can see their own data)
   */
  static async getCurrentProfile() {
    try {
      const { data, error } = await supabase
        .rpc('get_my_profile')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current profile:', error);
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
}