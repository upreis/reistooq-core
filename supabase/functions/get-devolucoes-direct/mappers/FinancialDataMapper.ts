/**
 * 💰 MAPEADOR DE DADOS FINANCEIROS - VERSÃO COMPLETA
 * Extrai TODOS os 9 campos financeiros detalhados de nível superior
 * Elimina objetos JSONB aninhados - apenas campos individuais
 */

export const mapFinancialData = (item: any) => {
  // ✅ ACESSO DIRETO ao claim sem depender de nested objects
  const claim = item;  // item já É o claim completo
  const payment = claim.order_data?.payments?.[0];
  const orderItem = claim.order_data?.order_items?.[0];
  
  // ✅ PRIORIDADE: seller_amount é o valor principal do claim
  const reembolsado = claim.seller_amount || claim.resolution?.refund_amount || claim.order_data?.total_amount;
  const total = claim.order_data?.total_amount || claim.seller_amount;
  
  return {
    // ===== CAMPOS FINANCEIROS BÁSICOS =====
    valor_reembolso_total: reembolsado || null,
    valor_reembolso_produto: orderItem?.unit_price || null,
    valor_reembolso_frete: payment?.shipping_cost || null,
    taxa_ml_reembolso: payment?.marketplace_fee || null,
    data_processamento_reembolso: payment?.date_approved || null,
    moeda_custo: claim.order_data?.currency_id || null,
    
    // Responsável pelo custo
    responsavel_custo: (() => {
      const benefited = claim.resolution?.benefited;
      if (Array.isArray(benefited) && benefited.length > 0) return benefited[0];
      return benefited || claim.resolution?.responsible || null;
    })(),
    
    // Data de reembolso - usar return_details se existir
    data_reembolso: claim.return_details?.refund_at || null,
    
    // 💰 FASE 1: Data estimada de reembolso (expectativa do vendedor)
    data_estimada_reembolso: (() => {
      // Se já foi reembolsado, retornar data real
      if (claim.return_details?.refund_at) return claim.return_details.refund_at;
      
      // Senão, estimar: prazo de análise + 7 dias úteis
      const prazo = claim.return_details?.estimated_handling_limit?.date;
      if (prazo) {
        const estimativa = new Date(prazo);
        estimativa.setDate(estimativa.getDate() + 7);
        return estimativa.toISOString();
      }
      return null;
    })(),
    
    // Pagamento básico
    metodo_pagamento: payment?.payment_method_id || null,
    tipo_pagamento: payment?.payment_type || null,
    transaction_id: payment?.id?.toString() || null,
    tags_pedido: item.order_data?.tags || [],
    
    // ===== CAMPOS FINANCEIROS DETALHADOS =====
    
    // Status financeiro do reembolso
    status_dinheiro: claim.return_details?.money_status || claim.resolution?.money_status || null,
    
    // Método de reembolso
    metodo_reembolso: payment?.payment_method_id || claim.resolution?.payment_method || null,
    
    // Moeda
    moeda_reembolso: claim.order_data?.currency_id || claim.currency_id || 'BRL',
    
    // Percentual reembolsado
    percentual_reembolsado: (total && reembolsado) ? Math.round((reembolsado / total) * 100) : null,
    
    // Diferença de troca
    valor_diferenca_troca: claim.resolution?.exchange_difference || claim.change_details?.price_difference || null,
    
    // Taxa ML reembolsada
    taxa_ml_reembolsada: payment?.marketplace_fee || null,
    
    // Custo de devolução
    custo_devolucao: claim.shipping_costs_enriched?.net_cost || 
                     claim.return_details?.shipping_cost || null,
    
    // ✅ CUSTOS LOGÍSTICOS COMPLETOS (para CustosLogisticaCell)
    custo_total_logistica: claim.shipping_costs_enriched?.total_cost || null,
    custo_envio_original: claim.shipping_costs_enriched?.total_receiver_cost || null,
    responsavel_custo_frete: claim.shipping_costs_enriched?.responsavel_custo || null,
    
    // ✅ BREAKDOWN DETALHADO (para tooltip)
    shipping_fee: claim.shipping_costs_enriched?.cost_breakdown?.shipping_fee || null,
    handling_fee: claim.shipping_costs_enriched?.cost_breakdown?.handling_fee || null,
    insurance: claim.shipping_costs_enriched?.cost_breakdown?.insurance || null,
    taxes: claim.shipping_costs_enriched?.cost_breakdown?.taxes || null,
    
    // Parcelas
    parcelas: payment?.installments || null,
    valor_parcela: payment?.installment_amount || null
  };
};
