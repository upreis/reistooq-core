/**
 * 🔧 FIELD EXTRACTOR UTILITY
 * Elimina ~500 linhas de código duplicado de fallback patterns
 */

/**
 * Busca um valor seguindo múltiplos caminhos possíveis
 * Elimina a duplicação de (() => { value || value2 || value3 })() 
 */
export function getValueWithFallback(obj: any, paths: string[]): any {
  for (const path of paths) {
    const value = path.split('.').reduce((o, k) => o?.[k], obj);
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
}

/**
 * Extrai dados do comprador de forma consolidada
 * Usado em 4 lugares diferentes - agora centralizado
 */
export function extractBuyerData(orderDetail: any) {
  if (!orderDetail?.buyer) return {
    cpf_cnpj: null,
    nome_completo: null,
    nickname: null
  };

  return {
    cpf_cnpj: orderDetail.buyer.billing_info?.doc_number || null,
    nome_completo: `${orderDetail.buyer.first_name || ''} ${orderDetail.buyer.last_name || ''}`.trim() || null,
    nickname: orderDetail.buyer.nickname || null
  };
}

/**
 * Extrai dados de pagamento
 * Usado em múltiplos lugares
 */
export function extractPaymentData(orderDetail: any) {
  const payment = orderDetail?.payments?.[0];
  if (!payment) return {
    metodo_pagamento: null,
    tipo_pagamento: null,
    numero_parcelas: null,
    valor_parcela: null,
    transaction_id: null
  };

  return {
    metodo_pagamento: payment.payment_method_id || null,
    tipo_pagamento: payment.payment_type || null,
    numero_parcelas: payment.installments || null,
    valor_parcela: payment.installment_amount || null,
    transaction_id: payment.transaction_id || null
  };
}

/**
 * Calcula percentual de reembolso
 * Usado em múltiplos lugares com lógica duplicada
 */
export function calculateRefundPercentage(claimData: any, orderDetail: any): number | null {
  // Tentar extrair de múltiplas fontes
  const fromRefund = claimData?.return_details_v2?.results?.[0]?.refund?.percentage ||
                     claimData?.return_details_v1?.results?.[0]?.refund?.percentage;
  if (fromRefund) return fromRefund;
  
  // Calcular baseado em valores
  const totalAmount = orderDetail?.total_amount || 0;
  const refundAmount = claimData?.return_details_v2?.results?.[0]?.refund_amount ||
                       claimData?.return_details_v1?.results?.[0]?.refund_amount || 0;
  
  if (totalAmount > 0 && refundAmount > 0) {
    return Math.round((refundAmount / totalAmount) * 100);
  }
  
  return null;
}
