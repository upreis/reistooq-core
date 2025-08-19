export interface Order {
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
}

export type OrderStatus = 
  | 'Pago' 
  | 'Aprovado' 
  | 'Pendente' 
  | 'Aguardando' 
  | 'Enviado' 
  | 'Entregue' 
  | 'Cancelado' 
  | 'Devolvido' 
  | 'Reembolsado';

export type OrderSource = 'interno' | 'mercadolivre' | 'shopee' | 'tiny';

export interface OrderStats {
  today: number;
  pending: number;
  completed: number;
  cancelled: number;
  total?: number;
  revenue?: number;
}

export interface OrderFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  situacoes?: OrderStatus[];
  fonte?: OrderSource;
  limit?: number;
  offset?: number;
}

export interface OrderBulkAction {
  type: 'baixar_estoque' | 'cancelar_pedido' | 'marcar_enviado' | 'gerar_etiqueta';
  orderIds: string[];
}

export interface OrderSortOption {
  field: keyof Order | 'valor_liquido';
  direction: 'asc' | 'desc';
  label: string;
}

export interface OrderViewMode {
  type: 'table' | 'cards' | 'compact';
  itemsPerRow?: number;
}

export interface OrderExport {
  format: 'csv' | 'xlsx' | 'pdf';
  includeFields: (keyof Order)[];
  filters: OrderFilters;
}

export interface OrderRealtimeUpdate {
  type: 'insert' | 'update' | 'delete';
  order: Order;
  timestamp: string;
}