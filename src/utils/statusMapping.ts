/**
 * 🛡️ SISTEMA CENTRALIZADO DE MAPEAMENTO DE STATUS
 * Unifica todos os mapeamentos de status em uma única fonte de verdade
 */

// Mapeamento unificado: Label PT -> API Status
export const STATUS_MAPPING: Record<string, string> = {
  // Status principais do Mercado Livre
  'pago': 'paid',
  'paid': 'paid',
  'enviado': 'shipped',
  'a caminho': 'shipped',
  'shipped': 'shipped',
  'confirmado': 'confirmed',
  'confirmed': 'confirmed',
  'pendente': 'pending',
  'pending': 'pending',
  'aguardando': 'payment_required',
  'aguardando pagamento': 'payment_required',
  'payment_required': 'payment_required',
  'cancelado': 'cancelled',
  'cancelled': 'cancelled',
  'devolvido': 'returned',
  'returned': 'returned',
  'reembolsado': 'refunded',
  'refunded': 'refunded',
  'entregue': 'delivered',
  'delivered': 'delivered',
  'não entregue': 'not_delivered',
  'nao entregue': 'not_delivered',
  'not_delivered': 'not_delivered',
  'pronto para enviar': 'ready_to_ship',
  'pronto para envio': 'ready_to_ship',
  'pronto p/ enviar': 'ready_to_ship',
  'ready_to_ship': 'ready_to_ship',
  'preparando': 'handling',
  'handling': 'handling',
  'aberto': 'active',
  'active': 'active',
  
  // Status adicionais
  'processando': 'payment_in_process',
  'payment_in_process': 'payment_in_process',
  'em_transito': 'shipped',
  'em trânsito': 'shipped',
  'concluido': 'delivered',
  'concluído': 'delivered',
  'completed': 'delivered',
  'expired': 'expired',
  'expirado': 'expired',
  'invalid': 'invalid',
  'inválido': 'invalid',
};

// Mapeamento reverso: API Status -> Label PT (Status do Envio)
export const STATUS_LABELS: Record<string, string> = {
  'confirmed': 'Pendente',
  'payment_required': 'Pendente',
  'payment_in_process': 'Processando',
  'paid': 'Pronto para Envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado',
  'invalid': 'Cancelado',
  'expired': 'Cancelado',
  'pending': 'Pendente',
  'ready_to_ship': 'Pronto para Envio',
  'handling': 'Processando',
  'not_delivered': 'Não Entregue',
  'returned': 'Não Entregue',
  'refunded': 'Cancelado',
  'active': 'Pendente',
  'to_combine': 'A Combinar',
  
  // Fallbacks para status não mapeados
  'completed': 'Entregue',
  'processing': 'Processando',
  'on_hold': 'Pendente',
  'failed': 'Não Entregue',
  'draft': 'Pendente',
  'inactive': 'Cancelado',
};

/**
 * Converte status/situação para formato da API
 */
export function mapSituacaoToApiStatus(label: string): string | null {
  if (!label || typeof label !== 'string') return null;
  
  const normalized = label.toLowerCase().trim();
  return STATUS_MAPPING[normalized] || null;
}

/**
 * Converte status da API para label em português
 */
export function mapApiStatusToLabel(apiStatus: string): string {
  if (!apiStatus || typeof apiStatus !== 'string') return 'Não informado';
  
  const normalized = apiStatus.toLowerCase().trim();
  
  // Busca exata primeiro
  if (STATUS_LABELS[normalized]) {
    return STATUS_LABELS[normalized];
  }
  
  // Busca por palavras-chave para casos não mapeados
  if (normalized.includes('entregue') || normalized.includes('delivered')) {
    return 'Entregue';
  }
  if (normalized.includes('cancelado') || normalized.includes('cancelled')) {
    return 'Cancelado';
  }
  if (normalized.includes('enviado') || normalized.includes('shipped')) {
    return 'Enviado';
  }
  if (normalized.includes('pago') || normalized.includes('paid')) {
    return 'Pago';
  }
  if (normalized.includes('pendente') || normalized.includes('pending')) {
    return 'Pendente';
  }
  if (normalized.includes('processando') || normalized.includes('processing')) {
    return 'Processando';
  }
  
  // Se não encontrou mapeamento, capitaliza a primeira letra
  return apiStatus.charAt(0).toUpperCase() + apiStatus.slice(1).toLowerCase();
}

/**
 * Normaliza status para comparação (remove acentos, espaços, etc.)
 */
export function normalizeStatus(status: string): string {
  if (!status || typeof status !== 'string') {
    return '';
  }
  
  return status
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '_'); // Replace não-alfanuméricos com _
}

/**
 * Verifica se um status corresponde a uma seleção de filtros
 */
export function statusMatchesFilter(
  orderStatus: string, 
  selectedStatuses: string[]
): boolean {
  if (!selectedStatuses.length) return true;
  
  const orderStatusNorm = normalizeStatus(orderStatus);
  const orderApiStatus = mapSituacaoToApiStatus(orderStatus);
  const orderLabel = mapApiStatusToLabel(orderStatus);
  
  return selectedStatuses.some(selected => {
    const selectedNorm = normalizeStatus(selected);
    const selectedApiStatus = mapSituacaoToApiStatus(selected);
    const selectedLabel = mapApiStatusToLabel(selected);
    
    return (
      orderStatusNorm === selectedNorm ||
      orderApiStatus === selectedApiStatus ||
      normalizeStatus(orderLabel) === normalizeStatus(selectedLabel)
    );
  });
}

/**
 * Obtém variante do badge baseada no status
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = normalizeStatus(status);
  
  if (normalized.includes('entregue') || normalized.includes('delivered') || normalized.includes('pago') || normalized.includes('paid')) {
    return 'default'; // Verde
  }
  if (normalized.includes('cancelado') || normalized.includes('cancelled') || normalized.includes('devolvido') || normalized.includes('returned')) {
    return 'destructive'; // Vermelho
  }
  if (normalized.includes('enviado') || normalized.includes('shipped') || normalized.includes('preparando') || normalized.includes('handling')) {
    return 'secondary'; // Azul
  }
  
  return 'outline'; // Padrão
}