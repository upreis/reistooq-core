/**
 * 🎯 SISTEMA UNIFICADO DE STATUS - ML API COMPLETA
 * Baseado na documentação oficial do Mercado Livre
 * Separação por categoria: Pedido, Envio, Substatus, Devoluções
 */

// ===== 1️⃣ STATUS DO PEDIDO (order.status) =====
export const ORDER_STATUS_PT_TO_EN: Record<string, string> = {
  'Confirmado': 'confirmed',
  'Aguardando Pagamento': 'payment_required', 
  'Processando Pagamento': 'payment_in_process',
  'Pago': 'paid',
  'Cancelado': 'cancelled',
  'Inválido': 'invalid',
  'Pendente': 'payment_required',
  'Ativo': 'confirmed',
  'Concluído': 'delivered',
  // Status mais específicos da API ML
  'Pausado': 'paused',
  'Expirado': 'expired',
  'Parcialmente Pago': 'partially_paid',
  'Não Processado': 'not_processed'
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

// ===== 2️⃣ STATUS DE ENVIO (shipping.status) =====
export const SHIPPING_STATUS_PT_TO_EN: Record<string, string> = {
  'Pendente': 'pending',
  'Preparando': 'handling', 
  'Pronto para Envio': 'ready_to_ship',
  'Enviado': 'shipped',
  'A Caminho': 'shipped',
  'Em Trânsito': 'shipped',
  'Entregue': 'delivered',
  'Não Entregue': 'not_delivered',
  'Cancelado': 'cancelled',
  'A Combinar': 'to_be_agreed'
};

// Status de ENVIO - EN para PT para exibição
export const SHIPPING_STATUS_EN_TO_PT: Record<string, string> = {
  'pending': 'Pendente',
  'handling': 'Preparando',
  'ready_to_ship': 'Pronto para Envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue', 
  'not_delivered': 'Não Entregue',
  'cancelled': 'Cancelado',
  'to_be_agreed': 'A Combinar',
  // Substatus que podem aparecer como status principal
  'in_hub': 'Em Trânsito',
  'out_for_delivery': 'Saiu para Entrega'
};

// ===== 3️⃣ SUBSTATUS DE ENVIO (shipping.substatus) =====
export const SHIPPING_SUBSTATUS_PT_TO_EN: Record<string, string> = {
  'Atrasado': 'delayed',
  'Saiu para Entrega': 'out_for_delivery',
  'Destinatário Ausente': 'receiver_absent',
  'Retornando ao Remetente': 'returning_to_sender',
  'Etiqueta Impressa': 'printed',
  'Em Trânsito': 'in_transit',
  'Aguardando Retirada': 'waiting_for_withdrawal',
  'Endereço Incorreto': 'bad_address',
  'Entrega Recusada': 'refused_delivery',
  'Área Perigosa': 'dangerous_area',
  'Reagendado pelo Comprador': 'buyer_rescheduled',
  'Na Alfândega': 'at_customs',
  'Liberado da Alfândega': 'left_customs'
};

export const SHIPPING_SUBSTATUS_EN_TO_PT: Record<string, string> = {
  'delayed': 'Atrasado',
  'out_for_delivery': 'Saiu para Entrega',
  'receiver_absent': 'Destinatário Ausente',
  'returning_to_sender': 'Retornando ao Remetente',
  'printed': 'Etiqueta Impressa',
  'in_transit': 'Em Trânsito',
  'waiting_for_withdrawal': 'Aguardando Retirada',
  'bad_address': 'Endereço Incorreto',
  'refused_delivery': 'Entrega Recusada',
  'dangerous_area': 'Área Perigosa',
  'buyer_rescheduled': 'Reagendado pelo Comprador',
  'at_customs': 'Na Alfândega',
  'left_customs': 'Liberado da Alfândega',
  'contact_with_carrier_required': 'Contato com Transportadora Necessário',
  'not_localized': 'Não Localizado',
  'delivery_failed': 'Falha na Entrega',
  'forwarded_to_third': 'Encaminhado para Terceiros',
  'soon_deliver': 'Entrega em Breve',
  'changed_address': 'Endereço Alterado',
  'retained': 'Retido',
  'delivery_blocked': 'Entrega Bloqueada',
  'at_the_door': 'Na Porta do Destinatário'
};

// ===== 4️⃣ STATUS DE DEVOLUÇÃO (returns.status) =====
export const RETURN_STATUS_PT_TO_EN: Record<string, string> = {
  'Devolução Pendente': 'pending',
  'Devolução Autorizada': 'authorized',
  'A ser Devolvido': 'to_be_returned',
  'Devolvido': 'returned',
  'Reembolsado': 'refunded',
  'Devolução Cancelada': 'cancelled'
};

export const RETURN_STATUS_EN_TO_PT: Record<string, string> = {
  'pending': 'Devolução Pendente',
  'authorized': 'Devolução Autorizada',
  'to_be_returned': 'A ser Devolvido',
  'returned': 'Devolvido',
  'refunded': 'Reembolsado',
  'cancelled': 'Devolução Cancelada'
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
 * ===== FUNÇÕES DE MAPEAMENTO POR CATEGORIA =====
 */

// STATUS DO PEDIDO
export function mapOrderStatusToFilter(ptStatus: string): string | undefined {
  return ORDER_STATUS_PT_TO_EN[ptStatus];
}

export function mapOrderStatusFromFilter(enStatus: string): string {
  return ORDER_STATUS_EN_TO_PT[enStatus] || enStatus;
}

// STATUS DE ENVIO
export function mapShippingStatusToFilter(ptStatus: string): string | undefined {
  return SHIPPING_STATUS_PT_TO_EN[ptStatus];
}

export function mapShippingStatusFromAPI(enStatus: string): string {
  return SHIPPING_STATUS_EN_TO_PT[enStatus] || enStatus;
}

// SUBSTATUS DE ENVIO
export function mapShippingSubstatusToFilter(ptStatus: string): string | undefined {
  return SHIPPING_SUBSTATUS_PT_TO_EN[ptStatus];
}

export function mapShippingSubstatusFromAPI(enStatus: string): string {
  return SHIPPING_SUBSTATUS_EN_TO_PT[enStatus] || enStatus;
}

// STATUS DE DEVOLUÇÃO
export function mapReturnStatusToFilter(ptStatus: string): string | undefined {
  return RETURN_STATUS_PT_TO_EN[ptStatus];
}

export function mapReturnStatusFromAPI(enStatus: string): string {
  return RETURN_STATUS_EN_TO_PT[enStatus] || enStatus;
}

/**
 * ===== FUNÇÕES DE VALIDAÇÃO E FILTROS =====
 */

// Filtro por STATUS DO PEDIDO
export function matchesOrderStatusFilter(order: any, selectedStatuses: string[]): boolean {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  
  const orderStatus = order?.order?.status || order?.situacao || order?.status;
  if (!orderStatus) return false;
  
  const filterStatusesEN = selectedStatuses
    .map(status => mapOrderStatusToFilter(status))
    .filter(Boolean);
  
  return filterStatusesEN.includes(orderStatus);
}

// Filtro por STATUS DE ENVIO
export function matchesShippingStatusFilter(order: any, selectedStatuses: string[]): boolean {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  
  const orderShippingStatus = order?.shipping?.status || 
                              order?.enriched?.shipping?.status ||
                              order?.raw?.shipping?.status;
  
  if (!orderShippingStatus) return false;
  
  const filterStatusesEN = selectedStatuses
    .map(status => mapShippingStatusToFilter(status))
    .filter(Boolean);
  
  return filterStatusesEN.includes(orderShippingStatus);
}

// Filtro por SUBSTATUS DE ENVIO
export function matchesShippingSubstatusFilter(order: any, selectedSubstatuses: string[]): boolean {
  if (!selectedSubstatuses || selectedSubstatuses.length === 0) return true;
  
  const orderSubstatus = order?.shipping?.substatus || 
                         order?.enriched?.shipping?.substatus ||
                         order?.raw?.shipping?.substatus;
  
  if (!orderSubstatus) return false;
  
  const filterSubstatusesEN = selectedSubstatuses
    .map(status => mapShippingSubstatusToFilter(status))
    .filter(Boolean);
  
  return filterSubstatusesEN.includes(orderSubstatus);
}

// Filtro por STATUS DE DEVOLUÇÃO
export function matchesReturnStatusFilter(order: any, selectedStatuses: string[]): boolean {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  
  const returnStatus = order?.enriched?.return?.status || 
                       order?.return?.status ||
                       order?.raw?.return?.status;
  
  if (!returnStatus) return selectedStatuses.includes('Sem Devolução');
  
  const filterStatusesEN = selectedStatuses
    .map(status => mapReturnStatusToFilter(status))
    .filter(Boolean);
  
  return filterStatusesEN.includes(returnStatus);
}

/**
 * ===== FUNÇÕES DE COMPATIBILIDADE (manter funcionamento atual) =====
 */

// Manter função original para não quebrar
export function matchesStatusFilter(order: any, selectedStatuses: string[]): boolean {
  // Tentar filtro por status de pedido primeiro
  if (matchesOrderStatusFilter(order, selectedStatuses)) return true;
  
  // Depois tentar filtro por status de envio
  if (matchesShippingStatusFilter(order, selectedStatuses)) return true;
  
  // Fallback para comportamento antigo
  return false;
}