/**
 * 🗂️ MAPEAMENTO DE STATUS ML
 * Mapeia status da API do Mercado Livre para labels PT-BR
 */

export const ML_ORDER_STATUS_MAP = {
  // Confirmados
  'confirmed': { label: 'Confirmado', color: 'blue' },
  'payment_required': { label: 'Aguardando Pagamento', color: 'yellow' },
  'payment_in_process': { label: 'Pagamento em Processo', color: 'yellow' },
  
  // Pagos
  'paid': { label: 'Pago', color: 'green' },
  
  // Cancelados
  'cancelled': { label: 'Cancelado', color: 'red' },
  
  // Outros
  'invalid': { label: 'Inválido', color: 'gray' },
} as const;

export const ML_SHIPPING_STATUS_MAP = {
  'pending': { label: 'Pendente', color: 'yellow' },
  'ready_to_ship': { label: 'Pronto para Envio', color: 'blue' },
  'shipped': { label: 'Enviado', color: 'purple' },
  'delivered': { label: 'Entregue', color: 'green' },
  'not_delivered': { label: 'Não Entregue', color: 'red' },
  'cancelled': { label: 'Cancelado', color: 'gray' },
} as const;

export const getOrderStatusLabel = (status: string) => {
  return ML_ORDER_STATUS_MAP[status as keyof typeof ML_ORDER_STATUS_MAP]?.label || status;
};

export const getOrderStatusColor = (status: string) => {
  return ML_ORDER_STATUS_MAP[status as keyof typeof ML_ORDER_STATUS_MAP]?.color || 'gray';
};

export const getShippingStatusLabel = (status: string) => {
  return ML_SHIPPING_STATUS_MAP[status as keyof typeof ML_SHIPPING_STATUS_MAP]?.label || status;
};

export const getShippingStatusColor = (status: string) => {
  return ML_SHIPPING_STATUS_MAP[status as keyof typeof ML_SHIPPING_STATUS_MAP]?.color || 'gray';
};
