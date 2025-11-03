/**
 * 📦 TYPES - DEVOLUÇÕES MERCADO LIVRE
 * Tipos baseados na API de Returns do Mercado Livre
 */

export interface MLReturn {
  id: number;
  claim_id: string;
  order_id: number;
  status: ReturnStatus;
  status_money: StatusMoney;
  subtype: ReturnSubtype;
  shipment_status: string;
  tracking_number: string | null;
  date_created: string;
  date_closed: string | null;
  refund_at: string | null;
  resource_id: string;
  resource: string;
  reason_id: string;
  order: ReturnOrder | null;
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
  status: string;
  tracking_number: string | null;
}

export interface ReturnOrder {
  id: number;
  date_created: string;
  seller_id: number;
  buyer_id: number;
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
