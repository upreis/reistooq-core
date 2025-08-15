// Types para sistema de filtros avançado
export interface HistoricoFilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'range' | 'boolean';
  options?: Array<{ value: any; label: string; count?: number }>;
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  operators?: FilterOperator[];
  defaultOperator?: FilterOperator;
  group?: string;
  sortOptions?: boolean;
  searchable?: boolean;
}

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'regex';

export interface HistoricoFilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  secondValue?: any; // Para operadores como 'between'
  enabled: boolean;
}

export interface HistoricoFilterGroup {
  id: string;
  name: string;
  conditions: HistoricoFilterCondition[];
  logic: 'AND' | 'OR';
  enabled: boolean;
  nested?: HistoricoFilterGroup[];
}

export interface HistoricoFilterPreset {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  filters: HistoricoFilterGroup[];
  global: boolean;
  userId?: string;
  createdAt: Date;
  usageCount: number;
  lastUsed?: Date;
  tags?: string[];
}

export interface HistoricoFilterState {
  groups: HistoricoFilterGroup[];
  activePreset?: string;
  quickSearch: string;
  globalLogic: 'AND' | 'OR';
  enabled: boolean;
}

export interface HistoricoDatePreset {
  id: string;
  label: string;
  description?: string;
  getValue: () => { start: Date; end: Date };
  relative: boolean;
  popular: boolean;
}

export interface HistoricoFilterStatistics {
  field: string;
  totalRecords: number;
  uniqueValues: number;
  nullValues: number;
  distribution: Array<{
    value: any;
    count: number;
    percentage: number;
  }>;
  numericStats?: {
    min: number;
    max: number;
    avg: number;
    median: number;
    mode: number;
  };
  dateStats?: {
    earliest: Date;
    latest: Date;
    mostCommon: Date;
    gaps: Array<{ start: Date; end: Date }>;
  };
}

export interface HistoricoSmartFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
  confidence: number;
  autoApply: boolean;
  filters: HistoricoFilterGroup[];
  reasoning: string;
  dataPoints: string[];
  suggestedActions?: Array<{
    label: string;
    action: () => void;
    type: 'primary' | 'secondary';
  }>;
}

export interface HistoricoFilterAutoComplete {
  field: string;
  suggestions: Array<{
    value: any;
    label: string;
    count: number;
    recent: boolean;
    popular: boolean;
    contextual: boolean;
  }>;
  loading: boolean;
  error?: string;
}