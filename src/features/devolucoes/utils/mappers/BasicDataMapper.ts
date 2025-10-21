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
    data_criacao: item.date_created || null,
    status_devolucao: item.status || 'cancelled',
    account_name: accountName,
    marketplace_origem: 'ML_BRASIL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ultima_sincronizacao: new Date().toISOString(),
    dados_incompletos: false,
    campos_faltantes: [],
    fonte_dados_primaria: 'ml_api',
    
    // Dados do produto
    produto_titulo: item.resource_data?.title || item.reason || null,
    sku: item.resource_data?.sku || item.order_data?.order_items?.[0]?.item?.seller_sku || null,
    quantidade: item.resource_data?.quantity || item.order_data?.order_items?.[0]?.quantity || null,
    valor_retido: item.amount || null,
    valor_original_produto: item.order_data?.order_items?.[0]?.unit_price || null,
    
    // Classificação
    tipo_claim: item.type || item.claim_details?.type,
    subtipo_claim: item.claim_details?.stage || null,
    motivo_categoria: reasonId,
    categoria_problema: null,
    subcategoria_problema: null,
    metodo_resolucao: item.claim_details?.resolution?.reason || null,
    resultado_final: item.claim_details?.status || null,
    nivel_prioridade: null,
    nivel_complexidade: null,
    acao_seller_necessaria: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions || null,
    proxima_acao_requerida: null,
    impacto_reputacao: null,
    satisfacao_comprador: null,
    feedback_comprador_final: null,
    feedback_vendedor: null,
    taxa_satisfacao: null,
    score_satisfacao_final: null
  };
};
