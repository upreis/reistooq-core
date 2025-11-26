/**
 * 🗺️ MAPPER - Shipment Costs Data
 * Transforma dados de custos de frete do ML em estrutura normalizada
 * Extraído da unified-orders para melhor organização
 */

export function mapShipmentCostsData(costsData: any) {
  if (!costsData) return null;

  const receiverDiscounts = costsData.receiver?.discounts || [];
  const senderCharges = costsData.senders?.[0]?.charges || {};
  
  const totalReceiverDiscounts = Array.isArray(receiverDiscounts)
    ? receiverDiscounts.reduce(
        (sum: number, d: any) => sum + (Number(d.promoted_amount) || 0),
        0
      )
    : 0;

  return {
    gross_amount: costsData.gross_amount || 0,
    receiver: {
      cost: costsData.receiver?.cost || 0,
      discounts: receiverDiscounts,
      total_discount_amount: totalReceiverDiscounts,
      loyal_discount_amount: receiverDiscounts.find((d: any) => d.type === 'loyal')?.promoted_amount || 0,
      loyal_discount_rate: receiverDiscounts.find((d: any) => d.type === 'loyal')?.rate || 0
    },
    sender: {
      cost: costsData.senders?.[0]?.cost || 0,
      charge_flex: senderCharges.charge_flex || 0,
      charges: senderCharges
    },
    order_cost: costsData.gross_amount || 0,
    special_discount: totalReceiverDiscounts,
    net_cost: (costsData.gross_amount || 0) - totalReceiverDiscounts,
    raw_data: costsData
  };
}
