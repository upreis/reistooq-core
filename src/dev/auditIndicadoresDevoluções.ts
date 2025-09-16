/**
 * 🔍 AUDITORIA DOS INDICADORES DE DEVOLUÇÕES
 * 
 * Baseado no PDF "Análise URLs ML - Informações sobre Mensagens, Prazos e Datas"
 * e na estrutura real dos dados do Supabase
 */

export interface IndicadorAuditResult {
  order_id: string;
  claim_data_present: boolean;
  return_data_present: boolean;
  mediation_data_present: boolean;
  attachments_data_present: boolean;
  raw_data_summary: {
    dados_claim_keys: string[];
    dados_return_keys: string[];
    dados_order_keys: string[];
    dados_mensagens_keys: string[];
  };
  recommendations: string[];
}

export function auditarIndicadores(devolucao: any): IndicadorAuditResult {
  const claimData = devolucao.dados_claim || {};
  const orderData = devolucao.dados_order || {};
  const returnData = devolucao.dados_return || {};
  const mensagensData = devolucao.dados_mensagens || {};

  // Extrair chaves dos objetos para debug
  const raw_data_summary = {
    dados_claim_keys: Object.keys(claimData),
    dados_return_keys: Object.keys(returnData),
    dados_order_keys: Object.keys(orderData),
    dados_mensagens_keys: Object.keys(mensagensData)
  };

  // 📋 AUDITORIA CLAIM
  const claim_conditions = {
    has_claim_data: claimData && Object.keys(claimData).length > 0,
    has_mediations: orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0,
    has_claim_id: !!devolucao.claim_id,
    has_reason_code: !!claimData?.reason?.code,
    is_cancellation: claimData?.type === 'cancellation',
    has_cancel_detail: !!orderData?.cancel_detail?.code
  };

  // 📦 AUDITORIA RETURN  
  const return_conditions = {
    has_return_data: returnData && Object.keys(returnData).length > 0,
    has_order_request_return: !!orderData?.order_request?.return,
    has_return_tags: orderData?.tags && Array.isArray(orderData.tags) && 
      (orderData.tags.includes('return') || orderData.tags.includes('refund') || 
       orderData.tags.includes('not_delivered') || orderData.tags.includes('fraud_risk_detected')),
    has_status_devolucao: devolucao.status_devolucao && devolucao.status_devolucao !== 'N/A',
    has_codigo_rastreamento: !!devolucao.codigo_rastreamento
  };

  // ⚖️ AUDITORIA MEDIAÇÃO
  const mediation_conditions = {
    has_order_mediations: orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0,
    has_mediation_details: !!claimData?.mediation_details,
    is_buyer_cancel_express: claimData?.reason?.code === 'buyer_cancel_express',
    is_fraud: claimData?.reason?.code === 'fraud',
    is_buyer_group: claimData?.reason?.group === 'buyer',
    em_mediacao_flag: !!devolucao.em_mediacao,
    has_status_moderacao: !!devolucao.status_moderacao
  };

  // 📎 AUDITORIA ANEXOS/MENSAGENS
  const attachments_conditions = {
    has_claim_attachments: claimData?.attachments && Array.isArray(claimData.attachments) && claimData.attachments.length > 0,
    has_claim_attachments_alt: claimData?.claim_attachments && Array.isArray(claimData.claim_attachments) && claimData.claim_attachments.length > 0,
    has_mensagens_data: mensagensData && Object.keys(mensagensData).length > 0,
    has_timeline_mensagens: devolucao.timeline_mensagens && Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0,
    has_anexos_count: devolucao.anexos_count && devolucao.anexos_count > 0,
    has_numero_interacoes: devolucao.numero_interacoes && devolucao.numero_interacoes > 0,
    has_anexos_comprador: devolucao.anexos_comprador && Array.isArray(devolucao.anexos_comprador) && devolucao.anexos_comprador.length > 0,
    has_anexos_vendedor: devolucao.anexos_vendedor && Array.isArray(devolucao.anexos_vendedor) && devolucao.anexos_vendedor.length > 0,
    has_anexos_ml: devolucao.anexos_ml && Array.isArray(devolucao.anexos_ml) && devolucao.anexos_ml.length > 0
  };

  // Resultados finais
  const claim_data_present = Object.values(claim_conditions).some(Boolean);
  const return_data_present = Object.values(return_conditions).some(Boolean);
  const mediation_data_present = Object.values(mediation_conditions).some(Boolean);
  const attachments_data_present = Object.values(attachments_conditions).some(Boolean);

  // Recomendações baseadas na análise
  const recommendations: string[] = [];

  if (!claim_data_present && orderData?.status === 'cancelled') {
    recommendations.push('📋 CLAIM: Pedido cancelado mas sem dados de claim - verificar endpoint /post-purchase/v1/claims/{claim_id}');
  }

  if (!return_data_present && (orderData?.tags?.includes('not_delivered') || orderData?.tags?.includes('refund'))) {
    recommendations.push('📦 RETURN: Tags indicam devolução mas sem dados - verificar endpoint /post-purchase/v2/claims/{claim_id}/returns');
  }

  if (!mediation_data_present && orderData?.mediations?.length > 0) {
    recommendations.push('⚖️ MEDIAÇÃO: Mediações presentes no order mas não detectadas - verificar estrutura dos dados');
  }

  if (!attachments_data_present && devolucao.claim_id) {
    recommendations.push('📎 ANEXOS: Claim ID presente mas sem anexos/mensagens - verificar endpoints /claims/{claim_id}/messages e /claims/{claim_id}/attachments');
  }

  return {
    order_id: devolucao.order_id,
    claim_data_present,
    return_data_present,
    mediation_data_present,
    attachments_data_present,
    raw_data_summary,
    recommendations
  };
}

// Função para rodar auditoria em lote
export function auditarLoteIndicadores(devolucoes: any[]): {
  summary: {
    total: number;
    claim_detected: number;
    return_detected: number;
    mediation_detected: number;
    attachments_detected: number;
  };
  detailed_results: IndicadorAuditResult[];
  overall_recommendations: string[];
} {
  const detailed_results = devolucoes.map(auditarIndicadores);
  
  const summary = {
    total: devolucoes.length,
    claim_detected: detailed_results.filter(r => r.claim_data_present).length,
    return_detected: detailed_results.filter(r => r.return_data_present).length,
    mediation_detected: detailed_results.filter(r => r.mediation_data_present).length,
    attachments_detected: detailed_results.filter(r => r.attachments_data_present).length
  };

  const overall_recommendations = [
    `📊 ESTATÍSTICAS: ${summary.claim_detected}/${summary.total} claims, ${summary.return_detected}/${summary.total} returns, ${summary.mediation_detected}/${summary.total} mediações, ${summary.attachments_detected}/${summary.total} anexos`,
    '📋 ENDPOINTS PRIORITÁRIOS (baseado no PDF):',
    '  • /post-purchase/v1/claims/{claim_id}/messages - Para mensagens completas',
    '  • /post-purchase/v2/claims/{claim_id}/returns - Para dados de devolução',
    '  • /claims/{claim_id}/attachments - Para anexos/evidências',
    '  • /post-purchase/v1/returns/{return_id}/reviews - Para tempo de revisão',
    '🔧 PRÓXIMOS PASSOS:',
    '  • Implementar busca adicional nos novos endpoints do PDF',
    '  • Enriquecer dados existentes com informações de prazos e datas',
    '  • Adicionar verificação de estimated_exchange_date para trocas'
  ];

  return {
    summary,
    detailed_results,
    overall_recommendations
  };
}

// Função para debug no console
export function debugIndicadores(devolucao: any) {
  const audit = auditarIndicadores(devolucao);
  console.log('🔍 AUDITORIA INDICADORES:', audit);
  return audit;
}