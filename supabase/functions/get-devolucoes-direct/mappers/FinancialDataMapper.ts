/**
 * 💰 MAPEADOR DE DADOS FINANCEIROS - VERSÃO COMPLETA
 * Extrai TODOS os 9 campos financeiros detalhados de nível superior
 * Elimina objetos JSONB aninhados - apenas campos individuais
 */

export const mapFinancialData = (item: any) => {
  const payment = item.order_data?.payments?.[0];
  const orderItem = item.order_data?.order_items?.[0];
  
  // Calcular total e reembolsado para percentual
  const total = item.order_data?.total_amount || item.amount;
  const reembolsado = item.claim_details?.resolution?.refund_amount || item.return_details_v2?.refund_amount;
  
  return {
    // ===== CAMPOS FINANCEIROS BÁSICOS (já existentes) =====
    valor_reembolso_total: reembolsado || null,
    valor_reembolso_produto: orderItem?.unit_price || null,
    valor_reembolso_frete: payment?.shipping_cost || null,
    taxa_ml_reembolso: payment?.marketplace_fee || null,
    data_processamento_reembolso: payment?.date_approved || null,
    moeda_custo: null,
    
    // Responsável pelo custo - benefited pode ser array
    responsavel_custo: (() => {
      const benefited = item.claim_details?.resolution?.benefited;
      const responsible = item.claim_details?.resolution?.responsible;
      
      if (Array.isArray(benefited) && benefited.length > 0) {
        return benefited[0];
      }
      
      return benefited || responsible || null;
    })(),
    
    // Data de reembolso
    data_reembolso: item.return_details_v2?.refund_at || null,
    
    // Data estimada de reembolso
    data_estimada_reembolso: (() => {
      if (item.return_details_v2?.refund_at) {
        return item.return_details_v2.refund_at;
      }
      
      const prazo = item.return_details_v2?.estimated_handling_limit?.date;
      if (prazo) {
        const prazoDate = new Date(prazo);
        prazoDate.setDate(prazoDate.getDate() + 7);
        return prazoDate.toISOString();
      }
      
      return null;
    })(),
    
    // Pagamento básico
    metodo_pagamento: payment?.payment_method_id || null,
    tipo_pagamento: payment?.payment_type || null,
    transaction_id: payment?.id?.toString() || null,
    tags_pedido: item.order_data?.tags || [],
    
    // ===== 🆕 9 CAMPOS FINANCEIROS DETALHADOS (nível superior individual) =====
    
    // 1. Status $ (money_status)
    status_dinheiro: item.return_details_v2?.money_status || null,
    
    // 2. Método Reembolso
    metodo_reembolso: payment?.payment_method_id || null,
    
    // 3. Moeda Reembolso
    moeda_reembolso: item.order_data?.currency_id || 'BRL',
    
    // 4. % Reembolsado (calculado)
    percentual_reembolsado: (total && reembolsado) ? ((reembolsado / total) * 100) : null,
    
    // 5. Valor Diferença Troca
    valor_diferenca_troca: item.claim_details?.resolution?.exchange_difference || null,
    
    // 6. Taxa ML Reembolsada (mesma que original - API ML não diferencia)
    taxa_ml_reembolsada: payment?.marketplace_fee || null,
    
    // 7. Custo Devolução (enriquecido de shipping_costs_enriched)
    custo_devolucao: item.shipping_costs_enriched?.return_costs?.net_cost || 
                     item.return_details_v2?.shipping_cost || null,
    
    // 8. Parcelas
    parcelas: payment?.installments || null,
    
    // 9. Valor Parcela
    valor_parcela: payment?.installment_amount || null,
    
    // ===== CAMPOS PARA SHIPPING COSTS (usados por CustosLogisticaCell) =====
    shipping_costs: item.shipping_costs_enriched || null
  };
};
