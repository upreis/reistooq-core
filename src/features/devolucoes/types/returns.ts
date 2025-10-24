/**
 * 📦 TIPOS PARA RETURNS (DEVOLUÇÕES)
 * Baseado na documentação oficial da API do Mercado Livre
 */

export interface MLReturn {
  id: string;
  claim_id: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'expired';
  type: 'return_to_seller' | 'return_to_buyer';
  tracking_number?: string;
  carrier?: {
    id: string;
    name: string;
  };
  shipping_label?: {
    url: string;
    format: string;
  };
  date_created: string;
  last_updated: string;
  estimated_delivery_date?: string;
  return_address: {
    address_line: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  items: Array<{
    item_id: string;
    quantity: number;
    reason: string;
  }>;
  available_actions: Array<{
    action: string;
    mandatory: boolean;
    due_date?: string;
  }>;
}

export interface ClaimWithReturns {
  claim: any;
  returns: MLReturn[] | null;
  hasReturns: boolean;
}
