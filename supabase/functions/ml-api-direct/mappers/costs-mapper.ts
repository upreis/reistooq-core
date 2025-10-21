/**
 * 💰 SHIPMENT COSTS DATA MAPPER
 * Mapeia dados de custos do endpoint /shipments/{id}/costs
 */

export function mapShipmentCostsData(costsData: any) {
  if (!costsData) return null;

  return {
    shipment_id: costsData.shipment_id || null,
    
    // Forward shipping costs
    forward_shipping: {
      amount: costsData.forward_shipping?.amount || 0,
      currency: costsData.forward_shipping?.currency || 'BRL',
      paid_by: costsData.forward_shipping?.paid_by || null,
      method: costsData.forward_shipping?.method || null
    },
    
    // Return shipping costs
    return_shipping: {
      amount: costsData.return_shipping?.amount || 0,
      currency: costsData.return_shipping?.currency || 'BRL',
      paid_by: costsData.return_shipping?.paid_by || null,
      method: costsData.return_shipping?.method || null
    },
    
    // Restocking costs
    restocking: {
      amount: costsData.restocking?.amount || 0,
      currency: costsData.restocking?.currency || 'BRL',
      applied: costsData.restocking?.applied || false
    },
    
    // Additional costs
    additional_costs: costsData.additional_costs?.map((c: any) => ({
      type: c.type || null,
      amount: c.amount || 0,
      currency: c.currency || 'BRL',
      description: c.description || null
    })) || [],
    
    // Total costs summary
    total_costs: {
      amount: costsData.total_costs?.amount || 0,
      currency: costsData.total_costs?.currency || 'BRL',
      breakdown: costsData.total_costs?.breakdown || {}
    },
    
    // Cost responsibility
    seller_responsibility: costsData.seller_responsibility || 0,
    buyer_responsibility: costsData.buyer_responsibility || 0,
    ml_responsibility: costsData.ml_responsibility || 0,
    
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
    custo_envio_ida: mapped?.forward_shipping?.amount || null,
    custo_envio_retorno: mapped?.return_shipping?.amount || null,
    custo_total_logistica: mapped?.total_costs?.amount || null,
    moeda_custo: mapped?.total_costs?.currency || 'BRL',
    responsavel_custo: mapped?.forward_shipping?.paid_by || null,
    
    // Salvar dados completos no JSONB
    dados_costs: mapped
  };
}
