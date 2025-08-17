// 🎯 Hook para gerenciamento de anúncios
// Estado centralizado com cache e validação

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementService } from '../services/AnnouncementService';
import type { 
  Announcement, 
  AnnouncementCreate, 
  AnnouncementUpdate, 
  AnnouncementFilters,
  UseAnnouncementsReturn 
} from '../types/announcements.types';

export const useAnnouncements = (filters?: AnnouncementFilters): UseAnnouncementsReturn => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoized service instance
  const announcementService = useMemo(() => new AnnouncementService(), []);

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await announcementService.getAnnouncements(filters);
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load announcements';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar anúncios",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [announcementService, filters, toast]);

  // Create announcement
  const createAnnouncement = useCallback(async (data: AnnouncementCreate) => {
    try {
      await announcementService.createAnnouncement(data);
      await loadAnnouncements(); // Refresh list
      toast({
        title: "Anúncio criado",
        description: "O anúncio foi criado com sucesso",
      });
    } catch (err) {
      console.error('Failed to create announcement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create announcement';
      toast({
        title: "Erro ao criar anúncio",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [announcementService, loadAnnouncements, toast]);

  // Update announcement
  const updateAnnouncement = useCallback(async (data: AnnouncementUpdate) => {
    try {
      await announcementService.updateAnnouncement(data);
      await loadAnnouncements(); // Refresh list
      toast({
        title: "Anúncio atualizado",
        description: "O anúncio foi atualizado com sucesso",
      });
    } catch (err) {
      console.error('Failed to update announcement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update announcement';
      toast({
        title: "Erro ao atualizar anúncio",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [announcementService, loadAnnouncements, toast]);

  // Delete announcement
  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      await announcementService.deleteAnnouncement(id);
      await loadAnnouncements(); // Refresh list
      toast({
        title: "Anúncio excluído",
        description: "O anúncio foi excluído com sucesso",
      });
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete announcement';
      toast({
        title: "Erro ao excluir anúncio",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [announcementService, loadAnnouncements, toast]);

  // Refresh announcements
  const refreshAnnouncements = useCallback(async () => {
    await loadAnnouncements();
  }, [loadAnnouncements]);

  // Load announcements on mount and filter changes
  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  return {
    announcements,
    loading,
    error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refreshAnnouncements
  };
};

// Hook para anúncios de uma rota específica
export const useRouteAnnouncements = (route: string) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const announcementService = useMemo(() => new AnnouncementService(), []);

  useEffect(() => {
    const loadRouteAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await announcementService.getActiveAnnouncementsForRoute(route);
        setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load route announcements:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRouteAnnouncements();
  }, [route, announcementService]);

  return { announcements, loading };
};