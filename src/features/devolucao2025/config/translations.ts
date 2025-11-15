/**
 * 🌐 TRADUÇÕES DAS COLUNAS
 * Mapeamento de valores das colunas para português
 */

// Método de Pagamento
export const METODO_PAGAMENTO_TRANSLATIONS: Record<string, string> = {
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'account_money': 'Saldo Mercado Pago',
  'ticket': 'Boleto',
  'bank_transfer': 'Transferência Bancária',
  'pix': 'PIX',
  'digital_currency': 'Moeda Digital',
  'prepaid_card': 'Cartão Pré-pago',
  'consumer_credits': 'Créditos do Consumidor',
  'atm': 'Caixa Eletrônico',
};

// Tipo de Pagamento
export const TIPO_PAGAMENTO_TRANSLATIONS: Record<string, string> = {
  'credit_card': 'Crédito',
  'debit_card': 'Débito',
  'cash': 'Dinheiro',
  'installments': 'Parcelado',
  'full_payment': 'À Vista',
};

// Status Devolução
export const STATUS_DEVOLUCAO_TRANSLATIONS: Record<string, string> = {
  'pending': 'Pendente',
  'in_progress': 'Em Andamento',
  'in_transit': 'Em Trânsito',
  'delivered': 'Entregue',
  'completed': 'Concluído',
  'cancelled': 'Cancelado',
  'waiting_buyer': 'Aguardando Comprador',
  'waiting_seller': 'Aguardando Vendedor',
  'approved': 'Aprovado',
  'rejected': 'Rejeitado',
  'expired': 'Expirado',
};

// Status Return
export const STATUS_RETURN_TRANSLATIONS: Record<string, string> = {
  'pending': 'Pendente',
  'approved': 'Aprovado',
  'in_transit': 'Em Trânsito',
  'delivered': 'Entregue',
  'not_delivered': 'Não Entregue',
  'rejected': 'Rejeitado',
  'completed': 'Concluído',
  'cancelled': 'Cancelado',
  'expired': 'Expirado',
  'waiting_product': 'Aguardando Produto',
  'in_review': 'Em Revisão',
};

// Destino do Produto
export const DESTINO_TRANSLATIONS: Record<string, string> = {
  'return_to_seller': 'Retorna ao Vendedor',
  'return_to_buyer': 'Retorna ao Comprador',
  'discard': 'Descartar',
  'donate': 'Doar',
  'keep_buyer': 'Fica com Comprador',
  'keep_seller': 'Fica com Vendedor',
  'warehouse': 'Armazém ML',
  'under_review': 'Em Análise',
};

// Review Stage
export const REVIEW_STAGE_TRANSLATIONS: Record<string, string> = {
  'pending': 'Pendente',
  'seller_review_pending': 'Aguardando Vendedor',
  'closed': 'Finalizada',
  'timeout': 'Expirada',
  'in_progress': 'Em Andamento',
  'awaiting_review': 'Aguardando Revisão',
};

// Review Status
export const REVIEW_STATUS_TRANSLATIONS: Record<string, string> = {
  'success': 'Produto OK',
  'failed': 'Com Problema',
  'pending': 'Pendente',
  'approved': 'Aprovado',
  'rejected': 'Rejeitado',
  'partial': 'Parcial',
};

// Product Condition
export const PRODUCT_CONDITION_TRANSLATIONS: Record<string, string> = {
  'new': 'Novo',
  'used': 'Usado',
  'damaged': 'Danificado',
  'not_received': 'Não Recebido',
  'different': 'Diferente',
  'incomplete': 'Incompleto',
  'sealed': 'Lacrado',
  'opened': 'Aberto',
  'perfect': 'Perfeito Estado',
  'good': 'Bom Estado',
  'acceptable': 'Estado Aceitável',
  'poor': 'Estado Ruim',
};

// Product Destination
export const PRODUCT_DESTINATION_TRANSLATIONS: Record<string, string> = {
  'return_to_seller': 'Retorna ao Vendedor',
  'keep_buyer': 'Fica com Comprador',
  'discard': 'Descartar',
  'donate': 'Doar',
  'resale': 'Revenda',
  'warehouse': 'Armazém',
  'under_review': 'Em Análise',
};

// Evidências
export const EVIDENCIAS_TRANSLATIONS: Record<string, string> = {
  'with_evidence': 'Com Evidências',
  'without_evidence': 'Sem Evidências',
  'partial': 'Parcial',
  'images': 'Imagens',
  'videos': 'Vídeos',
  'documents': 'Documentos',
};

/**
 * Função helper para traduzir valores
 */
export function translateValue(
  value: string | null | undefined,
  translationMap: Record<string, string>
): string {
  if (!value) return '-';
  return translationMap[value] || value;
}

/**
 * Traduzir valor de coluna específica
 */
export function translateColumnValue(
  columnId: string,
  value: string | null | undefined
): string {
  if (!value) return '-';

  const translationMaps: Record<string, Record<string, string>> = {
    'metodo_pagamento': METODO_PAGAMENTO_TRANSLATIONS,
    'tipo_pagamento': TIPO_PAGAMENTO_TRANSLATIONS,
    'status_dev': STATUS_DEVOLUCAO_TRANSLATIONS,
    'status_return': STATUS_RETURN_TRANSLATIONS,
    'destino': DESTINO_TRANSLATIONS,
    'evidencias': EVIDENCIAS_TRANSLATIONS,
    'review_stage': REVIEW_STAGE_TRANSLATIONS,
    'review_status': REVIEW_STATUS_TRANSLATIONS,
    'product_condition': PRODUCT_CONDITION_TRANSLATIONS,
    'product_destination': PRODUCT_DESTINATION_TRANSLATIONS,
  };

  const map = translationMaps[columnId];
  return map ? (map[value] || value) : value;
}
