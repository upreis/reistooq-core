// 🎯 Service para gerenciamento de anúncios
// CRUD completo com validação e cache

import { supabase } from '@/integrations/supabase/client';
import type { Announcement, AnnouncementCreate, AnnouncementUpdate, AnnouncementFilters } from '../types/announcements.types';

export class AnnouncementService {
  private cache = new Map<string, any>();
  private cacheTime = 5 * 60 * 1000; // 5 minutos

  async getAnnouncements(filters?: AnnouncementFilters): Promise<Announcement[]> {
    const cacheKey = `announcements_${JSON.stringify(filters || {})}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }

    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.kind) {
      query = query.eq('kind', filters.kind);
    }

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    if (filters?.search) {
      query = query.or(`message.ilike.%${filters.search}%,link_label.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching announcements:', error);
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }

    const announcements = (data || []) as Announcement[];
    
    // Cache result
    this.cache.set(cacheKey, {
      data: announcements,
      timestamp: Date.now()
    });

    return announcements;
  }

  async getActiveAnnouncementsForRoute(route: string): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .or(`target_routes.is.null,target_routes.cs.{${route}}`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching route announcements:', error);
      throw new Error(`Failed to fetch route announcements: ${error.message}`);
    }

    return (data || []) as Announcement[];
  }

  async createAnnouncement(data: AnnouncementCreate): Promise<Announcement> {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw new Error(`Failed to create announcement: ${error.message}`);
    }

    // Clear cache
    this.clearCache();

    return announcement as Announcement;
  }

  async updateAnnouncement(data: AnnouncementUpdate): Promise<Announcement> {
    const { id, ...updateData } = data;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      throw new Error(`Failed to update announcement: ${error.message}`);
    }

    // Clear cache
    this.clearCache();

    return announcement as Announcement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }

    // Clear cache
    this.clearCache();
  }

  async getUsers(): Promise<Array<{id: string, name: string, email: string}>> {
    const { data, error } = await supabase
      .from('profiles_safe')
      .select('id, nome_completo, nome_exibicao')
      .order('nome_completo');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []).map(user => ({
      id: user.id,
      name: user.nome_completo || user.nome_exibicao || 'Usuário',
      email: user.nome_exibicao || ''
    }));
  }

  async getRoles(): Promise<Array<{id: string, name: string, slug: string}>> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, slug')
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return data || [];
  }

  private clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}