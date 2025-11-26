/**
 * 🎯 TIPOS COMPARTILHADOS - COLUMN MANAGER UNIFICADO
 * Tipos genéricos para gerenciamento de colunas em todas as páginas
 */

// Definição de uma coluna
export interface ColumnDefinition {
  key: string;
  label: string;
  description?: string;
  default: boolean; // Se aparece por padrão
  priority?: 'essential' | 'standard' | 'optional';
  group?: string; // Grupo visual (ex: "Financeiro", "Rastreamento")
}

// Perfil de colunas (conjunto pré-definido)
export interface ColumnProfile {
  id: string;
  name: string;
  description?: string;
  columns: string[]; // Keys das colunas visíveis
  isDefault?: boolean;
}

// Estado do gerenciador de colunas
export interface ColumnState {
  visibleColumns: Set<string>; // Keys das colunas visíveis
  columnOrder: string[]; // Ordem das colunas
  activeProfile: string | null; // ID do perfil ativo
  customProfiles: ColumnProfile[]; // Perfis personalizados salvos
}

// Ações disponíveis
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

// Retorno do hook
export interface UseColumnManagerReturn<TDefinition extends ColumnDefinition = ColumnDefinition> {
  state: ColumnState;
  visibleColumnKeys: string[]; // Array de keys para passar à tabela
  actions: ColumnActions;
  definitions: TDefinition[];
  visibleDefinitions: TDefinition[];
  profiles: ColumnProfile[];
}

// Configuração para criar instância do hook
export interface ColumnManagerConfig<TDefinition extends ColumnDefinition = ColumnDefinition> {
  storageKey: string;
  storageVersion: number;
  columnDefinitions: TDefinition[];
  defaultProfiles: ColumnProfile[];
  featureName?: string; // Nome para logs (ex: "VENDAS", "RECLAMAÇÕES")
}
