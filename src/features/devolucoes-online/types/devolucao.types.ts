/**
 * 📦 TYPES - DEVOLUÇÕES MERCADO LIVRE
 * Tipos baseados na API de Returns do Mercado Livre
 */

export interface MLReturn {
  id: number;
  claim_id: number;
  order_id: number;
  status: ReturnStatus;
  status_money: StatusMoney;
  subtype: ReturnSubtype;
  shipment_status: string;
  tracking_number: string | null;
  shipment_destination: string | null;
  shipment_type: string | null;
  date_created: string;
  date_closed: string | null;
  refund_at: string | null;
  resource_id: number;
  resource_type: string;
  reason_id?: string | null;
  order: ReturnOrder | null;
  orders: ReturnOrderItem[];
  shipments: ReturnShipment[];
  related_entities: string[];
  intermediate_check: boolean;
  last_updated: string;
  
  // Campos do endereço de destino
  destination_address?: string | null;
  destination_city?: string | null;
  destination_state?: string | null;
  destination_zip?: string | null;
  destination_neighborhood?: string | null;
  destination_country?: string | null;
  destination_comment?: string | null;
  destination_street_name?: string | null;
  destination_street_number?: string | null;
  
  // ID do shipment
  shipment_id?: number | null;
  
  // Dados de revisão/review
  review_method?: string | null;
  review_stage?: string | null;
  review_status?: string | null;
  product_condition?: string | null;
  product_destination?: string | null;
  benefited?: string | null;
  seller_status?: string | null;
  
  // Dados de previsão de entrega (lead time)
  estimated_delivery_date?: string | null;
  estimated_delivery_from?: number | null;
  estimated_delivery_to?: number | null;
  estimated_delivery_limit?: string | null;
  has_delay?: boolean;
  
  // ✅ FASE 2: Quantidade da devolução (campos diretos para facilitar acesso)
  return_quantity?: number | null;
  total_quantity?: number | null;
  
  // ✅ FASE 1: Dados do comprador enriquecidos
  buyer_info?: BuyerInfo;
  
  // ✅ FASE 2: Dados do produto enriquecidos
  product_info?: ProductInfo;
  
  // ✅ FASE 3: Dados financeiros enriquecidos
  financial_info?: FinancialInfo;
  
  // ✅ FASE 5: Dados de tracking enriquecidos
  tracking_info?: ShipmentTracking;
  
  // ✅ FASE 6: Dados de revisão e qualidade
  review_info?: ReviewInfo;
  
  // ✅ FASE 7: Dados de comunicação e mensagens
  communication_info?: CommunicationInfo;
  
  // ✅ FASE 8: Prazos e Deadlines
  deadlines?: Deadlines;
  lead_time?: LeadTimeData;
}

// ✅ FASE 8: Lead Time Data
export interface LeadTimeData {
  estimated_delivery_time: {
    date: string;
    unit: 'hour' | 'day';
    shipping: number;
    handling: number;
    schedule?: {
      from: string;
      to: string;
    };
  };
  estimated_schedule_limit?: {
    date: string;
  };
  delivery_promise: 'estimated' | 'guaranteed';
  cost: number;
  currency_id: string;
}

// ✅ FASE 8: Deadlines
export interface Deadlines {
  shipment_deadline: string | null;
  seller_receive_deadline: string | null;
  seller_review_deadline: string | null;
  meli_decision_deadline: string | null;
  expiration_date: string | null;
  
  shipment_deadline_hours_left: number | null;
  seller_review_deadline_hours_left: number | null;
  is_shipment_deadline_critical: boolean;
  is_review_deadline_critical: boolean;
}

export interface ReturnStatus {
  id: string;
  description: string;
}

export interface StatusMoney {
  id: string;
  description: string;
}

export interface ReturnSubtype {
  id: string;
  description: string;
}

export interface ReturnShipment {
  id: number;
  shipment_id?: number;
  status: string;
  substatus?: string | null; // ✅ FASE 9: Substatus detalhado
  tracking_number: string | null;
  type?: string;
  destination?: ShipmentDestination;
}

export interface ShipmentDestination {
  name: string;
  shipping_address?: ShippingAddress;
}

export interface ShippingAddress {
  address_id: number;
  address_line: string;
  street_name: string;
  street_number: string;
  comment: string;
  zip_code: string;
  city: {
    id: string;
    name: string;
  };
  state: {
    id: string;
    name: string;
  };
  country: {
    id: string;
    name: string;
  };
  neighborhood: {
    id: string | null;
    name: string | null;
  };
  municipality: {
    id: string | null;
    name: string | null;
  };
}

export interface ReturnOrderItem {
  order_id: number;
  item_id: string;
  context_type: string; // 'total', 'partial', 'incomplete'
  total_quantity: string;
  return_quantity: string;
  variation_id: number | null;
}

export interface ReturnOrder {
  id: number;
  date_created: string;
  seller_id: number;
  buyer_id: number;
}

// ✅ FASE 1: Dados do Comprador
export interface BuyerInfo {
  id: number;
  nickname: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: {
    area_code?: string;
    number?: string;
    verified?: boolean;
  };
  permalink: string;
  registration_date?: string;
  country_id?: string;
  site_id?: string;
  buyer_reputation?: {
    tags?: string[];
    canceled_transactions?: number;
  };
}

// ✅ FASE 2: Dados do Produto
export interface ProductInfo {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string | null;
  permalink: string;
  sku: string | null;
  condition: string | null;
  available_quantity: number;
  sold_quantity: number;
}

// ✅ FASE 3: Dados Financeiros
export interface FinancialInfo {
  total_amount: number;
  paid_amount: number;
  currency_id: string;
  refund_amount: number;
  payment_status: string | null;
  payment_method: string | null;
  payment_type: string | null;
  shipping_cost: number;
}

// ✅ FASE 5: Dados de Tracking Enriquecidos
export interface ShipmentTracking {
  shipment_id: number;
  current_status: string;
  current_substatus?: string | null; // ✅ FASE 9: Substatus detalhado
  current_status_description: string;
  current_location?: string | null;
  estimated_delivery: string | null;
  tracking_number: string | null;
  carrier?: string | null;
  last_update: string;
  tracking_history: TrackingEvent[];
}

export interface TrackingEvent {
  date: string;
  status: string;
  description: string;
  location?: string | null;
  checkpoint?: string | null;
}

// ✅ FASE 6: Dados de Revisão e Qualidade
export interface ReviewInfo {
  has_review: boolean;
  review_method?: string | null;
  review_stage?: string | null;
  review_status?: string | null;
  product_condition?: string | null;
  product_destination?: string | null;
  benefited?: string | null;
  seller_status?: string | null;
  is_intermediate_check?: boolean;
  
  // ✅ FASE 10: Dados detalhados de Fullfilment Review
  seller_reason_id?: string | null;
  seller_reason_description?: string | null;
  seller_message?: string | null;
  seller_attachments?: ReviewAttachment[];
  missing_quantity?: number;
  damaged_quantity?: number;
  meli_resolution?: MeliResolution | null;
  seller_evaluation_status?: 'pending' | 'completed' | 'expired' | null;
  seller_evaluation_deadline?: string | null;
  available_reasons?: ReviewReason[];
}

// ✅ FASE 10: Attachment da revisão
export interface ReviewAttachment {
  id: string;
  url: string;
  type: string;
  filename?: string;
  description?: string;
}

// ✅ FASE 10: Razão de falha do vendedor
export interface ReviewReason {
  id: string; // ex: "SRF2", "SRF3"
  detail: string;
  name: string;
  category?: string;
}

// ✅ FASE 10: Resolução do MELI
export interface MeliResolution {
  date: string;
  reason?: string;
  final_benefited: 'buyer' | 'seller';
  comments?: string | null;
  decided_by?: string;
}

// ✅ FASE 7: Dados de comunicação e mensagens
export interface CommunicationInfo {
  total_messages: number;
  total_interactions: number;
  last_message_date?: string | null;
  last_message_sender?: string | null;
  communication_quality?: 'excellent' | 'good' | 'moderate' | 'poor' | null;
  moderation_status?: 'clean' | 'moderated' | 'rejected' | null;
  has_attachments: boolean;
  messages: ClaimMessage[];
}

export interface ClaimMessage {
  id: string;
  date: string;
  sender_role: 'buyer' | 'seller' | 'mediator';
  message: string;
  status?: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  url: string;
  type: string;
  filename?: string;
}

// Filtros
export interface DevolucaoFilters {
  search: string;
  status: string[];
  dateFrom: Date | string | null;
  dateTo: Date | string | null;
  integrationAccountId: string;
}

// Paginação
export interface DevolucaoPagination {
  currentPage: number;
  itemsPerPage: number;
  total: number;
}
