/**
 * 💰 MAPEADOR DE DADOS FINANCEIROS
 * Consolida: financeiros e pagamento
 */

export const mapFinancialData = (item: any) => {
  const payment = item.order_data?.payments?.[0];
  const orderItem = item.order_data?.order_items?.[0];
  
  return {
    // Reembolso
    valor_reembolso_total: item.claim_details?.resolution?.refund_amount || 
                          item.return_details_v2?.refund_amount ||
                          item.amount || null,
    valor_reembolso_produto: orderItem?.unit_price || null,
    valor_reembolso_frete: payment?.shipping_cost || null,
    taxa_ml_reembolso: payment?.marketplace_fee || null,
    data_processamento_reembolso: payment?.date_approved || null,
    metodo_reembolso: payment?.payment_method_id || null,
    moeda_reembolso: item.order_data?.currency_id || null,
    moeda_custo: null,
    
    // ✅ CORRIGIDO: benefited é STRING simples ('complainant' | 'respondent'), não array
    responsavel_custo: item.claim_details?.resolution?.benefited || 
                      item.claim_details?.resolution?.responsible || null,
    
    // Pagamento
    metodo_pagamento: payment?.payment_method_id || null,
    tipo_pagamento: payment?.payment_type || null,
    parcelas: payment?.installments || null,
    valor_parcela: payment?.installment_amount || null,
    transaction_id: payment?.id?.toString() || null,
    percentual_reembolsado: null,
    tags_pedido: item.order_data?.tags || [],
    
    // Descrição detalhada
    descricao_custos: {
      produto: {
        valor_original: orderItem?.unit_price || null,
        valor_reembolsado: orderItem?.unit_price || null,
        percentual_reembolsado: null
      },
      frete: {
        valor_original: payment?.shipping_cost || null,
        valor_reembolsado: payment?.shipping_cost || null,
        custo_devolucao: item.return_details_v2?.shipping_cost || null,
        custo_total_logistica: item.return_details_v2?.shipping_cost || null
      },
      taxas: {
        taxa_ml_original: payment?.marketplace_fee || null,
        taxa_ml_reembolsada: payment?.marketplace_fee || null,
        taxa_ml_retida: null
      },
      resumo: {
        total_custos: item.amount || null,
        total_receita_perdida: item.amount || null
      }
    }
  };
};
