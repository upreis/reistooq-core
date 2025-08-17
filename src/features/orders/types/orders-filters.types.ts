import { OrderStatus, OrderSource, OrderPriority, OrderAdvanced } from './orders-advanced.types';

// ===== FILTER SYSTEM TYPES =====
export interface OrderFiltersState {
  search: string;
  date_range: DateRange;
  status: OrderStatus[];
  source: OrderSource[];
  priority: OrderPriority[];
  value_range: ValueRange;
  location: LocationFilter;
  tags: string[];
  custom_fields: Record<string, any>;
}

export interface DateRange {
  start: string | null;
  end: string | null;
  preset: DatePreset | null;
}

export type DatePreset = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface ValueRange {
  min: number | null;
  max: number | null;
}

export interface LocationFilter {
  cities: string[];
  states: string[];
}

// ===== SAVED FILTERS =====
export interface SavedFilter {
  id: string;
  name: string;
  description: string;
  filters: OrderFiltersState;
  is_default: boolean;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

// ===== FILTER PRESETS =====
export const FILTER_PRESETS: Record<string, Partial<OrderFiltersState>> = {
  today: {
    date_range: { start: null, end: null, preset: 'today' },
  },
  pending: {
    status: ['Pendente', 'Aguardando'],
  },
  high_value: {
    value_range: { min: 1000, max: null },
  },
  urgent: {
    priority: ['urgent', 'high'],
  },
  this_week: {
    date_range: { start: null, end: null, preset: 'this_week' },
  },
  ready_to_ship: {
    status: ['Pago', 'Aprovado'],
  },
  delivered: {
    status: ['Entregue'],
  },
  problems: {
    status: ['Cancelado', 'Devolvido', 'Reembolsado'],
  },
};

// ===== FILTER VALIDATION =====
export interface FilterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ===== SEARCH CONFIGURATION =====
export interface SearchConfig {
  fields: (keyof OrderAdvanced)[];
  weights: Record<keyof OrderAdvanced, number>;
  fuzzy: boolean;
  highlight: boolean;
  suggestions: boolean;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  fields: ['numero', 'nome_cliente', 'cpf_cnpj', 'numero_ecommerce'],
  weights: {
    numero: 3,
    nome_cliente: 2,
    cpf_cnpj: 2,
    numero_ecommerce: 1,
  },
  fuzzy: true,
  highlight: true,
  suggestions: true,
};