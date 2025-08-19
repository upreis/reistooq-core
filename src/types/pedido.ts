// Interfaces para campos do Mercado Livre
export interface VariationAttribute {
  id: string;
  name: string;
  value_id: string;
  value_name: string;
}

export interface OrderItem {
  id: string;
  title: string;
  category_id: string;
  variation_id?: number;
  seller_custom_field?: string;
  variation_attributes: VariationAttribute[];
  warranty: string;
  condition: string;
  seller_sku?: string;
  global_price?: number;
  net_weight?: number;
}

export interface OrderItemDetails {
  item: OrderItem;
  quantity: number;
  requested_quantity: { value: number; measure: string };
  picked_quantity?: number;
  unit_price: number;
  full_unit_price: number;
  currency_id: string;
  manufacturing_days?: number;
  sale_fee: number;
  listing_type_id: string;
}

export interface Payment {
  id: number;
  order_id: number;
  payer_id: number;
  collector: { id: number };
  card_id?: string;
  site_id: string;
  reason: string;
  payment_method_id: string;
  currency_id: string;
  installments: number;
  issuer_id?: string;
  atm_transfer_reference: { company_id?: string; transaction_id?: string };
  coupon_id?: string;
  activation_uri?: string;
  operation_type: string;
  payment_type: string;
  available_actions: string[];
  status: string;
  status_code?: string;
  status_detail: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  taxes_amount: number;
  shipping_cost: number;
  coupon_amount: number;
  overpaid_amount: number;
  total_paid_amount: number;
  installment_amount?: number;
  deferred_period?: string;
  date_approved: string;
  authorization_code?: string;
  transaction_order_id?: string;
  date_created: string;
  date_last_modified: string;
}

export interface Coupon {
  id?: string;
  amount: number;
}

export interface Taxes {
  amount?: number;
  currency_id?: string;
  id?: string;
}

export interface Buyer {
  id: number;
}

export interface Seller {
  id: number;
}

export interface Shipping {
  id: number;
}

export interface Feedback {
  buyer?: any;
  seller?: any;
}

export interface Context {
  channel: string;
  site: string;
  flows: string[];
}

export interface OrderRequest {
  return?: any;
  change?: any;
}

export interface ItemPedido {
  sku: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface Pedido {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  obs: string | null;
  
  // Campos calculados/derivados
  id_unico?: string;  // SKU + numero
  itens?: ItemPedido[];
  
  // Status de mapeamento e estoque
  sku_estoque?: string | null;
  sku_kit?: string | null;
  qtd_kit?: number | null;
  total_itens?: number;
  status_estoque?: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado';
  
  // Campos mantidos para compatibilidade
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Campos específicos do Mercado Livre (novos)
  date_created?: string;
  date_closed?: string;
  last_updated?: string;
  manufacturing_ending_date?: string;
  comment?: string;
  pack_id?: number;
  pickup_id?: number;
  order_request?: OrderRequest;
  fulfilled?: any;
  mediations?: any[];
  paid_amount?: number;
  coupon?: Coupon;
  order_items?: OrderItemDetails[];
  currency_id?: string;
  payments?: Payment[];
  shipping?: Shipping;
  status_detail?: string;
  tags?: string[];
  feedback?: Feedback;
  context?: Context;
  buyer?: Buyer;
  seller?: Seller;
  taxes?: Taxes;
}

export interface PedidosResponse {
  data: Pedido[] | null;
  count: number | null;
  error: any;
}