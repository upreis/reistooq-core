/**
 * 🗺 REASON MAPPER
 * Centraliza mapeamento de reasons da API ML
 */

/**
 * Mapeia reason_id para categoria e detalhes
 * Usa dados da API se disponíveis, senão usa mapeamento local como fallback
 */
export function mapReasonWithApiData(
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
  reason_flow: string | null;
} {
  // Se não tem reason_id, retornar tudo null
  if (!reasonId) {
    return {
      reason_id: null,
      reason_category: null,
      reason_name: null,
      reason_detail: null,
      reason_type: null,
      reason_priority: null,
      reason_expected_resolutions: null,
      reason_flow: null
    };
  }
  
  // Extrair prefixo para categorização
  const prefix = reasonId.substring(0, 3);
  
  // Se temos dados da API, usar eles (PRIORIDADE)
  if (apiData) {
    return {
      reason_id: apiData.id || reasonId,
      reason_category: prefix === 'PNR' ? 'not_received' :
                      prefix === 'PDD' ? 'defective_or_different' :
                      prefix === 'CS' ? 'cancellation' : 'other',
      reason_name: apiData.name || null,
      reason_detail: apiData.detail || null,
      reason_type: 'buyer_initiated',
      reason_priority: prefix === 'PNR' || prefix === 'PDD' ? 'high' : 'medium',
      reason_expected_resolutions: apiData.expected_resolutions || null,
      reason_flow: apiData.flow || null
    };
  }
  
  // Fallback: mapeamento genérico por prefixo (quando API falha)
  const fallbackMap: Record<string, any> = {
    'PNR': {
      category: 'not_received',
      name: 'Produto Não Recebido',
      detail: 'O comprador não recebeu o produto',
      priority: 'high'
    },
    'PDD': {
      category: 'defective_or_different',
      name: 'Produto Defeituoso ou Diferente',
      detail: 'Produto veio com defeito ou diferente do anunciado',
      priority: 'high'
    },
    'CS': {
      category: 'cancellation',
      name: 'Cancelamento de Compra',
      detail: 'Cancelamento da compra solicitado',
      priority: 'medium'
    }
  };
  
  const fallback = fallbackMap[prefix] || {
    category: 'other',
    name: 'Outro Motivo',
    detail: 'Outro motivo de reclamação',
    priority: 'medium'
  };
  
  return {
    reason_id: reasonId,
    reason_category: fallback.category,
    reason_name: fallback.name,
    reason_detail: fallback.detail,
    reason_type: 'buyer_initiated',
    reason_priority: fallback.priority,
    reason_expected_resolutions: null,
    reason_flow: null
  };
}
