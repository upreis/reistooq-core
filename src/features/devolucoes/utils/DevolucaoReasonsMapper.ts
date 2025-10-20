/**
 * 🏷️ MAPEADOR DE REASONS
 * Centraliza lógica de mapeamento de reasons com fallback
 */

const categoryMap: Record<string, any> = {
  'PNR': {
    category: 'not_received',
    name: 'Produto Não Recebido',
    detail: 'O comprador não recebeu o produto',
    type: 'buyer_initiated',
    priority: 'high',
    expected_resolutions: ['refund', 'resend'],
    flow: 'post_purchase'
  },
  'PDD': {
    category: 'defective_or_different',
    name: 'Produto Defeituoso ou Diferente',
    detail: 'Produto veio com defeito ou diferente do anunciado',
    type: 'buyer_initiated',
    priority: 'high',
    expected_resolutions: ['replacement', 'refund', 'repair'],
    flow: 'post_purchase_delivered'
  },
  'CS': {
    category: 'cancellation',
    name: 'Cancelamento de Compra',
    detail: 'Cancelamento da compra solicitado',
    type: 'buyer_initiated',
    priority: 'medium',
    expected_resolutions: ['refund'],
    flow: 'pre_purchase'
  },
  'PD0': {
    category: 'defective_or_different',
    name: 'Produto Defeituoso ou Diferente',
    detail: 'Produto veio com defeito ou diferente do anunciado',
    type: 'buyer_initiated',
    priority: 'high',
    expected_resolutions: ['replacement', 'refund'],
    flow: 'post_purchase_delivered'
  }
};

/**
 * Mapeia reason_id para categoria e detalhes
 * Usa dados da API se disponíveis, senão usa mapeamento local
 */
export const mapReasonWithApiData = (
  reasonId: string | null,
  apiData: any | null
): {
  reason_id: string | null;
  reason_category: string | null;
  reason_name: string | null;
  reason_detail: string | null;
  reason_type: string | null;
  reason_priority: string | null;
  reason_expected_resolutions: string[] | null;
} => {
  if (!reasonId) {
    return {
      reason_id: null,
      reason_category: null,
      reason_name: null,
      reason_detail: null,
      reason_type: null,
      reason_priority: null,
      reason_expected_resolutions: null
    };
  }

  const prefix = reasonId.substring(0, 3);

  // Se temos dados da API, usar eles (PRIORIDADE)
  if (apiData) {
    return {
      reason_id: apiData.id,
      reason_category: prefix === 'PNR' ? 'not_received' :
                      prefix === 'PDD' ? 'defective_or_different' :
                      prefix === 'CS' ? 'cancellation' : 'other',
      reason_name: apiData.name || null,
      reason_detail: apiData.detail || null,
      reason_type: 'buyer_initiated',
      reason_priority: prefix === 'PNR' || prefix === 'PDD' ? 'high' : 'medium',
      reason_expected_resolutions: prefix === 'PNR' ? ['refund', 'resend'] :
                                   prefix === 'PDD' ? ['replacement', 'refund', 'repair'] :
                                   prefix === 'CS' ? ['refund'] : ['contact_seller']
    };
  }

  // Fallback: mapeamento local
  let mapping = categoryMap[prefix];
  if (!mapping && prefix.length >= 2) {
    mapping = categoryMap[prefix.substring(0, 2)];
  }

  if (!mapping) {
    // Fallback genérico
    return {
      reason_id: reasonId,
      reason_category: 'other',
      reason_name: 'Outros Motivos',
      reason_detail: `Motivo não categorizado: ${reasonId}`,
      reason_type: 'buyer_initiated',
      reason_priority: 'medium',
      reason_expected_resolutions: ['contact_seller']
    };
  }

  return {
    reason_id: reasonId,
    reason_category: mapping.category,
    reason_name: mapping.name,
    reason_detail: mapping.detail,
    reason_type: mapping.type,
    reason_priority: mapping.priority,
    reason_expected_resolutions: mapping.expected_resolutions
  };
};
