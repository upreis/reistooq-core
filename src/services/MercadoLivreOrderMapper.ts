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
 * Maps MercadoLibre order status to internal status (Portuguese)
 */
export function mapMLStatus(mlStatus: string): string {
  const statusMap: Record<string, string> = {
    // ML Order Status -> Portuguese Status
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
    'pending': 'Pendente',
    'active': 'Ativo',
    'completed': 'Concluído',
    'expired': 'Expirado',
    'paused': 'Pausado',
  };
  
  return statusMap[mlStatus?.toLowerCase()] || 'Pendente';
}

/**
 * Maps MercadoLibre shipping status for internal use (Complete Portuguese mapping)
 */
export function mapMLShippingStatus(shippingStatus?: string): string | null {
  if (!shippingStatus) return null;
  
  const shippingMap: Record<string, string> = {
    // Status principais
    'pending': 'Pendente',
    'handling': 'Preparando',
    'ready_to_ship': 'Pronto para Enviar',
    'shipped': 'A Caminho',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'cancelled': 'Cancelado',
    
    // Sub-status detalhados
    'in_transit': 'Em Trânsito',
    'out_for_delivery': 'Saiu para Entrega',
    'returning_to_sender': 'Retornando ao Remetente',
    'delivery_failed': 'Falha na Entrega',
    'receiver_absent': 'Destinatário Ausente',
    'damaged': 'Danificado',
    'lost': 'Perdido',
    'delayed': 'Atrasado',
    'picked_up': 'Coletado',
    'dropped_off': 'Despachado',
    'at_customs': 'Na Alfândega',
    'delayed_at_customs': 'Retido na Alfândega',
    'left_customs': 'Liberado da Alfândega',
    'refused_delivery': 'Recusou a Entrega',
    'waiting_for_withdrawal': 'Aguardando Retirada',
    'contact_with_carrier_required': 'Contato com Transportadora Necessário',
    'not_localized': 'Não Localizado',
    'forwarded_to_third': 'Encaminhado para Terceiros',
    'soon_deliver': 'Entrega em Breve',
    'bad_address': 'Endereço Incorreto',
    'changed_address': 'Endereço Alterado',
    'stale': 'Parado',
    'claimed_me': 'Reclamado pelo Comprador',
    'retained': 'Retido',
    'stolen': 'Roubado',
    'returned': 'Devolvido',
    'confiscated': 'Confiscado',
    'destroyed': 'Destruído',
    'in_storage': 'Em Depósito',
    'pending_recovery': 'Aguardando Recuperação',
    'agency_unavailable': 'Agência Indisponível',
    'rejected_damaged': 'Rejeitado por Danos',
    'refunded_by_delay': 'Reembolsado por Atraso',
    'shipment_stopped': 'Envio Parado',
    'awaiting_tax_documentation': 'Aguardando Documentação Fiscal',
  };
  
  return shippingMap[shippingStatus?.toLowerCase()] || shippingStatus;
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