/**
 * 📊 MAPEADOR DE METADADOS
 * Consolida: flags, qualidade, reputação, SLA
 */

export const mapMetadata = (item: any) => {
  return {
    // Flags
    internal_tags: item.order_data?.internal_tags || [],
    tem_financeiro: !!(item.valor_reembolso_total || item.amount),
    tem_review: !!(item.review_id || item.claim_details?.review?.id),
    tem_sla: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ? true : null,
    nota_fiscal_autorizada: item.order_data?.internal_tags?.includes('invoiced') || false,
    
    // Qualidade
    eficiencia_resolucao: item.claim_details?.resolution?.efficiency || 
                         item.claim_details?.resolution?.status || null,
    
    // SLA
    tempo_primeira_resposta_vendedor: null,
    tempo_resposta_comprador: null,
    tempo_analise_ml: null,
    dias_ate_resolucao: null,
    sla_cumprido: null,
    tempo_limite_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    data_primeira_acao: item.claim_messages?.messages?.[0]?.date_created || item.claim_details?.date_created, // ✅ CORRIGIDO: date_created (nome oficial API ML)
    tempo_total_resolucao: null,
    tempo_resposta_medio: null
  };
};
