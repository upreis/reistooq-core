/**
 * 🎨 FORMATADORES UNIFICADOS - FASE 1 REFATORAÇÃO
 * Consolida todos os formatadores em um único módulo
 * Substitui: orderFormatters, mlStatusMapping, statusMapping, pedidos-translations
 */

// ============= STATUS =============

export function formatOrderStatus(status: string | number): string {
  if (!status) return '-';
  
  // ✅ FIX #7: Proteger contra tipos não-string
  const statusStr = String(status);
  
  const statusMap: Record<string, string> = {
    'paid': 'Pago',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando Pagamento',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'charged_back': 'Chargeback',
  };
  
  return statusMap[statusStr.toLowerCase()] || statusStr;
}

export function formatShippingStatus(status: string): string {
  if (!status) return '-';
  
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'ready_to_ship': 'Pronto para Enviar',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'not_delivered': 'Não Entregue',
    'returned': 'Devolvido',
    'to_be_agreed': 'A Combinar',
  };
  
  return statusMap[status.toLowerCase()] || status;
}

export function formatShippingSubstatus(substatus: string): string {
  if (!substatus) return '-';
  
  const substatusMap: Record<string, string> = {
    'ready_to_print': 'Pronto para Imprimir',
    'printed': 'Impresso',
    'ready_for_handling': 'Pronto para Despacho',
    'handling': 'Em Preparação',
    'ready_to_dispatch': 'Pronto para Envio',
    'in_plp': 'Na PLP',
    'in_hub': 'No Centro de Distribuição',
    'in_transit': 'Em Trânsito',
    'out_for_delivery': 'Saiu para Entrega',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'returned_to_agency': 'Devolvido para Agência',
    'returned_to_sender': 'Devolvido ao Remetente',
    'waiting_for_pickup': 'Aguardando Retirada',
  };
  
  return substatusMap[substatus.toLowerCase()] || substatus;
}

// ============= PAGAMENTO =============

export function formatPaymentStatus(status: string): string {
  if (!status) return '-';
  
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'authorized': 'Autorizado',
    'in_process': 'Em Processo',
    'in_mediation': 'Em Mediação',
    'rejected': 'Rejeitado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'charged_back': 'Chargeback',
  };
  
  return statusMap[status.toLowerCase()] || status;
}

export function formatPaymentMethod(method: string): string {
  if (!method) return '-';
  
  const methodMap: Record<string, string> = {
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'ticket': 'Boleto',
    'bank_transfer': 'Transferência Bancária',
    'atm': 'Caixa Eletrônico',
    'account_money': 'Saldo Mercado Pago',
    'pix': 'PIX',
  };
  
  return methodMap[method.toLowerCase()] || method;
}

export function formatPaymentType(type: string): string {
  if (!type) return '-';
  
  const typeMap: Record<string, string> = {
    'credit_card': 'Crédito',
    'debit_card': 'Débito',
    'ticket': 'Boleto',
    'bank_transfer': 'Transferência',
    'prepaid_card': 'Cartão Pré-pago',
    'digital_currency': 'Moeda Digital',
    'digital_wallet': 'Carteira Digital',
  };
  
  return typeMap[type.toLowerCase()] || type;
}

// ============= ENVIO =============

export function formatShippingMode(mode: string): string {
  if (!mode) return '-';
  
  const modeMap: Record<string, string> = {
    'me2': 'Mercado Envios Full',
    'me1': 'Mercado Envios Flex',
    'custom': 'Envio Próprio',
    'not_specified': 'Não Especificado',
  };
  
  return modeMap[mode.toLowerCase()] || mode;
}

export function formatShippingMethod(method: string): string {
  if (!method) return '-';
  
  const methodMap: Record<string, string> = {
    'standard': 'Padrão',
    'express': 'Expresso',
    'normal': 'Normal',
    'economic': 'Econômico',
  };
  
  return methodMap[method.toLowerCase()] || method;
}

export function formatLogisticType(type: string): string {
  if (!type) return '-';
  
  const typeMap: Record<string, string> = {
    'fulfillment': 'Full',
    'cross_docking': 'Flex',
    'drop_off': 'Drop Off',
    'self_service': 'Envio Próprio',
    'xd_drop_off': 'XD Drop Off',
    'not_specified': 'Não Especificado',
  };
  
  return typeMap[type.toLowerCase()] || type;
}

export function formatDeliveryType(type: string): string {
  if (!type) return '-';
  
  const typeMap: Record<string, string> = {
    'standard': 'Padrão',
    'express': 'Expresso',
    'same_day': 'Mesmo Dia',
    'next_day': 'Próximo Dia',
  };
  
  return typeMap[type.toLowerCase()] || type;
}

// ============= TAGS E CONDIÇÕES =============

export function formatMLTags(tags: string[]): string {
  if (!tags || tags.length === 0) return '-';
  
  const tagMap: Record<string, string> = {
    'paid': 'Pago',
    'not_paid': 'Não Pago',
    'pack_order': 'Pedido Agrupado',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
  };
  
  // ✅ FIX #4: Filtrar valores inválidos antes de mapear
  const result = tags
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => tagMap[tag.toLowerCase()] || tag)
    .join(', ');
  
  return result || '-';
}

export function formatCondition(condition: string): string {
  if (!condition) return '-';
  
  const conditionMap: Record<string, string> = {
    'new': 'Novo',
    'used': 'Usado',
    'not_specified': 'Não Especificado',
  };
  
  return conditionMap[condition.toLowerCase()] || condition;
}

// ============= REPUTAÇÃO =============

export function formatPowerSellerStatus(status: string): string {
  if (!status) return '-';
  
  const statusMap: Record<string, string> = {
    'platinum': '💎 Platinum',
    'gold': '🥇 Ouro',
    'silver': '🥈 Prata',
    'green': '🟢 Verde',
    'yellow': '🟡 Amarelo',
    'red': '🔴 Vermelho',
  };
  
  return statusMap[status.toLowerCase()] || status;
}

export function formatLevelId(levelId: string): string {
  if (!levelId) return '-';
  
  const levelMap: Record<string, string> = {
    '5_green': '⭐⭐⭐⭐⭐',
    '4_light_green': '⭐⭐⭐⭐',
    '3_yellow': '⭐⭐⭐',
    '2_orange': '⭐⭐',
    '1_red': '⭐',
  };
  
  return levelMap[levelId.toLowerCase()] || levelId;
}

// ============= BADGE VARIANTS =============

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!status) return 'outline';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('paid') || statusLower.includes('approved') || statusLower.includes('delivered')) {
    return 'default'; // verde
  }
  
  if (statusLower.includes('pending') || statusLower.includes('process') || statusLower.includes('transit')) {
    return 'secondary'; // amarelo/laranja
  }
  
  if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('refund')) {
    return 'destructive'; // vermelho
  }
  
  return 'outline';
}

export function getShippingStatusColor(status: string): string {
  if (!status) return 'text-muted-foreground';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('delivered')) return 'text-green-600';
  if (statusLower.includes('shipped') || statusLower.includes('transit')) return 'text-blue-600';
  if (statusLower.includes('ready')) return 'text-orange-600';
  if (statusLower.includes('cancel') || statusLower.includes('return')) return 'text-red-600';
  
  return 'text-muted-foreground';
}

// ============= MAPEAMENTO DE STATUS (PT ↔ EN) =============

export function mapSituacaoToApiStatus(situacao: string): string {
  if (!situacao) return '';
  
  const statusMap: Record<string, string> = {
    'pago': 'paid',
    'aguardando pagamento': 'payment_required',
    'processando pagamento': 'payment_in_process',
    'pendente': 'pending',
    'aprovado': 'approved',
    'cancelado': 'cancelled',
    'reembolsado': 'refunded',
  };
  
  return statusMap[situacao.toLowerCase()] || situacao;
}

export function mapApiStatusToLabel(status: string): string {
  if (!status) return '-';
  
  const labelMap: Record<string, string> = {
    'paid': 'Pago',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando Pagamento',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'charged_back': 'Chargeback',
  };
  
  return labelMap[status.toLowerCase()] || status;
}

// ============= FORMATAÇÃO DE TEXTO =============

export function formatText(text: string): string {
  if (!text) return '-';
  
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ============= HELPERS DE VALIDAÇÃO =============

export function statusMatchesFilter(orderStatus: string, filterStatus: string): boolean {
  if (!orderStatus || !filterStatus) return false;
  
  const normalizedOrder = orderStatus.toLowerCase();
  const normalizedFilter = filterStatus.toLowerCase();
  
  // Match exato
  if (normalizedOrder === normalizedFilter) return true;
  
  // Match por tradução
  const mappedOrder = mapSituacaoToApiStatus(normalizedOrder);
  const mappedFilter = mapSituacaoToApiStatus(normalizedFilter);
  
  return mappedOrder === mappedFilter || mappedOrder === normalizedFilter;
}
