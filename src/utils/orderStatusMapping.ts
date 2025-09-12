/**
 * 🎯 MAPEAMENTOS DE STATUS - CORREÇÃO DA AUDITORIA
 * Mapeia status entre português (UI) e inglês (API ML)
 */

// Status do PEDIDO (order.status) - PT para EN para API ML
export const ORDER_STATUS_PT_TO_EN: Record<string, string> = {
  'Confirmado': 'confirmed',
  'Aguardando Pagamento': 'payment_required', 
  'Processando Pagamento': 'payment_in_process',
  'Pago': 'paid',
  'Enviado': 'shipped',
  'Entregue': 'delivered',
  'Cancelado': 'cancelled',
  'Inválido': 'invalid',
  'Pendente': 'payment_required', // Fallback para pending
  'Ativo': 'confirmed',
  'Concluído': 'delivered'
};

// Status do PEDIDO - EN para PT para exibição
export const ORDER_STATUS_EN_TO_PT: Record<string, string> = {
  'confirmed': 'Confirmado',
  'payment_required': 'Aguardando Pagamento',
  'payment_in_process': 'Processando Pagamento', 
  'paid': 'Pago',
  'shipped': 'Enviado',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado',
  'invalid': 'Inválido',
  'pending': 'Pendente',
  'active': 'Ativo',
  'partially_paid': 'Parcialmente Pago',
  'not_processed': 'Não Processado',
  'expired': 'Expirado',
  'paused': 'Pausado'
};

// Status de ENVIO (shipping.status) - PT para EN (APENAS CLIENT-SIDE)
export const SHIPPING_STATUS_PT_TO_EN: Record<string, string> = {
  'Pronto para Envio': 'ready_to_ship',
  'Enviado': 'shipped', 
  'Entregue': 'delivered',
  'Não Entregue': 'not_delivered',
  'Cancelado': 'cancelled',
  'A Combinar': 'to_be_agreed',
  'Pendente': 'pending',
  'Em Trânsito': 'shipped', // Fallback
  'Processando': 'ready_to_ship' // Fallback
};

// Status de ENVIO - EN para PT para exibição
export const SHIPPING_STATUS_EN_TO_PT: Record<string, string> = {
  'ready_to_ship': 'Pronto para Envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue', 
  'not_delivered': 'Não Entregue',
  'cancelled': 'Cancelado',
  'to_be_agreed': 'A Combinar',
  'pending': 'Pendente',
  'handling': 'Processando',
  'in_hub': 'Em Trânsito'
};

/**
 * Mapeia status do pedido de PT para EN para envio à API ML
 */
export function mapOrderStatusToAPI(ptStatus: string): string | undefined {
  return ORDER_STATUS_PT_TO_EN[ptStatus];
}

/**
 * Mapeia status do pedido de EN para PT para exibição
 */
export function mapOrderStatusFromAPI(enStatus: string): string {
  return ORDER_STATUS_EN_TO_PT[enStatus] || enStatus;
}

/**
 * Mapeia status de envio de PT para EN para filtro client-side
 */
export function mapShippingStatusToFilter(ptStatus: string): string | undefined {
  return SHIPPING_STATUS_PT_TO_EN[ptStatus];
}

/**
 * Mapeia status de envio de EN para PT para exibição
 */
export function mapShippingStatusFromAPI(enStatus: string): string {
  return SHIPPING_STATUS_EN_TO_PT[enStatus] || enStatus;
}

/**
 * Verifica se um pedido corresponde aos filtros de status de envio (client-side)
 */
export function matchesShippingStatusFilter(order: any, selectedStatuses: string[]): boolean {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  
  const orderShippingStatus = order?.shipping_status || 
                              order?.shipping?.status || 
                              order?.raw?.shipping?.status;
  
  if (!orderShippingStatus) return false;
  
  // Mapear filtros PT para EN e verificar match
  const filterStatusesEN = selectedStatuses
    .map(status => mapShippingStatusToFilter(status))
    .filter(Boolean);
  
  return filterStatusesEN.includes(orderShippingStatus);
}