/**
 * 🔧 TIPOS UNIFICADOS PARA SISTEMA DE COLUNAS - RECLAMAÇÕES
 * Mantém compatibilidade com arquitetura /pedidos
 */

export type ColumnCategory = 
  | 'basic' 
  | 'dates' 
  | 'customer' 
  | 'product' 
  | 'financial' 
  | 'resource' 
  | 'reason' 
  | 'resolution' 
  | 'meta' 
  | 'actions';

export type ColumnPriority = 'essential' | 'important' | 'optional';

export interface ColumnDefinition {
  key: string;
  label: string;
  category: ColumnCategory;
  priority: ColumnPriority;
  visible: boolean;
  default: boolean;
  description?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ColumnProfile {
  id: string;
  name: string;
  description: string;
  columns: string[]; // Array de keys das colunas
}

export interface ColumnState {
  visibleColumns: Set<string>;
  columnOrder: string[];
  activeProfile: string | null;
  customProfiles: ColumnProfile[];
}

export interface ColumnActions {
  toggleColumn: (key: string) => void;
  showColumn: (key: string) => void;
  hideColumn: (key: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  reorderColumns: (columnOrder: string[]) => void;
  loadProfile: (profileId: string) => void;
  saveProfile: (profile: Omit<ColumnProfile, 'id'>) => void;
  deleteProfile: (profileId: string) => void;
  resetToDefault: () => void;
  resetToEssentials: () => void;
}

export interface UseColumnManagerReturn {
  state: ColumnState;
  actions: ColumnActions;
  definitions: ColumnDefinition[];
  visibleDefinitions: ColumnDefinition[];
  profiles: ColumnProfile[];
}
