import { Order } from './OrderService';

export interface MLOrder {
  id: number;
  date_created: string;
  date_closed?: string;
  last_updated: string;
  status: string;
  status_detail?: string;
  currency_id: string;
  total_amount: number;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
    phone?: {
      area_code: string;
      number: string;
    };
  };
  seller: {
    id: number;
    nickname: string;
  };
  shipping?: {
    id: number;
    status: string;
    tracking_number?: string;
    tracking_method?: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
      variation_id?: number;
    };
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  payments?: Array<{
    id: number;
    status: string;
    transaction_amount: number;
    payment_method_id: string;
  }>;
}

/**
 * Maps MercadoLibre order status to internal status
 */
export function mapMLStatus(mlStatus: string): string {
  const statusMap: Record<string, string> = {
    // ML Status -> Internal Status
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento', 
    'payment_in_process': 'Processando Pagamento',
    'paid': 'Pago',
    'partially_paid': 'Parcialmente Pago',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'invalid': 'Inválido',
    'not_processed': 'Não Processado',
  };
  
  return statusMap[mlStatus] || 'Pendente';
}

/**
 * Maps MercadoLibre shipping status for internal use
 */
export function mapMLShippingStatus(shippingStatus?: string): string | null {
  if (!shippingStatus) return null;
  
  const shippingMap: Record<string, string> = {
    'pending': 'Preparando',
    'handling': 'Preparando',
    'ready_to_ship': 'Pronto para Envio',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'cancelled': 'Cancelado',
  };
  
  return shippingMap[shippingStatus] || shippingStatus;
}

/**
 * Calculates estimated shipping cost from ML order data
 */
export function calculateMLShippingCost(mlOrder: MLOrder): number {
  // ML orders may have shipping cost in different places
  // For now, we'll try to extract from payment data or return 0
  
  if (mlOrder.payments && mlOrder.payments.length > 0) {
    // Look for shipping fees in payment details
    // This is a simplified approach - real implementation might need to check
    // order.shipping.cost or other ML-specific fields
    return 0; // Placeholder
  }
  
  return 0;
}

/**
 * Calculates discount amount from ML order
 */
export function calculateMLDiscount(mlOrder: MLOrder): number {
  // Calculate discount based on difference between full_unit_price and unit_price
  let totalDiscount = 0;
  
  mlOrder.order_items.forEach(item => {
    const itemDiscount = (item.full_unit_price - item.unit_price) * item.quantity;
    totalDiscount += Math.max(0, itemDiscount); // Ensure non-negative
  });
  
  return totalDiscount;
}

/**
 * Main mapper function: converts MLOrder to our internal Order format
 */
export function mapMLOrderToOrder(mlOrder: MLOrder, integrationAccountId: string): Order {
  const now = new Date().toISOString();
  
  // Calculate derived values
  const shippingCost = calculateMLShippingCost(mlOrder);
  const discountAmount = calculateMLDiscount(mlOrder);
  
  // Build customer name with fallback
  const customerName = mlOrder.buyer.nickname || `Cliente ML ${mlOrder.buyer.id}`;
  
  // Build internal notes with ML-specific info
  const internalNotes = [
    `ML Order ID: ${mlOrder.id}`,
    `Buyer ID: ${mlOrder.buyer.id}`,
    `Currency: ${mlOrder.currency_id}`,
    mlOrder.status_detail ? `Status Detail: ${mlOrder.status_detail}` : null,
  ].filter(Boolean).join(' | ');
  
  return {
    id: `ml_${mlOrder.id}`,
    numero: `ML-${mlOrder.id}`,
    nome_cliente: customerName,
    cpf_cnpj: null, // ML doesn't provide CPF/CNPJ in basic order data
    data_pedido: mlOrder.date_created,
    data_prevista: mlOrder.date_closed || null,
    situacao: mapMLStatus(mlOrder.status),
    valor_total: mlOrder.total_amount,
    valor_frete: shippingCost,
    valor_desconto: discountAmount,
    numero_ecommerce: mlOrder.id.toString(),
    numero_venda: mlOrder.id.toString(),
    empresa: 'mercadolivre',
    cidade: null, // Would need additional API call to get full address
    uf: null, // Would need additional API call to get full address  
    codigo_rastreamento: mlOrder.shipping?.tracking_number || null,
    url_rastreamento: null, // ML doesn't provide direct tracking URLs in order data
    obs: mlOrder.status_detail || null,
    obs_interna: internalNotes,
    integration_account_id: integrationAccountId,
    created_at: mlOrder.date_created,
    updated_at: mlOrder.last_updated,
  };
}

/**
 * Maps multiple ML orders to internal format
 */
export function mapMLOrdersToOrders(
  mlOrders: MLOrder[], 
  integrationAccountId: string
): Order[] {
  return mlOrders.map(mlOrder => mapMLOrderToOrder(mlOrder, integrationAccountId));
}

/**
 * Creates a display-friendly order summary for ML orders
 */
export function createMLOrderSummary(mlOrder: MLOrder): string {
  const itemCount = mlOrder.order_items.length;
  const itemsText = itemCount === 1 ? '1 item' : `${itemCount} itens`;
  const firstItem = mlOrder.order_items[0];
  const itemName = firstItem ? firstItem.item.title : 'Item não identificado';
  
  return `${itemsText} - ${itemName}${itemCount > 1 ? ' e outros' : ''}`;
}

/**
 * Utility to check if an order ID belongs to MercadoLibre
 */
export function isMLOrderId(orderId: string): boolean {
  return orderId.startsWith('ml_') || orderId.startsWith('ML-');
}

/**
 * Extracts the original ML order ID from our internal ID format
 */
export function extractMLOrderId(internalId: string): string | null {
  if (internalId.startsWith('ml_')) {
    return internalId.substring(3);
  }
  if (internalId.startsWith('ML-')) {
    return internalId.substring(3);
  }
  return null;
}