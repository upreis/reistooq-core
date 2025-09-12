import { OrderStatus, OrderSource, OrderPriority, OrderAdvanced } from './orders-advanced.types';
import { StatusFilters, OrderStatusCategory } from './orders-status.types';

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
  
  // ===== NOVOS FILTROS POR CATEGORIA =====
  status_filters: StatusFilters;
  enable_advanced_status: boolean;
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
    status_filters: {
      orderStatus: ['Aguardando Pagamento'],
      shippingStatus: [],
      shippingSubstatus: [],
      returnStatus: []
    }
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
    status_filters: {
      orderStatus: ['Pago'],
      shippingStatus: ['Pronto para Envio'],
      shippingSubstatus: [],
      returnStatus: []
    }
  },
  delivered: {
    status: ['Entregue'],
    status_filters: {
      orderStatus: [],
      shippingStatus: ['Entregue'],
      shippingSubstatus: [],
      returnStatus: []
    }
  },
  problems: {
    status: ['Cancelado', 'Devolvido', 'Reembolsado'],
    status_filters: {
      orderStatus: ['Cancelado'],
      shippingStatus: ['Não Entregue'],
      shippingSubstatus: ['Atrasado', 'Destinatário Ausente'],
      returnStatus: ['Devolvido', 'Reembolsado']
    }
  },
  // ===== NOVOS PRESETS AVANÇADOS =====
  delayed: {
    status_filters: {
      orderStatus: [],
      shippingStatus: [],
      shippingSubstatus: ['Atrasado'],
      returnStatus: []
    },
    enable_advanced_status: true
  },
  out_for_delivery: {
    status_filters: {
      orderStatus: [],
      shippingStatus: [],
      shippingSubstatus: ['Saiu para Entrega'],
      returnStatus: []
    },
    enable_advanced_status: true
  },
  returns: {
    status_filters: {
      orderStatus: [],
      shippingStatus: [],
      shippingSubstatus: [],
      returnStatus: ['Devolvido', 'Reembolsado', 'Devolução Pendente']
    },
    enable_advanced_status: true
  }
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
    id: 1,
    numero: 3,
    nome_cliente: 2,
    cpf_cnpj: 2,
    data_pedido: 1,
    data_prevista: 1,
    situacao: 1,
    valor_total: 1,
    valor_frete: 1,
    valor_desconto: 1,
    numero_ecommerce: 1,
    numero_venda: 1,
    empresa: 1,
    cidade: 1,
    uf: 1,
    codigo_rastreamento: 1,
    url_rastreamento: 1,
    obs: 1,
    obs_interna: 1,
    integration_account_id: 1,
    created_at: 1,
    updated_at: 1,
    priority: 1,
    tags: 1,
    last_status_change: 1,
    estimated_delivery: 1,
    profit_margin: 1,
  },
  fuzzy: true,
  highlight: true,
  suggestions: true,
};