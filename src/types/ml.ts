// ML types for orders/search payload
export interface MLOrderItem {
  item: {
    id: string;
    title?: string;
    seller_sku?: string;
    seller_custom_field?: string;
    variation_id?: string;
  };
  quantity: number;
  unit_price: number;
  full_unit_price?: number;
}

export interface MLBuyer {
  id: number;
  nickname?: string;
  billing_info?: {
    doc_number?: string;
  };
}

export interface MLSeller {
  id: number;
}

export interface MLShipping {
  id: number;
}

export interface MLPayment {
  shipping_cost?: number;
}

export interface MLCoupon {
  amount?: number;
}

// Updated ML types to include missing fields
export interface MLOrder {
  id: number;
  date_created?: string;
  date_closed?: string;
  last_updated?: string;
  status?: string;
  status_detail?: string;
  pack_id?: string;
  pickup_id?: string;
  manufacturing_ending_date?: string;
  comment?: string;
  tags?: string[];
  total_amount?: number;
  paid_amount?: number;
  currency_id?: string;
  buyer: MLBuyer;
  seller: MLSeller;
  shipping: MLShipping;
  order_items?: MLOrderItem[];
  payments?: MLPayment[];
  coupon?: MLCoupon;
}

// Helper functions
export const get = (obj: any, path: string): any =>
  path.split('.').reduce((acc, k) => (acc?.[k] ?? undefined), obj);

export const show = (v: any): string => (v ?? '—');