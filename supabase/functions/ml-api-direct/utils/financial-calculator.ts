/**
 * 💰 FINANCIAL CALCULATOR UTILITY
 * Centraliza todos os cálculos financeiros complexos
 */

/**
 * Calcula dados financeiros detalhados
 * Elimina ~400 linhas de lógica duplicada
 */
export function calculateFinancialData(claimData: any, orderDetail: any) {
  // Extrair dados de pagamento
  const payments = orderDetail?.payments || [];
  const firstPayment = payments[0] || {};
  
  // Calcular valores de reembolso
  const valorReembolsoTotal = firstPayment.transaction_amount_refunded || 0;
  const valorProduto = orderDetail?.total_amount || 0;
  const valorFrete = firstPayment.shipping_cost || 0;
  const valorReembolsoProduto = valorProduto > 0 ? Math.min(valorReembolsoTotal, valorProduto) : 0;
  const valorReembolsoFrete = valorReembolsoTotal > valorReembolsoProduto ? valorReembolsoTotal - valorReembolsoProduto : 0;
  
  // Calcular taxas ML
  const taxaML = orderDetail?.order_items?.[0]?.sale_fee || 0;
  const taxaMLReembolso = valorReembolsoProduto > 0 ? (taxaML / valorProduto) * valorReembolsoProduto : 0;
  
  // Calcular custos logísticos
  const custoEnvioDevolucao = claimData?.return_details_v2?.results?.[0]?.shipping_cost || 
                             claimData?.return_details_v1?.results?.[0]?.shipping_cost || 0;
  const custoEnvioOriginal = valorFrete;
  const custoLogisticoTotal = custoEnvioDevolucao + custoEnvioOriginal;
  
  // Calcular impacto financeiro para o vendedor
  const receitaPerdida = valorProduto;
  const taxasRecuperadas = taxaMLReembolso;
  const custosLogisticos = custoLogisticoTotal;
  const impactoFinanceiroVendedor = -(receitaPerdida - taxasRecuperadas + custosLogisticos);
  
  // Determinar método e moeda de reembolso
  const metodoReembolso = firstPayment.payment_method_id || 'desconhecido';
  const moedaReembolso = firstPayment.currency_id || 'BRL';
  const dataProcessamentoReembolso = firstPayment.date_last_modified || orderDetail?.date_closed;
  
  // Breakdown detalhado de custos
  const descricaoCustos = {
    produto: {
      valor_original: valorProduto,
      valor_reembolsado: valorReembolsoProduto,
      percentual_reembolsado: valorProduto > 0 ? (valorReembolsoProduto / valorProduto * 100).toFixed(2) : 0
    },
    frete: {
      valor_original: valorFrete,
      valor_reembolsado: valorReembolsoFrete,
      custo_devolucao: custoEnvioDevolucao,
      custo_total_logistica: custoLogisticoTotal
    },
    taxas: {
      taxa_ml_original: taxaML,
      taxa_ml_reembolsada: taxaMLReembolso,
      taxa_ml_retida: taxaML - taxaMLReembolso
    },
    resumo: {
      valor_total_reembolsado: valorReembolsoTotal,
      impacto_vendedor: impactoFinanceiroVendedor,
      moeda: moedaReembolso
    }
  };
  
  return {
    valor_reembolso_total: valorReembolsoTotal,
    valor_reembolso_produto: valorReembolsoProduto,
    valor_reembolso_frete: valorReembolsoFrete,
    taxa_ml_reembolso: taxaMLReembolso,
    custo_logistico_total: custoLogisticoTotal,
    impacto_financeiro_vendedor: impactoFinanceiroVendedor,
    moeda_reembolso: moedaReembolso,
    metodo_reembolso: metodoReembolso,
    data_processamento_reembolso: dataProcessamentoReembolso,
    descricao_custos: descricaoCustos
  };
}

/**
 * Calcula custos detalhados de produtos e logística
 */
export function calculateProductCosts(claimData: any, orderDetail: any, shipmentData: any) {
  const item = orderDetail?.order_items?.[0];
  
  return {
    custo_frete_devolucao: shipmentData?.shipping_items?.[0]?.cost || 
                           claimData?.return_details_v2?.results?.[0]?.shipping_cost || null,
    
    custo_logistica_total: (() => {
      const freteDevolucao = shipmentData?.shipping_items?.[0]?.cost || 0;
      const freteOriginal = orderDetail?.shipping?.cost || 0;
      return freteDevolucao + freteOriginal || null;
    })(),
    
    valor_original_produto: item?.full_unit_price || item?.unit_price || null,
    
    valor_reembolsado_produto: claimData?.return_details_v2?.results?.[0]?.refund_amount ||
                               claimData?.return_details_v1?.results?.[0]?.refund_amount || null,
    
    taxa_ml_reembolso: (() => {
      const refundAmount = claimData?.return_details_v2?.results?.[0]?.refund_amount ||
                          claimData?.return_details_v1?.results?.[0]?.refund_amount || 0;
      const originalAmount = orderDetail?.total_amount || 0;
      const taxaPercentual = orderDetail?.payments?.[0]?.marketplace_fee || 0;
      return (refundAmount * taxaPercentual / 100) || null;
    })()
  };
}
