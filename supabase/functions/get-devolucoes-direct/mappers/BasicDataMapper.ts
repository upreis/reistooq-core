/**
 * 🎯 MAPEADOR DE DADOS BÁSICOS
 * Consolida: principais, produto, classificação
 */

export const mapBasicData = (item: any, accountId: string, accountName: string, reasonId: string | null) => {
  const claim = item;
  
  // 🐛 DEBUG: Log dados básicos recebidos
  console.log('🎯 BasicDataMapper - Dados recebidos:', JSON.stringify({
    claim_id: claim.id,
    has_product_info: !!claim.product_info,
    has_order_data: !!claim.order_data,
    has_shipping: !!claim.order_data?.shipping,
    product_title: claim.product_info?.title?.substring(0, 50),
    sku: claim.product_info?.sku || claim.order_data?.order_items?.[0]?.item?.seller_sku,
    logistic_type: claim.order_data?.shipping?.logistic_type,
    subtipo_claim: claim.return_details?.subtype || claim.stage,
    return_subtype: claim.return_details?.subtype,
    claim_stage: claim.stage
  }));
  
  // ✅ CORREÇÃO: Buscar status correto da devolução
  const returnData = claim.return_details_v2 || claim.return_details;
  const statusDevolucao = returnData?.status || claim.status || 'cancelled';
  
  // 🐛 DEBUG: Log para entender por que só vem cancelled
  console.log(`🔍 [BasicDataMapper] Claim ${claim.id}:`, JSON.stringify({
    claim_status: claim.status,
    claim_type: claim.type,
    has_return_details_v2: !!claim.return_details_v2,
    has_return_details: !!claim.return_details,
    return_status: returnData?.status,
    return_subtype: returnData?.subtype,
    status_final: statusDevolucao
  }));
  
  return {
    // Dados principais
    order_id: claim.resource_id?.toString() || claim.order_id?.toString() || '',
    claim_id: claim.id?.toString() || null,
    integration_account_id: accountId,
    data_criacao: claim.date_created || null,
    status_devolucao: statusDevolucao,
    account_name: accountName,
    marketplace_origem: 'ML_BRASIL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ultima_sincronizacao: new Date().toISOString(),
    dados_incompletos: false,
    fonte_dados_primaria: 'ml_api',
    
    // 📅 FASE 1: Data da venda original (quando foi feita a compra)
    data_venda_original: claim.order_data?.date_created || null,
    
    // Dados do produto
    produto_titulo: claim.product_info?.title || claim.reason || null,
    sku: claim.product_info?.sku || claim.order_data?.order_items?.[0]?.item?.seller_sku || null,
    quantidade: claim.order_data?.order_items?.[0]?.quantity || claim.quantity || 1,
    valor_retido: claim.seller_amount || null,
    valor_original_produto: claim.order_data?.order_items?.[0]?.unit_price || null,
    
    // 🚚 TIPO DE LOGÍSTICA - BUSCAR DO SHIPMENT_DATA (venda original)
    // Prioridade: shipment_data.logistic_type (venda) > order_data.shipping.logistic_type
    tipo_logistica: claim.shipment_data?.logistic_type || 
                    claim.order_data?.shipping?.logistic_type || 
                    claim.shipping?.logistic?.type || 
                    claim.shipping?.logistic_type || 
                    null,
    
    // Classificação
    tipo_claim: claim.type || null,
    // ✅ CORREÇÃO: Priorizar return_details.subtype (low_cost, return_partial, return_total) 
    // sobre claim.stage conforme documentação oficial ML
    subtipo_claim: claim.return_details?.subtype || claim.stage || null,
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
    
    // 👥 FASE 1: Entidades relacionadas (rastreabilidade completa)
    entidades_relacionadas: {
      comprador_id: claim.players?.find((p: any) => p.role === 'claimant')?.user_id?.toString() || null,
      vendedor_id: claim.players?.find((p: any) => p.role === 'respondent')?.user_id?.toString() || null,
      mediador_id: claim.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
      order_id: claim.resource_id?.toString() || null,
      claim_id: claim.id?.toString() || null,
      return_id: claim.return_details?.id?.toString() || null
    }
  };
  
  // 🐛 DEBUG: Log campos extraídos
  const result = {
    produto_titulo: claim.product_info?.title || claim.reason || null,
    sku: claim.product_info?.sku || claim.order_data?.order_items?.[0]?.item?.seller_sku || null,
    quantidade: claim.order_data?.order_items?.[0]?.quantity || claim.quantity || 1
  };
  
  console.log('🎯 BasicDataMapper - Campos extraídos:', JSON.stringify({
    claim_id: claim.id,
    produto_titulo: result.produto_titulo?.substring(0, 50),
    sku: result.sku,
    quantidade: result.quantidade
  }));
  
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
    
    // 📅 FASE 1: Data da venda original (quando foi feita a compra)
    data_venda_original: claim.order_data?.date_created || null,
    
    // Dados do produto
    produto_titulo: result.produto_titulo,
    sku: result.sku,
    quantidade: result.quantidade,
    valor_retido: claim.seller_amount || null,
    valor_original_produto: claim.order_data?.order_items?.[0]?.unit_price || null,
    
    // 🚚 TIPO DE LOGÍSTICA - PRIORIZAR claim.shipping (já no claim principal)
    tipo_logistica: claim.shipping?.logistic_type || 
                    claim.order_data?.shipping?.logistic_type || null,
    
    // Classificação
    tipo_claim: claim.type || null,
    // ✅ CORREÇÃO: Priorizar return_details.subtype (low_cost, return_partial, return_total) 
    // sobre claim.stage conforme documentação oficial ML
    subtipo_claim: claim.return_details?.subtype || claim.stage || null,
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
    
    // 👥 FASE 1: Entidades relacionadas (rastreabilidade completa)
    entidades_relacionadas: {
      comprador_id: claim.players?.find((p: any) => p.role === 'claimant')?.user_id?.toString() || null,
      vendedor_id: claim.players?.find((p: any) => p.role === 'respondent')?.user_id?.toString() || null,
      mediador_id: claim.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
      order_id: claim.resource_id?.toString() || null,
      claim_id: claim.id?.toString() || null,
      return_id: claim.return_details?.id?.toString() || null
    }
  };
};
