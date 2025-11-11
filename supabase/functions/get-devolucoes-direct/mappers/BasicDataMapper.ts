/**
 * 🎯 MAPEADOR DE DADOS BÁSICOS
 * Consolida: principais, produto, classificação
 */

export const mapBasicData = (item: any, accountId: string, accountName: string, reasonId: string | null) => {
  return {
    // Dados principais
    order_id: item.order_id?.toString() || '',
    claim_id: item.claim_details?.id?.toString() || null,
    integration_account_id: accountId,
    data_criacao: item.claim_details?.date_created || item.date_created || null, // ✅ CORRIGIDO: date_created (nome oficial API ML)
    status_devolucao: item.status || item.claim_details?.status || 'cancelled',
    account_name: accountName,
    marketplace_origem: 'ML_BRASIL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ultima_sincronizacao: new Date().toISOString(),
    dados_incompletos: false,
    fonte_dados_primaria: 'ml_api',
    
    // Dados do produto
    produto_titulo: item.resource_data?.title || item.reason || null,
    sku: item.resource_data?.sku || item.order_data?.order_items?.[0]?.item?.seller_sku || null,
    quantidade: item.resource_data?.quantity || item.order_data?.order_items?.[0]?.quantity || null,
    valor_retido: item.amount || null,
    valor_original_produto: item.order_data?.order_items?.[0]?.unit_price || null,
    
    // Classificação (✅ SEM DUPLICAÇÃO categoria_problema/subcategoria_problema)
    tipo_claim: item.claim_details?.type || null,
    subtipo_claim: item.claim_details?.stage || null, // ✅ stage: claim | dispute | recontact | none | stale
    claim_stage: item.claim_details?.stage || null,
    motivo_categoria: reasonId,
    metodo_resolucao: item.claim_details?.resolution?.type || item.claim_details?.resolution?.reason_id || null,
    resultado_final: item.claim_details?.resolution?.reason || item.claim_details?.resolution?.status || null,
    // ✅ MANTIDO: Nível Prioridade (conforme solicitação)
    nivel_prioridade: item.dados_reasons?.reason_settings?.rules_engine_triage?.[0] || null,
    nivel_complexidade: item.claim_details?.resolution?.benefited ? 'high' : 'medium',
    acao_seller_necessaria: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.action || null,
    proxima_acao_requerida: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.action || null,
    impacto_reputacao: item.claim_details?.type === 'meditations' ? 'high' : 'medium',
    satisfacao_comprador: null,
    feedback_comprador_final: item.claim_details?.resolution?.buyer_satisfaction || null,
    feedback_vendedor: null,
    taxa_satisfacao: null,
    score_satisfacao_final: null,
    
    // ✅ DADOS DE REASON (origem: /claims/reasons/$REASON_ID via dados_reasons)
    // IMPORTANTE: dados_reasons vem do ReasonsService com prefixo "reason_*"
    // Estrutura: { reason_id, reason_name, reason_detail, reason_flow, reason_settings, ... }
    reason_detail: item.dados_reasons?.reason_detail || null,
    reason_flow: item.dados_reasons?.reason_flow || null,
    tipo_problema: item.dados_reasons?.reason_flow || null,
    subtipo_problema: item.dados_reasons?.reason_name || null
  };
};
