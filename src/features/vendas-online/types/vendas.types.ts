/**
 * 🏷️ TYPES - VENDAS ONLINE
 * Baseado nas APIs oficiais do Mercado Livre
 */

// ============= ORDERS =============
export interface MLOrder {
  id: number;
  status: string;
  status_detail: string | null;
  date_created: string;
  date_closed: string | null;
  last_updated: string;
  
  // Pack
  pack_id: number | null;
  
  // Buyer
  buyer: {
    id: number;
    nickname: string;
    email?: string;
    phone?: {
      area_code: string;
      number: string;
    };
  };
  
  // Items
  order_items: MLOrderItem[];
  
  // Totals
  total_amount: number;
  paid_amount: number;
  currency_id: string;
  
  // Payments
  payments: MLPayment[];
  
  // Shipping
  shipping?: {
    id: number;
  };
  
  // Tags
  tags: string[];
  
  // Context
  context?: {
    channel: string;
    site: string;
  };
}

export interface MLOrderItem {
  item: {
    id: string;
    title: string;
    variation_id?: number;
    variation_attributes?: Array<{
      id: string;
      name: string;
      value_name: string;
    }>;
    seller_sku?: string;
  };
  quantity: number;
  unit_price: number;
  full_unit_price: number;
  currency_id: string;
}

export interface MLPayment {
  id: number;
  transaction_amount: number;
  currency_id: string;
  status: string;
  status_detail: string | null;
  payment_method_id: string;
  date_created: string;
  date_last_modified: string;
}

// ============= PACKS =============
export interface MLPack {
  id: number;
  status: string;
  orders: number[];
  tracking?: {
    tracking_number: string;
    carrier: string;
  };
  notes?: MLPackNote[];
}

export interface MLPackNote {
  id: number;
  note: string;
  date_created: string;
  created_by: {
    user_id: number;
    role: string;
  };
}

// ============= SHIPPING =============
export interface MLShipping {
  id: number;
  status: string;
  substatus: string | null;
  tracking_number: string | null;
  tracking_method: string | null;
  date_created: string;
  last_updated: string;
  
  receiver_address: {
    address_line: string;
    city: {
      name: string;
    };
    state: {
      name: string;
    };
    zip_code: string;
  };
  
  // Estimativas
  estimated_delivery_time?: {
    date: string;
    type: string;
  };
}

// ============= FEEDBACK =============
export interface MLFeedback {
  order_id: number;
  fulfilled: boolean;
  rating: 'positive' | 'negative' | 'neutral';
  message?: string;
}

// ============= FILTROS =============
export interface VendasFilters {
  search: string;
  status: string[];
  dateFrom: string | null;
  dateTo: string | null;
  integrationAccountId: string;
  hasPack: boolean | null;
  hasShipping: boolean | null;
  paymentStatus: string[];
}

// ============= PAGINATION =============
export interface VendasPagination {
  currentPage: number;
  itemsPerPage: number;
  total: number;
}

// ============= API RESPONSES =============
export interface FetchVendasResponse {
  orders: MLOrder[];
  packs: Record<number, MLPack>;
  shippings: Record<number, MLShipping>;
  total: number;
  pagination: VendasPagination;
}

// ============= EDGE FUNCTION ACTIONS =============
export type EdgeFunctionAction = 
  | 'fetch_orders'
  | 'fetch_pack'
  | 'update_shipping'
  | 'create_note'
  | 'create_feedback';

export interface EdgeFunctionRequest {
  action: EdgeFunctionAction;
  params: Record<string, any>;
}
