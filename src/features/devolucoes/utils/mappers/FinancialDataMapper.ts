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
                          parseFloat(item.amount || 0),
    valor_reembolso_produto: orderItem?.unit_price || 0,
    valor_reembolso_frete: payment?.shipping_cost || 0,
    taxa_ml_reembolso: payment?.marketplace_fee || 0,
    data_processamento_reembolso: payment?.date_approved || null,
    metodo_reembolso: payment?.payment_method_id || null,
    moeda_reembolso: item.order_data?.currency_id || 'BRL',
    moeda_custo: 'BRL',
    
    // Custos
    custo_logistico_total: item.return_details_v2?.shipping_cost || 
                          item.return_details_v2?.logistics_cost || 0,
    custo_frete_devolucao: item.return_details_v2?.shipping_cost || null,
    custo_envio_devolucao: item.return_details_v2?.shipping_cost || null,
    impacto_financeiro_vendedor: -(parseFloat(item.amount || 0)),
    responsavel_custo: item.claim_details?.resolution?.benefited?.[0] || null,
    valor_compensacao: item.return_details_v2?.refund_amount || null,
    
    // Pagamento
    metodo_pagamento: payment?.payment_method_id || null,
    tipo_pagamento: payment?.payment_type || null,
    parcelas: payment?.installments || null,
    valor_parcela: payment?.installment_amount || null,
    transaction_id: payment?.id?.toString() || null,
    percentual_reembolsado: 100,
    tags_pedido: item.order_data?.tags || [],
    
    // Descrição detalhada
    descricao_custos: {
      produto: {
        valor_original: orderItem?.unit_price || 0,
        valor_reembolsado: orderItem?.unit_price || 0,
        percentual_reembolsado: 100
      },
      frete: {
        valor_original: payment?.shipping_cost || 0,
        valor_reembolsado: payment?.shipping_cost || 0,
        custo_devolucao: item.return_details_v2?.shipping_cost || 0,
        custo_total_logistica: item.return_details_v2?.shipping_cost || 0
      },
      taxas: {
        taxa_ml_original: payment?.marketplace_fee || 0,
        taxa_ml_reembolsada: payment?.marketplace_fee || 0,
        taxa_ml_retida: 0
      },
      resumo: {
        total_custos: parseFloat(item.amount || 0),
        total_receita_perdida: parseFloat(item.amount || 0)
      }
    }
  };
};
