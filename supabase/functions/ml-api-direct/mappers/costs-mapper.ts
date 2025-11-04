/**
 * 💰 SHIPMENT COSTS DATA MAPPER
 * Mapeia dados de custos do endpoint /shipments/{id}/costs
 */

export function mapShipmentCostsData(costsData: any) {
  if (!costsData) return null;

  // Estrutura real da API /shipments/{id}/costs:
  // {
  //   receiver: { cost, discounts: [{ rate, type, promoted_amount }], ... },
  //   gross_amount,
  //   senders: [{ cost, charges: { charge_flex }, ... }]
  // }

  const receiverDiscounts = costsData.receiver?.discounts || [];
  const senderCharges = costsData.senders?.[0]?.charges || {};
  
  // ✅ CORREÇÃO: Somar TODOS os descontos, não apenas "loyal"
  const totalReceiverDiscounts = receiverDiscounts.reduce(
    (sum: number, d: any) => sum + (d.promoted_amount || 0),
    0
  );

  return {
    // Custo bruto de envio
    gross_amount: costsData.gross_amount || 0,
    
    // Custos e descontos do comprador
    receiver: {
      cost: costsData.receiver?.cost || 0,
      discounts: receiverDiscounts,
      total_discount_amount: totalReceiverDiscounts,
      // Manter campos individuais para compatibilidade
      loyal_discount_amount: receiverDiscounts.find((d: any) => d.type === 'loyal')?.promoted_amount || 0,
      loyal_discount_rate: receiverDiscounts.find((d: any) => d.type === 'loyal')?.rate || 0
    },
    
    // Custos e cobranças do vendedor
    sender: {
      cost: costsData.senders?.[0]?.cost || 0,
      charge_flex: senderCharges.charge_flex || 0,
      charges: senderCharges
    },
    
    // Campos calculados para Flex
    // order_cost = gross_amount (custo que o seller recebe do ML por fazer entrega Flex)
    order_cost: costsData.gross_amount || 0,
    
    // special_discount = SOMA de TODOS os promoted_amount dos descontos do receiver
    special_discount: totalReceiverDiscounts,
    
    // net_cost = order_cost - special_discount
    net_cost: (costsData.gross_amount || 0) - totalReceiverDiscounts,
    
    // Full raw data
    raw_data: costsData
  };
}

/**
 * Extrai campos específicos para salvar na tabela principal
 */
export function extractCostsFields(costsData: any) {
  if (!costsData) return {};

  const mapped = mapShipmentCostsData(costsData);
  
  return {
    custo_envio_ida: mapped?.gross_amount || null,
    custo_envio_retorno: null, // Não disponível nesta estrutura
    custo_total_logistica: mapped?.gross_amount || null,
    moeda_custo: 'BRL',
    responsavel_custo: mapped?.receiver?.cost === 0 ? 'buyer' : 'seller',
    
    // Salvar dados completos no JSONB
    dados_costs: mapped
  };
}
