// 🎯 Types para sistema de anúncios/avisos
// Suporte a segmentação por usuários, cargos e páginas

export type AnnouncementKind = 'info' | 'warning' | 'success' | 'error' | 'promotion';

export interface Announcement {
  id: string;
  message: string;
  kind: AnnouncementKind;
  active: boolean;
  href?: string;
  link_label?: string;
  expires_at?: string;
  target_users?: string[];
  target_roles?: string[];
  target_routes?: string[];
  organization_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreate {
  message: string;
  kind: AnnouncementKind;
  active?: boolean;
  href?: string;
  link_label?: string;
  expires_at?: string;
  target_users?: string[];
  target_roles?: string[];
  target_routes?: string[];
}

export interface AnnouncementUpdate extends Partial<AnnouncementCreate> {
  id: string;
}

export interface AnnouncementFilters {
  kind?: AnnouncementKind;
  active?: boolean;
  search?: string;
  target_route?: string;
}

export interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  createAnnouncement: (data: AnnouncementCreate) => Promise<void>;
  updateAnnouncement: (data: AnnouncementUpdate) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  refreshAnnouncements: () => Promise<void>;
}

export interface AnnouncementTargeting {
  type: 'all' | 'users' | 'roles' | 'routes';
  users?: string[];
  roles?: string[];
  routes?: string[];
}

export interface AnnouncementFormData {
  message: string;
  kind: AnnouncementKind;
  active: boolean;
  href: string;
  link_label: string;
  expires_at: string;
  targeting: AnnouncementTargeting;
}