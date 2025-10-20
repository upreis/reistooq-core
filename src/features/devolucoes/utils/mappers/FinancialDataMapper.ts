/**
 * 💰 MAPEADOR DE DADOS FINANCEIROS
 * Consolida: financeiros e pagamento
 */

export const mapFinancialData = (item: any) => {
  const payment = item.order_data?.payments?.[0];
  const orderItem = item.order_data?.order_items?.[0];
  
  // ✅ CÁLCULOS FINANCEIROS
  const valorOriginalProduto = orderItem?.unit_price || 0;
  const valorReembolsadoProduto = item.claim_details?.resolution?.refund_amount || 
                                  item.return_details_v2?.refund_amount || 
                                  valorOriginalProduto;
  const percentualReembolsado = valorOriginalProduto > 0 
    ? (valorReembolsadoProduto / valorOriginalProduto) * 100 
    : 0;
  
  const valorOriginalFrete = payment?.shipping_cost || 0;
  const custoDevolucao = item.return_details_v2?.shipping_cost || 0;
  
  const taxaMLOriginal = payment?.marketplace_fee || 0;
  const taxaMLReembolsada = taxaMLOriginal * (percentualReembolsado / 100);
  const taxaMLRetida = taxaMLOriginal - taxaMLReembolsada;
  
  const totalCustos = valorReembolsadoProduto + valorOriginalFrete + custoDevolucao;
  const totalReceitaPerdida = valorOriginalProduto - valorReembolsadoProduto;
  
  return {
    // Reembolso
    valor_reembolso_total: valorReembolsadoProduto + valorOriginalFrete,
    valor_reembolso_produto: valorReembolsadoProduto,
    valor_reembolso_frete: valorOriginalFrete,
    taxa_ml_reembolso: taxaMLReembolsada,
    data_processamento_reembolso: payment?.date_approved || null,
    metodo_reembolso: payment?.payment_method_id || null,
    moeda_reembolso: item.order_data?.currency_id || 'BRL',
    moeda_custo: 'BRL',
    
    // Custos
    custo_logistico_total: custoDevolucao,
    custo_frete_devolucao: custoDevolucao,
    custo_envio_devolucao: custoDevolucao,
    impacto_financeiro_vendedor: -(valorReembolsadoProduto + custoDevolucao),
    responsavel_custo: item.claim_details?.resolution?.benefited?.[0] || null,
    valor_compensacao: item.return_details_v2?.refund_amount || null,
    
    // Pagamento
    metodo_pagamento: payment?.payment_method_id || null,
    tipo_pagamento: payment?.payment_type || null,
    parcelas: payment?.installments || null,
    valor_parcela: payment?.installment_amount || null,
    transaction_id: payment?.id?.toString() || null,
    percentual_reembolsado: Math.round(percentualReembolsado),
    tags_pedido: item.order_data?.tags || [],
    
    // Descrição detalhada (COM CÁLCULOS)
    descricao_custos: {
      produto: {
        valor_original: valorOriginalProduto,
        valor_reembolsado: valorReembolsadoProduto,
        percentual_reembolsado: Math.round(percentualReembolsado)
      },
      frete: {
        valor_original: valorOriginalFrete,
        valor_reembolsado: valorOriginalFrete,
        custo_devolucao: custoDevolucao,
        custo_total_logistica: custoDevolucao
      },
      taxas: {
        taxa_ml_original: taxaMLOriginal,
        taxa_ml_reembolsada: taxaMLReembolsada,
        taxa_ml_retida: taxaMLRetida
      },
      resumo: {
        total_custos: totalCustos,
        total_receita_perdida: totalReceitaPerdida
      }
    }
  };
};
