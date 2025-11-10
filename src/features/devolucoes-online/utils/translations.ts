/**
 * 🌐 TRADUÇÕES - PÁGINA DEVOLUÇÕES ML
 * Traduções para colunas da tabela de devoluções do Mercado Livre
 */

// ===== STATUS =====
export const translateStatus = (statusId: string | null): string => {
  if (!statusId) return 'N/A';
  
  const translations: Record<string, string> = {
    'pending': 'Pendente',
    'label_generated': 'Etiqueta Gerada',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'expired': 'Expirado',
    'not_delivered': 'Não Entregue',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'in_process': 'Em Processo',
    'opened': 'Aberto',
    'closed': 'Fechado',
    'waiting_buyer': 'Aguardando Comprador',
    'waiting_seller': 'Aguardando Vendedor',
    'waiting_resolution': 'Aguardando Resolução',
    'resolved': 'Resolvido',
    'return_opened': 'Devolução Aberta',
    'return_closed': 'Devolução Fechada',
    'return_partial': 'Devolução Parcial',
    'completed': 'Completo',
    'processing': 'Processando',
    'authorized': 'Autorizado',
    'finalized': 'Finalizado',
  };
  
  return translations[statusId] || statusId;
};

// ===== STATUS $ (STATUS MONEY) =====
export const translateStatusMoney = (statusMoneyId: string | null): string => {
  if (!statusMoneyId) return 'N/A';
  
  const translations: Record<string, string> = {
    'refunded': 'Reembolsado',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'not_refunded': 'Não Reembolsado',
    'to_be_refunded': 'A Reembolsar',
    'partially_refunded': 'Parcialmente Reembolsado',
    'in_process': 'Em Processo',
    'cancelled': 'Cancelado',
    'processing': 'Processando',
    'completed': 'Completo',
    'waiting_refund': 'Aguardando Reembolso',
    'refund_pending': 'Reembolso Pendente',
    'retained': 'Retido',
  };
  
  return translations[statusMoneyId] || statusMoneyId;
};

// ===== SUBTIPO =====
export const translateSubtype = (subtypeId: string | null): string => {
  if (!subtypeId) return 'N/A';
  
  const translations: Record<string, string> = {
    'damaged': 'Danificado',
    'defective': 'Defeituoso',
    'not_as_described': 'Não Conforme Descrito',
    'wrong_item': 'Item Errado',
    'missing_parts': 'Peças Faltando',
    'does_not_fit': 'Não Serve',
    'changed_mind': 'Desistência',
    'better_price': 'Melhor Preço',
    'not_received': 'Não Recebido',
    'arrived_late': 'Chegou Tarde',
    'other': 'Outro',
    'quality_issue': 'Problema de Qualidade',
    'size_issue': 'Problema de Tamanho',
    'color_issue': 'Problema de Cor',
    'packaging_issue': 'Problema de Embalagem',
    'incomplete': 'Incompleto',
    'unauthorized_purchase': 'Compra Não Autorizada',
    'duplicate_order': 'Pedido Duplicado',
    'seller_request': 'Solicitação do Vendedor',
    'buyer_request': 'Solicitação do Comprador',
    'low_cost': 'Baixo Custo',
    'return_total': 'Devolução Total',
    'return_partial': 'Devolução Parcial',
  };
  
  return translations[subtypeId] || subtypeId;
};

// ===== TIPO RECURSO (RESOURCE TYPE) =====
export const translateResourceType = (resourceType: string | null): string => {
  if (!resourceType) return 'N/A';
  
  const translations: Record<string, string> = {
    'claim': 'Reclamação',
    'return': 'Devolução',
    'refund': 'Reembolso',
    'warranty': 'Garantia',
    'mediation': 'Mediação',
    'cancellation': 'Cancelamento',
    'chargeback': 'Estorno',
    'dispute': 'Disputa',
    'complaint': 'Queixa',
    'return_partial': 'Devolução Parcial',
    'return_full': 'Devolução Completa',
    'exchange': 'Troca',
    'order': 'Pedido',
  };
  
  return translations[resourceType] || resourceType;
};

// ===== STATUS ENVIO (SHIPMENT STATUS) =====
export const translateShipmentStatus = (shipmentStatus: string | null): string => {
  if (!shipmentStatus) return 'N/A';
  
  const translations: Record<string, string> = {
    'pending': 'Pendente',
    'ready_to_ship': 'Pronto p/ Enviar',
    'shipped': 'Enviado',
    'in_transit': 'Em Trânsito',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'cancelled': 'Cancelado',
    'expired': 'Expirado',
    'label_generated': 'Etiqueta Gerada',
    'processing': 'Processando',
    'to_be_agreed': 'A Combinar',
    'handling': 'Em Preparação',
    'ready_to_print': 'Pronto p/ Imprimir',
    'stale': 'Parado',
    'delayed': 'Atrasado',
    'picked_up': 'Coletado',
    'returned_to_sender': 'Devolvido ao Remetente',
    'failed_delivery': 'Falha na Entrega',
    'out_for_delivery': 'Saiu para Entrega',
    'awaiting_pickup': 'Aguardando Coleta',
    'return_initiated': 'Devolução Iniciada',
    'return_in_transit': 'Devolução em Trânsito',
    'return_delivered': 'Devolução Entregue',
    'closed': 'Fechado',
  };
  
  return translations[shipmentStatus] || shipmentStatus;
};

// ===== VARIANTES DE BADGE =====
export const getStatusVariant = (statusId: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!statusId) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'delivered': 'default',
    'approved': 'default',
    'resolved': 'default',
    'completed': 'default',
    'finalized': 'default',
    'closed': 'default',
    'shipped': 'secondary',
    'in_transit': 'secondary',
    'label_generated': 'secondary',
    'processing': 'secondary',
    'authorized': 'secondary',
    'return_partial': 'secondary',
    'opened': 'outline',
    'pending': 'outline',
    'ready_to_ship': 'outline',
    'waiting_buyer': 'outline',
    'waiting_seller': 'outline',
    'waiting_resolution': 'outline',
    'return_opened': 'outline',
    'not_delivered': 'destructive',
    'cancelled': 'destructive',
    'expired': 'destructive',
    'rejected': 'destructive',
    'return_closed': 'destructive',
  };
  
  return variants[statusId] || 'outline';
};

export const getStatusMoneyVariant = (statusMoneyId: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!statusMoneyId) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'refunded': 'default',
    'approved': 'default',
    'completed': 'default',
    'partially_refunded': 'secondary',
    'to_be_refunded': 'secondary',
    'in_process': 'secondary',
    'processing': 'secondary',
    'waiting_refund': 'secondary',
    'retained': 'secondary',
    'pending': 'outline',
    'refund_pending': 'outline',
    'not_refunded': 'destructive',
    'rejected': 'destructive',
    'cancelled': 'destructive',
  };
  
  return variants[statusMoneyId] || 'outline';
};

export const getShipmentStatusVariant = (shipmentStatus: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!shipmentStatus) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'delivered': 'default',
    'return_delivered': 'default',
    'closed': 'default',
    'shipped': 'secondary',
    'in_transit': 'secondary',
    'label_generated': 'secondary',
    'processing': 'secondary',
    'handling': 'secondary',
    'picked_up': 'secondary',
    'out_for_delivery': 'secondary',
    'return_initiated': 'secondary',
    'return_in_transit': 'secondary',
    'pending': 'outline',
    'ready_to_ship': 'outline',
    'ready_to_print': 'outline',
    'to_be_agreed': 'outline',
    'awaiting_pickup': 'outline',
    'not_delivered': 'destructive',
    'cancelled': 'destructive',
    'expired': 'destructive',
    'delayed': 'destructive',
    'stale': 'destructive',
    'failed_delivery': 'destructive',
    'returned_to_sender': 'destructive',
  };
  
  return variants[shipmentStatus] || 'outline';
};
