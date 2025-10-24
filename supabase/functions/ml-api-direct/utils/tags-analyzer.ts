/**
 * 🔧 TAGS ANALYZER UTILITY
 * Analisa tags internas e qualidade de comunicação
 */

/**
 * Analisa tags internas e métricas de qualidade
 */
export function analyzeInternalTags(
  claimData: any,
  orderDetail: any,
  shipmentData: any
) {
  return {
    internal_tags: generateInternalTags(claimData, orderDetail, shipmentData),
    tem_financeiro: hasFinancialData(orderDetail, claimData),
    tem_review: hasReview(claimData),
    tem_sla: hasSLA(claimData),
    nota_fiscal_autorizada: hasAuthorizedInvoice(orderDetail),
    qualidade_comunicacao: assessCommunicationQuality(claimData),
    eficiencia_resolucao: assessResolutionEfficiency(claimData)
  };
}

/**
 * Gera tags internas baseadas nos dados
 */
function generateInternalTags(claimData: any, orderDetail: any, shipmentData: any): string[] {
  const tags: string[] = [];
  
  // Tag de status
  if (claimData?.status === 'closed' || claimData?.resolution?.type) {
    tags.push('resolved');
  }
  
  // Tag de mediação
  if (claimData?.mediation_details?.mediator_id) {
    tags.push('mediated');
  }
  
  // Tag de troca
  if (claimData?.is_exchange || claimData?.return_details_v2?.results?.[0]?.subtype?.includes('change')) {
    tags.push('exchange');
  }
  
  // Tag de reembolso
  if (claimData?.return_details_v2?.results?.[0]?.refund || claimData?.return_details_v1?.results?.[0]?.refund) {
    tags.push('refund');
  }
  
  // Tag de envio
  if (shipmentData || orderDetail?.shipping) {
    tags.push('has_shipping');
  }
  
  return tags;
}

/**
 * Verifica se tem dados financeiros
 */
function hasFinancialData(orderDetail: any, claimData: any): boolean {
  return !!(
    orderDetail?.payments?.[0] ||
    orderDetail?.total_amount ||
    claimData?.return_details_v2?.results?.[0]?.refund ||
    claimData?.return_details_v1?.results?.[0]?.refund
  );
}

/**
 * Verifica se tem review
 */
function hasReview(claimData: any): boolean {
  return !!(
    claimData?.return_details_v2?.results?.[0]?.reviews ||
    claimData?.return_details_v1?.results?.[0]?.reviews
  );
}

/**
 * Verifica se tem SLA
 */
function hasSLA(claimData: any): boolean {
  return !!(
    claimData?.sla_metrics ||
    claimData?.claim_details?.deadline ||
    claimData?.mediation_details?.deadline
  );
}

/**
 * Verifica se tem nota fiscal autorizada
 */
function hasAuthorizedInvoice(orderDetail: any): boolean {
  return !!(
    orderDetail?.invoice?.status === 'authorized' ||
    orderDetail?.invoice?.authorized
  );
}

/**
 * Avalia qualidade da comunicação
 */
function assessCommunicationQuality(claimData: any): string | null {
  const messages = claimData?.claim_messages?.messages || [];
  
  if (messages.length === 0) return 'none';
  if (messages.length <= 2) return 'fair';
  if (messages.length <= 5) return 'good';
  return 'excellent';
}

/**
 * Avalia eficiência de resolução
 */
function assessResolutionEfficiency(claimData: any): string | null {
  // ✅ CORRIGIDO: date_created (nome oficial API ML conforme PDF)
  if (!claimData?.date_created || !claimData?.resolution?.date_created) return null;
  
  const created = new Date(claimData.date_created).getTime();
  const resolved = new Date(claimData.resolution.date_created).getTime();
  const diffDays = Math.floor((resolved - created) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 2) return 'fast';
  if (diffDays <= 7) return 'normal';
  return 'slow';
}
