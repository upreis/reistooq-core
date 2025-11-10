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
  };
  
  return translations[shipmentStatus] || shipmentStatus;
};

// ===== VARIANTES DE BADGE =====
export const getStatusVariant = (statusId: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!statusId) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'delivered': 'default',
    'approved': 'default',
    'shipped': 'secondary',
    'in_transit': 'secondary',
    'label_generated': 'secondary',
    'pending': 'outline',
    'ready_to_ship': 'outline',
    'not_delivered': 'destructive',
    'cancelled': 'destructive',
    'expired': 'destructive',
    'rejected': 'destructive',
  };
  
  return variants[statusId] || 'outline';
};

export const getStatusMoneyVariant = (statusMoneyId: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!statusMoneyId) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'refunded': 'default',
    'approved': 'default',
    'partially_refunded': 'secondary',
    'to_be_refunded': 'secondary',
    'pending': 'outline',
    'not_refunded': 'destructive',
    'rejected': 'destructive',
  };
  
  return variants[statusMoneyId] || 'outline';
};

export const getShipmentStatusVariant = (shipmentStatus: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!shipmentStatus) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'delivered': 'default',
    'shipped': 'secondary',
    'in_transit': 'secondary',
    'label_generated': 'secondary',
    'processing': 'secondary',
    'handling': 'secondary',
    'pending': 'outline',
    'ready_to_ship': 'outline',
    'ready_to_print': 'outline',
    'to_be_agreed': 'outline',
    'not_delivered': 'destructive',
    'cancelled': 'destructive',
    'expired': 'destructive',
    'delayed': 'destructive',
    'stale': 'destructive',
  };
  
  return variants[shipmentStatus] || 'outline';
};
