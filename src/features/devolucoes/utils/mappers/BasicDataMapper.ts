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
    data_criacao: item.claim_details?.created_date || item.created_date || null, // ✅ CORRIGIDO: created_date (não date_created)
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
    
    // Classificação
    tipo_claim: item.type || item.claim_details?.type || null,
    subtipo_claim: item.claim_details?.stage || null, // ✅ stage: claim | dispute | recontact | none | stale
    claim_stage: item.claim_details?.stage || null,
    motivo_categoria: reasonId,
    categoria_problema: item.dados_reasons?.category || null,
    subcategoria_problema: item.dados_reasons?.name || null,
    metodo_resolucao: item.claim_details?.resolution?.type || item.claim_details?.resolution?.reason_id || null,
    resultado_final: item.claim_details?.resolution?.reason || item.claim_details?.resolution?.status || null,
    nivel_prioridade: item.dados_reasons?.settings?.rules_engine_triage?.[0] || null,
    nivel_complexidade: item.claim_details?.resolution?.benefited ? 'high' : 'medium',
    acao_seller_necessaria: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.action || null, // ✅ CORRIGIDO: .action (não .type)
    proxima_acao_requerida: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.action || null, // ✅ CORRIGIDO: .action
    impacto_reputacao: item.claim_details?.type === 'meditations' ? 'high' : 'medium', // ✅ CORRIGIDO: meditations (com T)
    satisfacao_comprador: null,
    feedback_comprador_final: item.claim_details?.resolution?.buyer_satisfaction || null,
    feedback_vendedor: null,
    taxa_satisfacao: null,
    score_satisfacao_final: null
  };
};
