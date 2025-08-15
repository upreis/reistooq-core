// Types específicas para UI do histórico
export interface HistoricoUIState {
  selectedRows: Set<string>;
  columnVisibility: Record<string, boolean>;
  viewMode: 'table' | 'cards' | 'analytics';
  density: 'compact' | 'normal' | 'comfortable';
  theme: 'light' | 'dark' | 'auto';
}

export interface HistoricoTableColumn {
  id: string;
  header: string;
  accessorKey: string;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  formatter?: (value: any, row: any) => React.ReactNode;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface HistoricoViewConfig {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  columns: HistoricoTableColumn[];
  filters: Record<string, any>;
  sorting: Array<{ id: string; desc: boolean }>;
  grouping?: string[];
}

export interface HistoricoSelection {
  selectedIds: Set<string>;
  selectAll: boolean;
  indeterminate: boolean;
  count: number;
}

export interface HistoricoLoadingState {
  data: boolean;
  export: boolean;
  bulk: boolean;
  analytics: boolean;
  filters: boolean;
}

export interface HistoricoError {
  type: 'network' | 'validation' | 'permission' | 'unknown';
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export interface HistoricoNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export interface HistoricoQuickFilter {
  id: string;
  label: string;
  icon?: string;
  filter: Record<string, any>;
  badge?: string | number;
  color?: string;
}

export interface HistoricoExportProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  total: number;
  filename?: string;
  downloadUrl?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface HistoricoSearchSuggestion {
  id: string;
  type: 'recent' | 'popular' | 'smart';
  text: string;
  description?: string;
  filters?: Record<string, any>;
  count?: number;
}

export interface HistoricoKeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  group: string;
  enabled: boolean;
}

export interface HistoricoUserPreferences {
  viewConfig: HistoricoViewConfig;
  quickFilters: HistoricoQuickFilter[];
  shortcuts: HistoricoKeyboardShortcut[];
  notifications: {
    enabled: boolean;
    types: string[];
    sound: boolean;
  };
  exportDefaults: {
    format: 'csv' | 'xlsx' | 'pdf';
    includeFilters: boolean;
    columns: string[];
  };
}