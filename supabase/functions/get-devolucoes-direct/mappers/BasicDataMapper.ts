/**
 * 🎯 MAPEADOR DE DADOS BÁSICOS
 * Consolida: principais, produto, classificação
 */

export const mapBasicData = (item: any, accountId: string, accountName: string, reasonId: string | null) => {
  const claim = item;
  
  return {
    // Dados principais
    order_id: claim.resource_id?.toString() || claim.order_id?.toString() || '',
    claim_id: claim.id?.toString() || null,
    integration_account_id: accountId,
    data_criacao: claim.date_created || null,
    status_devolucao: claim.status || 'cancelled',
    account_name: accountName,
    marketplace_origem: 'ML_BRASIL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ultima_sincronizacao: new Date().toISOString(),
    dados_incompletos: false,
    fonte_dados_primaria: 'ml_api',
    
    // Data da venda original
    data_venda_original: claim.order_data?.date_created || null,
    
    // Dados do produto
    produto_titulo: claim.product_info?.title || claim.reason || null,
    sku: claim.product_info?.sku || claim.order_data?.order_items?.[0]?.item?.seller_sku || null,
    quantidade: claim.order_data?.order_items?.[0]?.quantity || claim.quantity || 1,
    valor_retido: claim.seller_amount || null,
    valor_original_produto: claim.order_data?.order_items?.[0]?.unit_price || null,
    
    // Classificação
    tipo_claim: claim.type || null,
    subtipo_claim: claim.stage || null,
    claim_stage: claim.stage || null,
    motivo_categoria: reasonId,
    metodo_resolucao: claim.resolution?.type || claim.resolution?.reason_id || null,
    resultado_final: claim.resolution?.reason || claim.resolution?.status || null,
    nivel_prioridade: claim.dados_reasons?.reason_settings?.rules_engine_triage?.[0] || null,
    nivel_complexidade: claim.resolution?.benefited ? 'high' : 'medium',
    acao_seller_necessaria: claim.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.action || null,
    proxima_acao_requerida: claim.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.action || null,
    impacto_reputacao: claim.type === 'meditations' ? 'high' : 'medium',
    satisfacao_comprador: null,
    feedback_comprador_final: claim.resolution?.buyer_satisfaction || null,
    feedback_vendedor: null,
    taxa_satisfacao: null,
    score_satisfacao_final: null,
    
    // Dados de Reason
    reason_detail: claim.dados_reasons?.reason_detail || null,
    reason_flow: claim.dados_reasons?.reason_flow || null,
    tipo_problema: claim.dados_reasons?.reason_flow || null,
    subtipo_problema: claim.dados_reasons?.reason_name || null,
    
    // Entidades relacionadas
    entidades_relacionadas: {
      comprador_id: claim.players?.find((p: any) => p.role === 'claimant')?.user_id?.toString() || null,
      vendedor_id: claim.players?.find((p: any) => p.role === 'respondent')?.user_id?.toString() || null,
      mediador_id: claim.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null
    }
  };
};
