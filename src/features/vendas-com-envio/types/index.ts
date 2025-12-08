/**
 * 📦 VENDAS COM ENVIO - Types
 * Tipos TypeScript para a feature de vendas com envio pendente
 */

// Status de envio possíveis
export type ShippingStatus = 
  | 'ready_to_ship'
  | 'pending'
  | 'handling'
  | 'shipped'
  | 'delivered'
  | 'not_delivered'
  | 'cancelled';

// Status de pagamento
export type PaymentStatus = 
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'rejected'
  | 'cancelled';

// Estrutura do item do pedido
export interface VendaItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  sku: string | null;
  variation_id: string | null;
  variation_attributes: Array<{
    name: string;
    value: string;
  }>;
}

// Estrutura do comprador
export interface VendaBuyer {
  id: number;
  nickname: string;
  first_name: string;
  last_name: string;
}

// Estrutura do endereço de envio
export interface VendaShippingAddress {
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

// Estrutura principal da venda com envio
export interface VendaComEnvio {
  id: string;
  order_id: string;
  integration_account_id: string;
  organization_id: string;
  account_name: string | null;
  
  // Status
  order_status: string;
  shipping_status: ShippingStatus;
  payment_status: PaymentStatus;
  
  // Datas
  date_created: string;
  date_closed: string | null;
  shipping_deadline: string | null;
  
  // Comprador
  buyer_id: number | null;
  buyer_nickname: string | null;
  buyer_name: string | null;
  
  // Valores
  total_amount: number;
  currency_id: string;
  
  // Envio
  shipment_id: string | null;
  logistic_type: string | null;
  tracking_number: string | null;
  carrier: string | null;
  
  // Itens
  items: VendaItem[];
  items_count: number;
  items_quantity: number;
  
  // Dados completos do ML
  order_data: Record<string, unknown>;
  
  // Metadados
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

// Status de análise para ativas/histórico
export type StatusAnaliseEnvio = 'pendente' | 'em_analise' | 'enviado' | 'entregue' | 'cancelado';

// Filtros disponíveis
export interface VendasComEnvioFilters {
  periodo: number;
  selectedAccounts: string[];
  shippingStatus: ShippingStatus | 'all';
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  activeTab: 'ativas' | 'historico';
}

// Estatísticas agregadas
export interface VendasComEnvioStats {
  total: number;
  readyToShip: number;
  pending: number;
  handling: number;
  shipped: number;
  totalValue: number;
}

// Estado do cache
export interface VendasComEnvioCacheEntry {
  data: VendaComEnvio[];
  filters: VendasComEnvioFilters;
  timestamp: number;
  totalCount: number;
}

// Resposta da API
export interface VendasComEnvioApiResponse {
  orders: VendaComEnvio[];
  total: number;
  page: number;
  limit: number;
}
