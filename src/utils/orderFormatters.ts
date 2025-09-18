/**
 * 🔧 FORMATADORES UNIFICADOS DE PEDIDOS
 * Consolida todas as funções de formatação duplicadas em um local central
 */

// ✅ FORMATAÇÃO BASE: Texto para português
export function formatPt(text: string | null | undefined): string {
  if (!text) return '-';
  return String(text)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// ✅ STATUS DE ENVIO: Mapeamento unificado
const SHIPPING_STATUS_MAP: Record<string, string> = {
  'ready_to_ship': 'Pronto para envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado',
  'pending': 'Pendente',
  'handling': 'Processando',
  'not_delivered': 'Não entregue',
  'returned': 'Devolvido',
  'returning_to_sender': 'Retornando',
  'out_for_delivery': 'Saiu para entrega',
  'receiver_absent': 'Destinatário ausente',
  'ready_to_print': 'Pronto para imprimir',
  'printed': 'Impresso',
  'preparing': 'Preparando',
  'to_be_agreed': 'A combinar'
};

// ✅ SUBSTATUS: Mapeamento detalhado
const SUBSTATUS_MAP: Record<string, string> = {
  'ready_to_print': 'Pronto p/ Imprimir',
  'printed': 'Impresso',
  'stale': 'Atrasado',
  'delayed': 'Atrasado',
  'receiver_absent': 'Destinatário Ausente',
  'returning_to_sender': 'Retornando',
  'out_for_delivery': 'Saiu p/ Entrega',
  'ready_to_ship': 'Pronto para Envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue'
};

// ✅ TIPOS LOGÍSTICOS: Mapeamento
const LOGISTIC_TYPE_MAP: Record<string, string> = {
  'drop_off': 'Drop Off',
  'custom': 'Personalizado', 
  'self_service': 'Auto Atendimento',
  'flex': 'Flex',
  'fulfillment': 'Fulfillment',
  'cross_docking': 'Cross Docking'
};

// ✅ MÉTODOS DE PAGAMENTO: Mapeamento
const PAYMENT_METHOD_MAP: Record<string, string> = {
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'pix': 'PIX',
  'bank_transfer': 'Transferência',
  'boleto': 'Boleto',
  'mercado_pago': 'Mercado Pago',
  'cash': 'Dinheiro'
};

/**
 * ✅ FORMATADOR PRINCIPAL: Status de envio
 */
export function formatShippingStatus(status: string | null | undefined): string {
  if (!status) return '-';
  const normalized = String(status).toLowerCase().replace(/_/g, '_');
  return SHIPPING_STATUS_MAP[normalized] || formatPt(status);
}

/**
 * ✅ FORMATADOR: Substatus detalhado
 */
export function formatSubstatus(substatus: string | null | undefined): string {
  if (!substatus) return '-';
  const normalized = String(substatus).toLowerCase().replace(/_/g, '_');
  return SUBSTATUS_MAP[normalized] || formatPt(substatus);
}

/**
 * ✅ FORMATADOR: Tipo logístico
 */
export function formatLogisticType(type: string | null | undefined): string {
  if (!type) return '-';
  const normalized = String(type).toLowerCase().replace(/_/g, '_');
  
  // Caso especial: self service = Flex
  if (normalized === 'self_service') return 'Flex';
  
  return LOGISTIC_TYPE_MAP[normalized] || formatPt(type);
}

/**
 * ✅ FORMATADOR: Método de pagamento
 */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return '-';
  const normalized = String(method).toLowerCase().replace(/_/g, '_');
  return PAYMENT_METHOD_MAP[normalized] || formatPt(method);
}

/**
 * ✅ FORMATADOR ESPECÍFICO POR PROVIDER
 */
export function formatOrderStatus(status: string | null | undefined, provider?: string): string {
  if (!status) return '-';
  
  // Lógica específica por marketplace
  switch (provider) {
    case 'mercadolivre':
      return formatMLStatus(status);
    case 'shopee':
      return formatShopeeStatus(status);
    default:
      return formatShippingStatus(status);
  }
}

/**
 * ✅ FORMATADOR: Mercado Livre específico
 */
function formatMLStatus(status: string): string {
  const mlStatusMap: Record<string, string> = {
    'paid': 'Pago',
    'confirmed': 'Confirmado',
    'ready_to_ship': 'Pronto para envio',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  };
  
  const normalized = String(status).toLowerCase();
  return mlStatusMap[normalized] || formatShippingStatus(status);
}

/**
 * ✅ FORMATADOR: Shopee específico (preparado para futuro)
 */
function formatShopeeStatus(status: string): string {
  const shopeeStatusMap: Record<string, string> = {
    'UNPAID': 'Não pago',
    'TO_SHIP': 'Para enviar',
    'SHIPPED': 'Enviado',
    'COMPLETED': 'Concluído',
    'CANCELLED': 'Cancelado'
  };
  
  const normalized = String(status).toUpperCase();
  return shopeeStatusMap[normalized] || formatShippingStatus(status);
}

/**
 * ✅ UTILITÁRIO: Combinar informações de envio
 */
export function formatCombinedShipping(order: any): string {
  const logisticMode = order.logistic_mode || order.shipping?.logistic?.mode;
  const logisticType = order.logistic_type || order.shipping?.logistic?.type;
  const deliveryType = order.delivery_type || order.shipping?.delivery_type;
  
  const parts = [];
  if (logisticMode) parts.push(`Modo: ${formatPt(logisticMode)}`);
  if (logisticType) parts.push(`Tipo: ${formatLogisticType(logisticType)}`);
  if (deliveryType) parts.push(`Entrega: ${formatPt(deliveryType)}`);
  
  return parts.length > 0 ? parts.join(' | ') : '-';
}

/**
 * ✅ UTILITÁRIO: Combinar método de envio
 */
export function formatCombinedShippingMethod(order: any): string {
  const shippingMethod = order.shipping_method || 
                        order.shipping?.shipping_method ||
                        order.raw?.shipping?.shipping_method;
  
  if (!shippingMethod) return '-';
  
  if (typeof shippingMethod === 'string') {
    return formatPt(shippingMethod);
  }
  
  const parts = [];
  if (shippingMethod.name) parts.push(`Nome: ${formatPt(shippingMethod.name)}`);
  if (shippingMethod.type) parts.push(`Tipo: ${formatPt(shippingMethod.type)}`);
  if (shippingMethod.id) parts.push(`ID: ${shippingMethod.id}`);
  
  return parts.length > 0 ? parts.join(' | ') : 'Método personalizado';
}