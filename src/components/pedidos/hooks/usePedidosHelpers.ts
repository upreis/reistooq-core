/**
 * 🔧 FASE 4.1: Helpers Financeiros e Cálculos de Pedidos
 * Extraído de SimplePedidosPage para reduzir complexidade
 * 
 * ✅ GARANTIA: Apenas lógica de cálculo pura, sem chamadas à API
 */

/**
 * Calcular receita por envio (Flex) - REGRA SIMPLES
 */
export const getReceitaPorEnvio = (order: any): number => {
  // 🔧 HELPER: Processar flex_order_cost - TEMPORARIAMENTE DESABILITADO
  const getFlexOrderCostProcessed = (order: any): number => {
    const flexCostOriginal = order?.flex_order_cost || order?.unified?.flex_order_cost || 0;
    // ⚠️ CÁLCULO DESABILITADO: Retornando valor bruto da API
    return flexCostOriginal;
  };
  
  // Detectar o tipo logístico
  const rawType =
    order?.shipping?.logistic?.type ??
    order?.raw?.shipping?.logistic?.type ??
    order?.logistic_type ??
    order?.shipping_details?.logistic_type ??
    order?.unified?.logistic?.type ??
    order?.flex_logistic_type ??
    order?.logistic?.type;

  const logisticType = String(rawType || '').toLowerCase();
  
  // Se não for 'self_service' (Envios Flex), retornar 0
  if (logisticType !== 'self_service') {
    return 0;
  }
  
  // ✅ NOVA REGRA: Usar Flex: Desconto Especial + condições
  const flexSpecialDiscount = order.flex_special_discount || order.unified?.flex_special_discount || 0;
  const flexNetCost = order.flex_net_cost || order.unified?.flex_net_cost || 0;
  
  // Valores específicos que devem ser usados diretamente
  const valoresEspecificos = [8.90, 8.99, 13.90, 13.99, 15.90, 15.99];
  
  // Determinar a base do cálculo
  const flexOrderCostBase = valoresEspecificos.includes(flexSpecialDiscount) 
    ? flexSpecialDiscount 
    : flexSpecialDiscount + flexNetCost;
  
  // Se não houver valor, retornar 0
  if (flexOrderCostBase <= 0) {
    return 0;
  }
  
  // ✅ NOVA LÓGICA: Verificar Valor Médio por Item PRIMEIRO
  const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || order.unified?.total_amount || 0;
  const quantidadeTotal = order.quantidade_total || 1;
  const valorMedioPorItem = valorTotal / quantidadeTotal;
  
  // Se Valor Médio por Item < 79.00 → usar cálculo normal (100%)
  if (valorMedioPorItem < 79.00) {
    return flexOrderCostBase;
  }
  
  // Se Valor Médio por Item >= 79.00 → verificar todas as outras condições
  const conditionRaw = order.unified?.conditions || order.raw?.items?.[0]?.item?.condition || order.conditions || order.condition || order.unified?.condition || '';
  const condition = String(conditionRaw).toLowerCase();
  
  // ✅ CORRIGIDO: Buscar reputation em TODOS os lugares possíveis
  const reputationRaw = order.level_id || 
                       order.seller_reputation?.level_id || 
                       order.unified?.seller_reputation?.level_id ||
                       order.sellerReputation?.level_id ||
                       order.raw?.seller_reputation?.level_id ||
                       order.raw?.sellerReputation?.level_id ||
                       '';
  const reputation = String(reputationRaw).toLowerCase();
  
  const medalha = order.power_seller_status || 
                 order.unified?.power_seller_status || 
                 order.raw?.power_seller_status ||
                 order.raw?.seller_reputation?.power_seller_status ||
                 order.raw?.sellerReputation?.power_seller_status ||
                 order.seller_reputation?.power_seller_status ||
                 order.unified?.seller_reputation?.power_seller_status ||
                 null;
  
  // ✅ REGRA OFICIAL ML: Acima R$ 79 SÓ recebe bônus se tiver qualificações
  // Se TODAS as condições forem atendidas → aplicar 10%
  // Se NÃO tiver qualificações → R$ 0,00 (sem bônus)
  const cumpreCondicoes = condition === 'new' && reputation.includes('green');
  const percentualAplicado = cumpreCondicoes ? 0.1 : 0;
  const valorFinal = flexOrderCostBase * percentualAplicado;
  
  // ✅ Retornar valor calculado (0% ou 10% conforme qualificações)
  return valorFinal;
};

/**
 * Calcular valor líquido do vendedor
 */
export const getValorLiquidoVendedor = (order: any): number => {
  if (typeof order?.valor_liquido_vendedor === 'number') return order.valor_liquido_vendedor;

  // ✅ NOVA REGRA: Baseado no Tipo Logístico
  const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || order.unified?.total_amount || 0;
  
  // Calcular Receita Flex usando a função getReceitaPorEnvio
  const receitaFlex = getReceitaPorEnvio(order);
  
  const taxaMarketplace = order.order_items?.[0]?.sale_fee || order.raw?.order_items?.[0]?.sale_fee || order.marketplace_fee || order.fees?.[0]?.value || order.raw?.fees?.[0]?.value || 0;
  const custoEnvioSeller = order.custo_envio_seller || order.unified?.custo_envio_seller || order.shipping?.costs?.senders?.[0]?.cost || order.raw?.shipping?.costs?.senders?.[0]?.cost || 0;
  
  // Determinar tipo logístico
  const rawType = order?.tipo_logistico || 
                 order?.unified?.tipo_logistico || 
                 order?.shipping?.logistic_type || 
                 order?.raw?.shipping?.logistic_type ||
                 order?.shipping?.logistic?.type ||
                 order?.unified?.shipping?.logistic?.type ||
                 order?.logistic_type ||
                 order?.flex_logistic_type ||
                 '';
  const tipoLogistico = String(rawType).toLowerCase();
  
  // Se for "self_service" (Envios Flex): Valor Total + Receita Flex - Taxa Marketplace
  // Se não for Flex: Valor Total + Receita Flex - Taxa Marketplace - Custo Envio Seller
  const isFlex = tipoLogistico === 'self_service' || tipoLogistico.includes('flex');
  const valorLiquido = isFlex 
    ? valorTotal + receitaFlex - taxaMarketplace
    : valorTotal + receitaFlex - taxaMarketplace - custoEnvioSeller;

  return valorLiquido;
};

/**
 * Calcular estatísticas das contas ML
 */
export const getAccountsStats = (accounts: any[]) => {
  if (!accounts || accounts.length === 0) {
    return { total: 0, successful: 0, failed: 0, successfulAccounts: [], failedAccounts: [] };
  }

  const total = accounts.length;
  // Por agora assumir que todas falharam baseado nos logs de erro
  const failed = total;
  const successful = 0;
  
  const successfulAccounts: string[] = [];
  const failedAccounts = accounts.map(acc => acc.id);

  return { total, successful, failed, successfulAccounts, failedAccounts };
};
