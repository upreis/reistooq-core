/**
 * 🌐 TRADUÇÕES - STATUS DE DEVOLUÇÕES
 * Tradução de status da API ML para português
 */

export const translateShipmentStatus = (status: string | null): string => {
  if (!status) return 'N/A';
  
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
  };
  
  return translations[status] || status;
};

export const translateRefundAt = (refund: string | null): string => {
  if (!refund) return 'N/A';
  
  const translations: Record<string, string> = {
    'delivered': 'Na Entrega',
    'shipped': 'No Envio',
    'n/a': 'N/A',
    'not_applicable': 'Não Aplicável',
  };
  
  return translations[refund] || refund;
};

export const translateReviewStatus = (status: string | null): string => {
  if (!status) return 'N/A';
  
  const translations: Record<string, string> = {
    'pending': 'Pendente',
    'in_progress': 'Em Andamento',
    'completed': 'Concluída',
    'approved': 'Aprovada',
    'rejected': 'Rejeitada',
    'cancelled': 'Cancelada',
    'waiting_seller': 'Aguardando Vendedor',
    'waiting_buyer': 'Aguardando Comprador',
  };
  
  return translations[status] || status;
};

export const getShipmentStatusVariant = (status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'delivered': 'default',
    'shipped': 'secondary',
    'in_transit': 'secondary',
    'pending': 'outline',
    'ready_to_ship': 'outline',
    'not_delivered': 'destructive',
    'cancelled': 'destructive',
    'expired': 'destructive',
  };
  
  return variants[status] || 'outline';
};

export const getRefundAtVariant = (refund: string | null): 'default' | 'secondary' | 'outline' => {
  if (!refund || refund === 'n/a') return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    'delivered': 'default',
    'shipped': 'secondary',
  };
  
  return variants[refund] || 'outline';
};

export const getReviewStatusVariant = (status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline';
  
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'completed': 'default',
    'approved': 'default',
    'in_progress': 'secondary',
    'pending': 'outline',
    'waiting_seller': 'outline',
    'waiting_buyer': 'outline',
    'rejected': 'destructive',
    'cancelled': 'destructive',
  };
  
  return variants[status] || 'outline';
};
