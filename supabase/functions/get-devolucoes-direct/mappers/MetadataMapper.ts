/**
 * 📊 MAPEADOR DE METADADOS - VERSÃO COMPLETA
 * Extrai TODOS os 3 campos de metadados detalhados de nível superior
 * Mantém flags, qualidade, reputação e SLA
 */

export const mapMetadata = (item: any) => {
  const claim = item;
  
  return {
    // ===== FLAGS =====
    internal_tags: claim.order_data?.internal_tags || [],
    tem_financeiro: !!(claim.seller_amount || claim.order_data?.total_amount),
    tem_review: !!(claim.review_details?.id || claim.review?.id),
    tem_sla: !!claim.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date,
    nota_fiscal_autorizada: claim.order_data?.internal_tags?.includes('invoiced') || false,
    
    // Qualidade
    eficiencia_resolucao: claim.resolution?.efficiency || claim.resolution?.status || null,
    
    // ===== REPUTAÇÃO DO VENDEDOR =====
    seller_reputation: claim.seller_reputation_data?.seller_reputation || null,
    power_seller_status: claim.seller_reputation_data?.power_seller_status || null,
    mercado_lider: claim.seller_reputation_data?.mercado_lider_status || false,
    seller_user_type: claim.seller_reputation_data?.user_type || null,
    
    // ===== SLA =====
    tempo_primeira_resposta_vendedor: null,
    tempo_resposta_comprador: null,
    tempo_analise_ml: null,
    dias_ate_resolucao: null,
    sla_cumprido: null,
    tempo_limite_acao: claim.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    data_primeira_acao: claim.claim_messages?.messages?.[0]?.date_created || claim.date_created,
    tempo_total_resolucao: null,
    tempo_resposta_medio: null,
    
    // ===== METADADOS DETALHADOS =====
    usuario_ultima_acao: claim.last_updated_by || null,
    total_evidencias: claim.attachments?.length || 0,
    anexos_ml: claim.attachments || []
  };
};
