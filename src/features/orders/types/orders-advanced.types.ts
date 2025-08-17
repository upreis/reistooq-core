// ===== ADVANCED ORDER TYPES =====
export interface OrderAdvanced {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  data_prevista: string | null;
  situacao: OrderStatus;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreamento: string | null;
  url_rastreamento: string | null;
  obs: string | null;
  obs_interna: string | null;
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
  // Enhanced fields
  priority: OrderPriority;
  tags: string[];
  last_status_change: string;
  estimated_delivery: string | null;
  profit_margin: number;
}

export type OrderStatus = 
  | 'Pendente'
  | 'Aguardando'
  | 'Pago'
  | 'Aprovado'
  | 'Enviado'
  | 'Entregue'
  | 'Cancelado'
  | 'Devolvido'
  | 'Reembolsado';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export type OrderSource = 'interno' | 'mercadolivre' | 'shopee' | 'tiny';

// ===== BULK OPERATIONS =====
export interface BulkOperation {
  id: string;
  type: BulkOperationType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export type BulkOperationType = 
  | 'baixar_estoque'
  | 'cancelar_pedidos'
  | 'update_status'
  | 'export_data'
  | 'send_notifications';

// ===== ANALYTICS =====
export interface OrderAnalytics {
  summary: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    growth_rate: number;
  };
  by_status: Record<OrderStatus, number>;
  by_source: Record<OrderSource, number>;
  by_period: {
    daily: Array<{ date: string; count: number; revenue: number }>;
    weekly: Array<{ week: string; count: number; revenue: number }>;
    monthly: Array<{ month: string; count: number; revenue: number }>;
  };
  trends: {
    revenue_trend: 'up' | 'down' | 'stable';
    volume_trend: 'up' | 'down' | 'stable';
    avg_value_trend: 'up' | 'down' | 'stable';
  };
}

// ===== WORKFLOW =====
export interface OrderWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: 'status_change' | 'time_based' | 'value_threshold' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface WorkflowAction {
  type: 'update_status' | 'send_email' | 'create_task' | 'update_inventory';
  config: Record<string, any>;
}

// ===== FILTER STATE =====
export interface OrderFiltersState {
  search: string;
  date_range: { start: string | null; end: string | null; preset: string | null };
  status: OrderStatus[];
  source: OrderSource[];
  priority: OrderPriority[];
  value_range: { min: number | null; max: number | null };
  location: { cities: string[]; states: string[] };
  tags: string[];
  custom_fields: Record<string, any>;
}

// ===== UI STATE =====
export interface OrdersUIState {
  view_mode: 'table' | 'cards' | 'analytics';
  selected_orders: string[];
  filters: OrderFiltersState;
  sorting: OrderSortState;
  pagination: OrderPaginationState;
  bulk_operation: BulkOperation | null;
}

export interface OrderSortState {
  field: keyof OrderAdvanced;
  direction: 'asc' | 'desc';
}

export interface OrderPaginationState {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}