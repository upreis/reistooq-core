/**
 * 🌐 SISTEMA DE TRADUÇÃO GLOBAL
 * Traduz termos em inglês para português e trata underscores
 */

// Mapeamento de traduções para status de pagamento
const PAYMENT_STATUS_TRANSLATIONS: Record<string, string> = {
  'pending': 'Pendente',
  'approved': 'Aprovado',
  'authorized': 'Autorizado',
  'in_process': 'Em Processamento',
  'in_mediation': 'Em Mediação',
  'rejected': 'Rejeitado',
  'cancelled': 'Cancelado',
  'refunded': 'Reembolsado',
  'charged_back': 'Estornado',
  'paid': 'Pago',
  'unpaid': 'Não Pago',
  'partially_paid': 'Parcialmente Pago',
  'overpaid': 'Pago a Mais'
};

// Mapeamento de traduções para métodos de pagamento
const PAYMENT_METHOD_TRANSLATIONS: Record<string, string> = {
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'bank_transfer': 'Transferência Bancária',
  'ticket': 'Boleto',
  'account_money': 'Dinheiro da Conta',
  'account money': 'Dinheiro da Conta',
  'consumer_credits': 'Créditos do Consumidor',
  'consumer credits': 'Créditos do Consumidor',
  'pix': 'PIX',
  'cash': 'Dinheiro',
  'cryptocurrency': 'Criptomoeda',
  'digital_wallet': 'Carteira Digital',
  'prepaid_card': 'Cartão Pré-pago'
};

// Mapeamento de traduções para tipos de pagamento
const PAYMENT_TYPE_TRANSLATIONS: Record<string, string> = {
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'bank_transfer': 'Transferência',
  'ticket': 'Boleto',
  'atm': 'Caixa Eletrônico',
  'digital_currency': 'Moeda Digital',
  'digital_wallet': 'Carteira Digital'
};

// Mapeamento de traduções para motivos de cancelamento
const CANCEL_REASON_TRANSLATIONS: Record<string, string> = {
  'buyer_request': 'Solicitação do Comprador',
  'seller_request': 'Solicitação do Vendedor',
  'out_of_stock': 'Sem Estoque',
  'invalid_address': 'Endereço Inválido',
  'payment_failed': 'Falha no Pagamento',
  'fraud_suspicion': 'Suspeita de Fraude',
  'buyer_not_available': 'Comprador Indisponível',
  'seller_not_available': 'Vendedor Indisponível',
  'shipping_cost': 'Custo de Envio',
  'quality_issues': 'Problemas de Qualidade',
  'price_error': 'Erro no Preço',
  'product_unavailable': 'Produto Indisponível',
  'delivery_delay': 'Atraso na Entrega',
  'packaging_issues': 'Problemas na Embalagem',
  'wrong_product': 'Produto Errado',
  'defective_product': 'Produto Defeituoso',
  'changed_mind': 'Mudança de Opinião',
  'duplicate_order': 'Pedido Duplicado',
  'payment_issues': 'Problemas de Pagamento',
  'communication_failure': 'Falha na Comunicação',
  'system_error': 'Erro do Sistema',
  'no_reason_specified': 'Motivo Não Especificado',
  'other': 'Outros'
};

// Mapeamento de traduções para status de envio
const SHIPPING_STATUS_TRANSLATIONS: Record<string, string> = {
  'pending': 'Pendente',
  'handling': 'Preparando',
  'ready_to_ship': 'Pronto para Envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue',
  'not_delivered': 'Não Entregue',
  'cancelled': 'Cancelado',
  'returned': 'Devolvido',
  'lost': 'Perdido',
  'damaged': 'Danificado',
  'to_be_agreed': 'A Combinar',
  'ready_to_print': 'Pronto para Imprimir'
};

// Mapeamento de traduções para substatus de envio
const SHIPPING_SUBSTATUS_TRANSLATIONS: Record<string, string> = {
  'ready_to_print': 'Pronto para Imprimir',
  'printed': 'Impresso',
  'stale': 'Parado',
  'delayed': 'Atrasado',
  'ready_to_ship': 'Pronto para Envio',
  'in_hub': 'No Centro de Distribuição',
  'in_route': 'Em Trânsito',
  'out_for_delivery': 'Saiu para Entrega',
  'delivered': 'Entregue',
  'not_delivered': 'Não Entregue',
  'returning_to_hub': 'Retornando ao Centro',
  'returned_to_hub': 'Retornado ao Centro',
  'received_by_post_office': 'Recebido pelos Correios',
  'claim': 'Reclamação',
  'pending': 'Pendente',
  'handling': 'Preparando',
  'shipped': 'Enviado',
  'cancelled': 'Cancelado',
  'returned': 'Devolvido',
  'lost': 'Perdido',
  'damaged': 'Danificado',
  'waiting_for_pickup': 'Aguardando Retirada',
  'picked_up': 'Coletado',
  'in_transit': 'Em Trânsito',
  'ready_for_pickup': 'Pronto para Retirada',
  'delivery_failed': 'Falha na Entrega',
  'delivery_attempted': 'Tentativa de Entrega',
  'receiver_absent': 'Destinatário Ausente',
  'address_issue': 'Problema no Endereço',
  'package_damaged': 'Pacote Danificado',
  'under_review': 'Em Análise',
  'waiting_for_withdrawal': 'Aguardando Retirada',
  'waiting for withdrawal': 'Aguardando Retirada',
  'in_warehouse': 'No Depósito',
  'in warehouse': 'No Depósito',
  'ready_to_pack': 'Pronto para Embalar',
  'ready to pack': 'Pronto para Embalar',
  'in_packing_list': 'Na Lista de Embalagem',
  'in packing list': 'Na Lista de Embalagem'
};

// Mapeamento de traduções para modos de envio
const SHIPPING_MODE_TRANSLATIONS: Record<string, string> = {
  'me1': 'Mercado Envios 1',
  'me2': 'Mercado Envios 2',
  'self_service': 'Modalidade Própria',
  'custom': 'Personalizado',
  'not_specified': 'Não Especificado',
  'fulfillment': 'Full'
};

// Mapeamento de traduções para tipos de método de envio
const SHIPPING_METHOD_TYPE_TRANSLATIONS: Record<string, string> = {
  'standard': 'Padrão',
  'express': 'Expresso',
  'priority': 'Prioritário',
  'same_day': 'Mesmo Dia',
  'next_day': 'Próximo Dia',
  'economy': 'Econômico',
  'custom': 'Personalizado',
  'flex': 'Flex',
  'cross_docking': 'Cross Docking',
  'fulfillment': 'Full',
  'me1': 'Mercado Envios 1',
  'me2': 'Mercado Envios 2',
  'self_service': 'Modalidade Própria'
};

// Mapeamento de traduções para tipos logísticos
const LOGISTIC_TYPE_TRANSLATIONS: Record<string, string> = {
  'drop_off': 'Retirada',
  'self_service': 'Modalidade Própria',
  'cross_docking': 'Cross Docking',
  'fulfillment': 'Full',
  'flex': 'Flex',
  'xd_drop_off': 'XD Retirada',
  'carrier': 'Transportadora'
};

// Mapeamento de traduções para tipos de entrega
const DELIVERY_TYPE_TRANSLATIONS: Record<string, string> = {
  'standard': 'Padrão',
  'express': 'Expresso',
  'priority': 'Prioritário',
  'same_day': 'Mesmo Dia',
  'next_day': 'Próximo Dia',
  'economy': 'Econômico'
};

// Mapeamento de traduções para tags do Mercado Livre
const ML_TAGS_TRANSLATIONS: Record<string, string> = {
  'immediate_payment': 'Pagamento Imediato',
  'immediate payment': 'Pagamento Imediato',
  'cart': 'Carrinho',
  'mandatory_immediate_payment': 'Pagamento Imediato Obrigatório',
  'mandatory immediate payment': 'Pagamento Imediato Obrigatório',
  'paid': 'Pago',
  'not_paid': 'Não Pago',
  'not paid': 'Não Pago',
  'pack_order': 'Pedido Pack',
  'pack order': 'Pedido Pack',
  'delivered': 'Entregue',
  'not_delivered': 'Não Entregue',
  'not delivered': 'Não Entregue',
  'fbm': 'Enviado pelo Vendedor',
  'fulfillment': 'Full',
  'self_service_in': 'Auto Atendimento',
  'self service in': 'Auto Atendimento',
  'self_service_out': 'Retirada',
  'self service out': 'Retirada',
  'normal': 'Normal',
  'me2': 'Mercado Envios 2',
  'no_shipping': 'Sem Frete',
  'no shipping': 'Sem Frete',
  'free_shipping': 'Frete Grátis',
  'free shipping': 'Frete Grátis',
  'express_shipping': 'Frete Expresso',
  'express shipping': 'Frete Expresso',
  'scheduled_delivery': 'Entrega Agendada',
  'scheduled delivery': 'Entrega Agendada',
  'store_pickup': 'Retirada na Loja',
  'store pickup': 'Retirada na Loja',
  'cross_docking': 'Cross Docking',
  'cross docking': 'Cross Docking',
  'same_day_delivery': 'Entrega no Mesmo Dia',
  'same day delivery': 'Entrega no Mesmo Dia',
  'next_day_delivery': 'Entrega no Próximo Dia',
  'next day delivery': 'Entrega no Próximo Dia',
  'invoiced': 'Faturado',
  'printed': 'Impresso',
  'partially_refunded': 'Parcialmente Reembolsado',
  'partially refunded': 'Parcialmente Reembolsado',
  'ready_to_print': 'Pronto para Imprimir',
  'ready to print': 'Pronto para Imprimir',
  'ready_to_ship': 'Pronto para Envio',
  'ready to ship': 'Pronto para Envio',
  'shipped': 'Enviado',
  'cancelled': 'Cancelado',
  'returned': 'Devolvido',
  'pending': 'Pendente',
  'processing': 'Processando',
  'confirmed': 'Confirmado',
  'delayed': 'Atrasado',
  'on_hold': 'Em Espera',
  'on hold': 'Em Espera',
  'requires_attention': 'Requer Atenção',
  'requires attention': 'Requer Atenção',
  'order_has_discount': 'Pedido com Desconto',
  'order has discount': 'Pedido com Desconto',
  'one_shot': 'Pedido Único',
  'one shot': 'Pedido Único',
  'pedido_pack': 'Pedido Pack',
  'pedido pack': 'Pedido Pack',
  'catalog': 'Catálogo'
};

// Mapeamento de traduções gerais
const GENERAL_TRANSLATIONS: Record<string, string> = {
  'active': 'Ativo',
  'inactive': 'Inativo',
  'enabled': 'Habilitado',
  'disabled': 'Desabilitado',
  'true': 'Sim',
  'false': 'Não',
  'yes': 'Sim',
  'no': 'Não',
  'unknown': 'Desconhecido',
  'not_specified': 'Não Especificado',
  'not_available': 'Não Disponível',
  'processing': 'Processando',
  'completed': 'Concluído',
  'failed': 'Falhou',
  'success': 'Sucesso',
  'error': 'Erro'
};

/**
 * Função para normalizar texto: remove underscores e converte para minúsculas
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.toLowerCase().replace(/_/g, ' ').trim();
}

/**
 * Função para traduzir status de pagamento
 */
export function translatePaymentStatus(status: string): string {
  if (!status) return '-';
  const normalized = normalizeText(status);
  return PAYMENT_STATUS_TRANSLATIONS[normalized] || 
         PAYMENT_STATUS_TRANSLATIONS[status.toLowerCase()] || 
         formatText(status);
}

/**
 * Função para traduzir método de pagamento
 */
export function translatePaymentMethod(method: string): string {
  if (!method) return '-';
  const normalized = normalizeText(method);
  return PAYMENT_METHOD_TRANSLATIONS[normalized] || 
         PAYMENT_METHOD_TRANSLATIONS[method.toLowerCase()] || 
         formatText(method);
}

/**
 * Função para traduzir tipo de pagamento
 */
export function translatePaymentType(type: string): string {
  if (!type) return '-';
  const normalized = normalizeText(type);
  return PAYMENT_TYPE_TRANSLATIONS[normalized] || 
         PAYMENT_TYPE_TRANSLATIONS[type.toLowerCase()] || 
         formatText(type);
}

/**
 * Função para traduzir status de envio
 */
export function translateShippingStatus(status: string): string {
  if (!status) return '-';
  const normalized = normalizeText(status);
  return SHIPPING_STATUS_TRANSLATIONS[normalized] || 
         SHIPPING_STATUS_TRANSLATIONS[status.toLowerCase()] || 
         formatText(status);
}

/**
 * Função para traduzir substatus de envio
 */
export function translateShippingSubstatus(substatus: string): string {
  if (!substatus) return '-';
  const normalized = normalizeText(substatus);
  return SHIPPING_SUBSTATUS_TRANSLATIONS[normalized] || 
         SHIPPING_SUBSTATUS_TRANSLATIONS[substatus.toLowerCase()] || 
         formatText(substatus);
}

/**
 * Função para traduzir modo de envio
 * Traduz também termos específicos como Gross, Receiver, Sender
 */
export function translateShippingMode(mode: string): string {
  if (!mode) return '-';
  
  // 🌐 Traduzir termos específicos do modo de envio combinado
  let translated = mode
    .replace(/\bGross:\s*/gi, 'Bruto: ')
    .replace(/\bReceiver:\s*/gi, 'Destinatário: ')
    .replace(/\bSender:\s*/gi, 'Remetente: ');
  
  // Se a string foi modificada (tinha Gross, Receiver ou Sender), retornar traduzida
  if (translated !== mode) {
    return translated;
  }
  
  // Caso contrário, usar tradução normal de modos de envio
  const normalized = normalizeText(mode);
  return SHIPPING_MODE_TRANSLATIONS[normalized] || 
         SHIPPING_MODE_TRANSLATIONS[mode.toLowerCase()] || 
         formatText(mode);
}

/**
 * Função para traduzir tipo de método de envio
 */
export function translateShippingMethodType(type: string): string {
  if (!type) return '-';
  const normalized = normalizeText(type);
  return SHIPPING_METHOD_TYPE_TRANSLATIONS[normalized] || 
         SHIPPING_METHOD_TYPE_TRANSLATIONS[type.toLowerCase()] || 
         formatText(type);
}

/**
 * Função para traduzir método de envio
 */
export function translateShippingMethod(method: string): string {
  if (!method) return '-';
  const normalized = normalizeText(method);
  return SHIPPING_METHOD_TYPE_TRANSLATIONS[normalized] || 
         SHIPPING_METHOD_TYPE_TRANSLATIONS[method.toLowerCase()] || 
         formatText(method);
}

/**
 * Função para traduzir tipo logístico
 */
export function translateLogisticType(type: string): string {
  if (!type) return '-';
  const normalized = normalizeText(type);
  return LOGISTIC_TYPE_TRANSLATIONS[normalized] || 
         LOGISTIC_TYPE_TRANSLATIONS[type.toLowerCase()] || 
         formatText(type);
}

/**
 * Função para traduzir tipo de entrega
 */
export function translateDeliveryType(type: string): string {
  if (!type) return '-';
  const normalized = normalizeText(type);
  return DELIVERY_TYPE_TRANSLATIONS[normalized] || 
         DELIVERY_TYPE_TRANSLATIONS[type.toLowerCase()] || 
         formatText(type);
}

/**
 * Função para traduzir tags do Mercado Livre
 */
export function translateMLTags(tags: string[]): string {
  if (!Array.isArray(tags) || tags.length === 0) return '-';
  
  return tags.map(tag => {
    if (!tag) return '';
    
    // Substituir underscores por espaços para melhor tradução
    const normalizedTag = normalizeText(tag);
    
    // Tentar traduzir com underscore original primeiro, depois com espaços
    return ML_TAGS_TRANSLATIONS[tag.toLowerCase()] || 
           ML_TAGS_TRANSLATIONS[normalizedTag] || 
           formatText(tag);
  }).filter(Boolean).join(', ') || '-';
}

/**
 * Função para traduzir motivos de cancelamento
 */
export function translateCancelReason(reason: string): string {
  if (!reason) return 'Motivo Não Especificado';
  
  const normalized = normalizeText(reason);
  return CANCEL_REASON_TRANSLATIONS[normalized] || 
         CANCEL_REASON_TRANSLATIONS[reason.toLowerCase()] || 
         formatText(reason);
}

/**
 * Função genérica para traduzir qualquer termo
 */
export function translateGeneral(text: string): string {
  if (!text) return '-';
  const normalized = normalizeText(text);
  return GENERAL_TRANSLATIONS[normalized] || 
         GENERAL_TRANSLATIONS[text.toLowerCase()] || 
         formatText(text);
}

/**
 * Função para formatar texto: converte underscores em espaços e capitaliza
 */
export function formatText(text: string): string {
  if (!text || typeof text !== 'string') return text || '-';
  
  return text
    .replace(/_/g, ' ') // Substitui underscores por espaços
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Função principal para traduzir automaticamente baseado no contexto
 */
export function autoTranslate(text: string, context?: 'payment' | 'shipping' | 'logistic'): string {
  if (!text) return '-';
  
  switch (context) {
    case 'payment':
      return translatePaymentStatus(text) !== formatText(text) 
        ? translatePaymentStatus(text)
        : translatePaymentMethod(text) !== formatText(text)
        ? translatePaymentMethod(text)
        : translatePaymentType(text);
    
    case 'shipping':
      return translateShippingStatus(text) !== formatText(text)
        ? translateShippingStatus(text)
        : translateShippingSubstatus(text) !== formatText(text)
        ? translateShippingSubstatus(text)
        : translateShippingMode(text) !== formatText(text)
        ? translateShippingMode(text)
        : translateShippingMethod(text);
    
    case 'logistic':
      return translateLogisticType(text) !== formatText(text)
        ? translateLogisticType(text)
        : translateDeliveryType(text);
    
    default:
      return translateGeneral(text) !== formatText(text)
        ? translateGeneral(text)
        : formatText(text);
  }
}