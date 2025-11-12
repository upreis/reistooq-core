/**
 * 📊 MAPEADOR DE METADADOS - VERSÃO COMPLETA
 * Extrai TODOS os 3 campos de metadados detalhados de nível superior
 * Mantém flags, qualidade, reputação e SLA
 */

export const mapMetadata = (item: any) => {
  return {
    // ===== FLAGS BÁSICAS (já existentes) =====
    internal_tags: item.order_data?.internal_tags || [],
    tem_financeiro: !!(item.valor_reembolso_total || item.amount),
    tem_review: !!(item.review_id || item.claim_details?.review?.id),
    tem_sla: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ? true : null,
    nota_fiscal_autorizada: item.order_data?.internal_tags?.includes('invoiced') || false,
    
    // Qualidade
    eficiencia_resolucao: item.claim_details?.resolution?.efficiency || 
                         item.claim_details?.resolution?.status || null,
    
    // ===== REPUTAÇÃO DO VENDEDOR (FASE 1) =====
    seller_reputation: item.seller_reputation_data?.seller_reputation || null,
    power_seller_status: item.seller_reputation_data?.power_seller_status || null,
    mercado_lider: item.seller_reputation_data?.mercado_lider_status || false,
    seller_user_type: item.seller_reputation_data?.user_type || null,
    
    // ===== SLA BÁSICO (já existentes) =====
    tempo_primeira_resposta_vendedor: null,
    tempo_resposta_comprador: null,
    tempo_analise_ml: null,
    dias_ate_resolucao: null,
    sla_cumprido: null,
    tempo_limite_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    data_primeira_acao: item.claim_messages?.messages?.[0]?.date_created || item.claim_details?.date_created,
    tempo_total_resolucao: null,
    tempo_resposta_medio: null,
    
    // ===== 🆕 3 CAMPOS DE METADADOS DETALHADOS (nível superior individual) =====
    
    // 1. Usuário Última Ação (de ContextDataMapper - movido para cá)
    usuario_ultima_acao: item.claim_details?.last_updated_by || null,
    
    // 2. Total Evidências (de CommunicationDataMapper - movido para cá)
    total_evidencias: item.attachments?.length || 0,
    
    // 3. Anexos ML (array completo de anexos)
    anexos_ml: item.attachments || []
  };
};
