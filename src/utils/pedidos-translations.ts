/**
 * 🛡️ UTILITÁRIOS DE TRADUÇÃO PARA PEDIDOS - MIGRAÇÃO GRADUAL FASE 1
 * Extraídas do SimplePedidosPage para melhor organização
 * GARANTIA: Funcionalidade 100% preservada
 */

// Cores para status de envio
export const getShippingStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'ready_to_ship': 'bg-blue-100 text-blue-800 border-blue-200',
    'shipped': 'bg-purple-100 text-purple-800 border-purple-200',
    'delivered': 'bg-green-100 text-green-800 border-green-200',
    'not_delivered': 'bg-red-100 text-red-800 border-red-200',
    'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
    'to_be_agreed': 'bg-orange-100 text-orange-800 border-orange-200',
    'handling': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'ready_to_print': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'printed': 'bg-slate-100 text-slate-800 border-slate-200',
    'stale': 'bg-amber-100 text-amber-800 border-amber-200',
    'delayed': 'bg-amber-100 text-amber-800 border-amber-200',
    'lost': 'bg-red-100 text-red-800 border-red-200',
    'damaged': 'bg-red-100 text-red-800 border-red-200',
    'measures_not_correspond': 'bg-orange-100 text-orange-800 border-orange-200'
  };
  return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Traduções de status de envio
export const translateShippingStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'pending': 'Pendente',
    'ready_to_ship': 'Pronto para Envio',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'cancelled': 'Cancelado',
    'to_be_agreed': 'A Combinar',
    'handling': 'Processando',
    'ready_to_print': 'Pronto para Imprimir',
    'printed': 'Impresso',
    'stale': 'Atrasado',
    'delayed': 'Atrasado',
    'lost': 'Perdido',
    'damaged': 'Danificado',
    'measures_not_correspond': 'Medidas Não Correspondem'
  };
  return translations[status?.toLowerCase()] || status || '-';
};

// Traduções de substatus de envio
export const translateShippingSubstatus = (substatus: string): string => {
  if (!substatus) return '-';
  
  const translations: Record<string, string> = {
    // Status comuns do ML
    'ready_to_print': 'Pronto para Imprimir',
    'printed': 'Impresso',
    'stale': 'Atrasado',
    'delayed': 'Atrasado',
    'receiver_absent': 'Destinatário Ausente',
    'returning_to_sender': 'Retornando ao Remetente',
    'out_for_delivery': 'Saiu para Entrega',
    'in_hub': 'No Centro de Distribuição',
    'in_transit': 'Em Trânsito',
    'arrived_at_unit': 'Chegou na Unidade',
    'contact_customer': 'Contatar Cliente',
    'need_review': 'Precisa Revisão',
    'forwarded': 'Encaminhado',
    'preparing': 'Preparando',
    'ready_to_ship': 'Pronto para Envio',
    'waiting_for_withdrawal': 'Aguardando Retirada',
    'withdrawal_in_progress': 'Retirada em Andamento',
    'delivered_to_agent': 'Entregue ao Agente',
    'exception': 'Exceção',
    'failed_delivery': 'Falha na Entrega',
    'customs_pending': 'Pendente na Alfândega',
    'customs_released': 'Liberado pela Alfândega',
    
    // VALORES ESPECÍFICOS QUE ESTÃO APARECENDO
    'in_warehouse': 'No Armazém',
    'in warehouse': 'No Armazém',
    'at_warehouse': 'No Armazém',
    'at warehouse': 'No Armazém',
    'warehouse': 'Armazém',
    
    // Adicionando mais status específicos do ML
    'handling': 'Em Processamento',
    'ready_to_pickup': 'Pronto para Retirada',
    'claim_pending': 'Reclamação Pendente',
    'claimed': 'Reclamado',
    'measures_not_correspond': 'Medidas Não Correspondem',
    'damaged': 'Danificado',
    'lost': 'Perdido',
    'canceled': 'Cancelado',
    'not_delivered': 'Não Entregue',
    'delivered': 'Entregue',
    'to_be_agreed': 'A Combinar',
    'pending': 'Pendente',
    'shipped': 'Enviado',
    
    // Variações com espaços
    'ready to print': 'Pronto para Imprimir',
    'ready to ship': 'Pronto para Envio',
    'out for delivery': 'Saiu para Entrega',
    'in transit': 'Em Trânsito',
    'not delivered': 'Não Entregue',
    'to be agreed': 'A Combinar',
    'contact customer': 'Contatar Cliente',
    'need review': 'Precisa Revisão',
    'ready to pickup': 'Pronto para Retirada',
    'waiting for withdrawal': 'Aguardando Retirada',
    'withdrawal in progress': 'Retirada em Andamento',
    'delivered to agent': 'Entregue ao Agente',
    'failed delivery': 'Falha na Entrega',
    'customs pending': 'Pendente na Alfândega',
    'customs released': 'Liberado pela Alfândega',
    'claim pending': 'Reclamação Pendente',
    'measures not correspond': 'Medidas Não Correspondem'
  };
  
  // Normalize: lowercase, trim, and handle different formats
  const originalKey = substatus.toLowerCase().trim();
  const withSpacesKey = originalKey.replace(/_/g, ' ');
  const withUnderscoresKey = originalKey.replace(/\s+/g, '_');
  
  // Tentar diferentes variações
  if (translations[originalKey]) {
    return translations[originalKey];
  }
  
  if (translations[withSpacesKey]) {
    return translations[withSpacesKey];
  }
  
  if (translations[withUnderscoresKey]) {
    return translations[withUnderscoresKey];
  }
  // Se não encontrar, substitui _ por espaços e capitaliza
  return substatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Traduções de modo de envio
export const translateShippingMode = (mode: string): string => {
  if (!mode) return '-';
  
  const translations: Record<string, string> = {
    // Mercado Envios
    'me1': 'Mercado Envios 1',
    'me2': 'Mercado Envios 2', 
    'flex': 'Mercado Envios Flex',
    'self_service': 'Mercado Envios Flex',
    'cross_docking': 'Cross Docking',
    'xd_drop_off': 'Cross Docking',
    'xd_pick_up': 'Cross Docking',
    
    // Outros modos
    'standard': 'Padrão',
    'express': 'Expresso',
    'scheduled': 'Agendado',
    'pickup': 'Retirada',
    'drop_off': 'Ponto de Despacho',
    
    // SLA / Service hints
    'same_day': 'Mesmo Dia',
    'next_day': 'Próximo Dia',
    'custom': 'Personalizado',
    'normal': 'Normal',
    'free': 'Grátis',
    'paid': 'Pago',
    'store_pickup': 'Retirada na Loja',
    'fulfillment': 'Fulfillment',
    'fbm': 'Enviado pelo Vendedor'
  };
  
  const normalizedKey = mode.toLowerCase();
  
  // Primeiro tenta traduzir diretamente
  if (translations[normalizedKey]) {
    return translations[normalizedKey];
  }
  
  // Se não encontrar, substitui _ por espaços e capitaliza
  return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Traduções de método de envio
export const translateShippingMethod = (method: any): string => {
  if (!method) return '-';
  
  // Se for string, traduzir diretamente
  if (typeof method === 'string') {
    return translateShippingMode(method);
  }
  
  // Se for objeto com name, usar o name
  if (method.name) {
    const methodTranslations: Record<string, string> = {
      'Prioritario': 'Prioritário',
      'Standard': 'Padrão',
      'Express': 'Expresso',
      'Next Day': 'Próximo Dia',
      'Same Day': 'Mesmo Dia'
    };
    
    return methodTranslations[method.name] || method.name;
  }
  
  return '-';
};

// Traduções de condição do produto
export const translateCondition = (condition: string): string => {
  console.log('🎯 translateCondition chamada:', condition);
  if (!condition) return '-';
  
  const translations: Record<string, string> = {
    'new': 'Novo',
    'used': 'Usado',
    'refurbished': 'Recondicionado',
    'not_specified': 'Não Especificado',
    'like_new': 'Como Novo',
    'very_good': 'Muito Bom',
    'good': 'Bom',
    'acceptable': 'Aceitável'
  };
  
  const result = translations[condition.toLowerCase()] || condition;
  console.log('🎯 translateCondition resultado:', result);
  return result;
};