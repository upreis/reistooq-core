/**
 * 💰 SHIPPING COSTS SERVICE
 * Busca e enriquece dados de custos detalhados de envio
 */

import { fetchWithRetry } from '../../_shared/retryUtils.ts';
import { logger } from '../../_shared/logger.ts';

export interface ShippingCost {
  type: string;
  amount: number;
  currency: string;
  description: string | null;
}

export interface ShippingCostsData {
  shipment_id: number;
  total_cost: number;
  currency: string;
  receiver_costs: ShippingCost[];
  sender_costs: ShippingCost[];
  receiver_discounts: ShippingCost[];
  total_receiver_cost: number;
  total_sender_cost: number;
  total_receiver_discount: number;
  net_cost: number;
  is_flex: boolean;
  cost_breakdown: {
    shipping_fee: number;
    handling_fee: number;
    insurance: number;
    taxes: number;
  };
  responsavel_custo: 'buyer' | 'seller' | 'mercadolivre' | null;
}

/**
 * Buscar custos detalhados de envio de um shipment
 */
export async function fetchShippingCosts(
  shipmentId: number,
  accessToken: string
): Promise<ShippingCostsData | null> {
  try {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}/costs`;
    
    logger.debug(`[ShippingCostsService] Buscando custos para shipment ${shipmentId}`);
    
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      logger.warn(`[ShippingCostsService] Erro ${response.status} ao buscar custos shipment ${shipmentId}`);
      return null;
    }

    const data = await response.json();

    // Extrair custos
    const receiverCosts = data?.receiver_costs || [];
    const senderCosts = data?.sender_costs || [];
    const receiverDiscounts = data?.receiver_discounts || [];

    // Calcular totais
    const totalReceiverCost = receiverCosts.reduce((sum: number, cost: any) => 
      sum + (cost.amount || 0), 0
    );
    const totalSenderCost = senderCosts.reduce((sum: number, cost: any) => 
      sum + (cost.amount || 0), 0
    );
    const totalReceiverDiscount = receiverDiscounts.reduce((sum: number, discount: any) => 
      sum + (discount.amount || 0), 0
    );

    // Custo líquido = (custos do comprador - descontos) + custos do vendedor
    const netCost = (totalReceiverCost - totalReceiverDiscount) + totalSenderCost;

    // Quebrar custos por tipo
    const costBreakdown = {
      shipping_fee: receiverCosts.find((c: any) => c.type === 'shipping')?.amount || 0,
      handling_fee: receiverCosts.find((c: any) => c.type === 'handling')?.amount || 0,
      insurance: receiverCosts.find((c: any) => c.type === 'insurance')?.amount || 0,
      taxes: receiverCosts.find((c: any) => c.type === 'tax')?.amount || 0
    };

    // Determinar responsável pelo custo
    let responsavel: 'buyer' | 'seller' | 'mercadolivre' | null = null;
    if (totalReceiverCost > 0 && totalSenderCost === 0) {
      responsavel = 'buyer';
    } else if (totalSenderCost > 0 && totalReceiverCost === 0) {
      responsavel = 'seller';
    } else if (totalReceiverDiscount > 0) {
      responsavel = 'mercadolivre'; // ML subsidiou
    }

    const enrichedData: ShippingCostsData = {
      shipment_id: shipmentId,
      total_cost: data?.gross_amount || netCost,
      currency: data?.currency || 'BRL',
      receiver_costs: receiverCosts.map((c: any) => ({
        type: c.type,
        amount: c.amount,
        currency: c.currency || 'BRL',
        description: c.description || null
      })),
      sender_costs: senderCosts.map((c: any) => ({
        type: c.type,
        amount: c.amount,
        currency: c.currency || 'BRL',
        description: c.description || null
      })),
      receiver_discounts: receiverDiscounts.map((d: any) => ({
        type: d.type,
        amount: d.amount,
        currency: d.currency || 'BRL',
        description: d.description || null
      })),
      total_receiver_cost: totalReceiverCost,
      total_sender_cost: totalSenderCost,
      total_receiver_discount: totalReceiverDiscount,
      net_cost: netCost,
      is_flex: data?.is_flex || false,
      cost_breakdown: costBreakdown,
      responsavel_custo: responsavel
    };

    logger.info(`[ShippingCostsService] ✅ Custos enriquecidos: Total R$ ${netCost.toFixed(2)}, Responsável: ${responsavel || 'N/A'}`);
    
    return enrichedData;

  } catch (error) {
    logger.error(`[ShippingCostsService] Erro ao buscar custos shipment ${shipmentId}:`, error);
    return null;
  }
}

/**
 * Buscar custos de múltiplos shipments
 */
export async function fetchMultipleShippingCosts(
  shipmentIds: number[],
  accessToken: string
): Promise<Map<number, ShippingCostsData>> {
  const costsMap = new Map<number, ShippingCostsData>();
  
  for (const shipmentId of shipmentIds) {
    const costs = await fetchShippingCosts(shipmentId, accessToken);
    if (costs) {
      costsMap.set(shipmentId, costs);
    }
    
    // Delay de 100ms entre requests para evitar rate limit
    await new Deno.delay(100);
  }
  
  return costsMap;
}
