/**
 * 🏷️ TYPES - VENDAS CANCELADAS
 * Baseado nas APIs oficiais do Mercado Livre - TODAS AS PROPRIEDADES DISPONÍVEIS
 */

// ============= ORDERS =============
export interface MLOrder {
  // IDs
  id: number;
  pack_id: number | null;
  
  // Status
  status: string;
  status_detail: {
    code: string | null;
    description: string | null;
  } | string | null;
  
  // Datas
  date_created: string;
  date_closed: string | null;
  date_approved: string | null;
  last_updated: string;
  expiration_date: string | null;
  
  // Buyer
  buyer: {
    id: number;
    nickname: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: {
      area_code: string;
      number: string;
      extension?: string;
    };
    alternative_phone?: {
      area_code: string;
      number: string;
    };
    billing_info?: {
      doc_type: string;
      doc_number: string;
    };
  };
  
  // Items
  order_items: MLOrderItem[];
  
  // Totals
  total_amount: number;
  paid_amount: number;
  currency_id: string;
  shipping_cost?: number;
  coupon_amount?: number;
  coupon?: {
    id: number | null;
    amount: number;
  };
  marketplace_fee?: number;
  
  // Payments
  payments: MLPayment[];
  
  // Fulfillment
  fulfilled: boolean | null;
  mediations?: MLMediation[];
  
  // Status History
  status_history?: MLStatusHistory[];
  
  // Shipping - EXTENDIDO
  shipping?: {
    id: number;
    status?: string;
    substatus?: string;
    tracking_number?: string | null;
    tracking_method?: string | null;
    date_created?: string;
    last_updated?: string;
    logistic?: {
      mode?: string;
      type?: string;
    };
    destination?: {
      receiver_id?: number;
      receiver_name?: string;
      receiver_phone?: string;
      shipping_address?: {
        address_line?: string;
        street_name?: string;
        street_number?: string;
        zip_code?: string;
        city?: {
          id?: string;
          name?: string;
        };
        state?: {
          id?: string;
          name?: string;
        };
        country?: {
          id?: string;
          name?: string;
        };
        neighborhood?: {
          id?: string | null;
          name?: string | null;
        };
        comment?: string | null;
        delivery_preference?: string;
      };
    };
    lead_time?: {
      shipping_method?: {
        id?: number;
        name?: string;
        type?: string;
      };
      estimated_delivery_time?: {
        date?: string;
        type?: string;
      };
      estimated_delivery_limit?: {
        date?: string;
      };
      estimated_delivery_final?: {
        date?: string;
      };
      list_cost?: number;
      cost?: number;
    };
    shipping_option?: {
      list_cost?: number;
      dimensions?: string;
    };
    dimensions?: {
      width?: number;
      length?: number;
      height?: number;
      weight?: number;
    };
    costs?: {
      receiver?: {
        cost?: number;
      };
    };
    status_history?: MLStatusHistory[];
  };
  
  // Tags
  tags: string[];
  
  // Context
  context?: {
    channel: string;
    site: string;
    flow?: string;
  };
  
  // Feedback
  feedback?: {
    buyer: any | null;
    seller: any | null;
  };
  
  // Taxes
  taxes?: {
    amount: number | null;
    currency_id: string | null;
  };
  
  // Request
  order_request?: {
    return: any | null;
    change: any | null;
  };
  
  // Extra fields from unified-orders
  logistic_type?: string;
  shipping_substatus?: string;
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
    seller_custom_field?: string;
    category_id?: string;
    condition?: string;
    warranty?: string;
    thumbnail?: string;
    picture_url?: string;
  };
  quantity: number;
  requested_quantity?: {
    value: number;
    measure: string;
  };
  unit_price: number;
  full_unit_price: number;
  currency_id: string;
  manufacturing_days?: number | null;
  sale_fee?: number;
}

export interface MLPayment {
  id: number;
  order_id?: number;
  payer_id?: number;
  transaction_amount: number;
  currency_id: string;
  status: string;
  status_code?: string | null;
  status_detail: string | null;
  payment_method_id: string;
  payment_type: string;
  installments: number;
  installment_amount?: number | null;
  date_created: string;
  date_approved?: string | null;
  date_last_modified: string;
  transaction_amount_refunded?: number;
  coupon_amount?: number;
  marketplace_fee?: number;
  shipping_cost?: number;
  total_paid_amount?: number;
  overpaid_amount?: number;
  card_id?: number | null;
  issuer_id?: string;
  authorization_code?: string | null;
  transaction_order_id?: string | null;
  activation_uri?: string | null;
  operation_type?: string;
  available_actions?: string[];
  atm_transfer_reference?: {
    transaction_id: string | null;
    company_id: string | null;
  };
  collector?: {
    id: number;
  };
  reason?: string;
}

// ============= MEDIATIONS =============
export interface MLMediation {
  id: number;
  status: string;
  date_created: string;
  last_updated: string;
  reason?: string;
}

// ============= STATUS HISTORY =============
export interface MLStatusHistory {
  status: string;
  date_time: string;
  description?: string;
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
