/**
 * 📦 SHIPMENT ENRICHMENT SERVICE
 * Enriquece dados de shipment buscando informações completas da API ML
 * Inclui: logistic.type, tracking_number, status, receiver_address
 */

import { logger } from '../../_shared/logger.ts';

/**
 * Enriquecer múltiplos orders com dados de shipment em paralelo
 */
export async function enrichMultipleShipments(
  orders: any[],
  accessToken: string
): Promise<any[]> {
  if (!orders || orders.length === 0) {
    return orders;
  }

  logger.progress(`[ShipmentEnrichment] Enriquecendo ${orders.length} shipments...`);

  const enrichedOrders = await Promise.all(
    orders.map(order => 
      enrichShipmentData(order, accessToken, order.id || 'unknown')
    )
  );

  logger.success(`[ShipmentEnrichment] ✅ ${orders.length} shipments enriquecidos`);

  return enrichedOrders;
}

export async function enrichShipmentData(
  orderData: any,
  accessToken: string,
  claimId: string
): Promise<any> {
  try {
    const shipmentId = orderData?.shipping?.id;
    
    if (!shipmentId) {
      logger.debug(`[ShipmentEnrichment] Claim ${claimId}: sem shipment_id`);
      return orderData;
    }

    logger.debug(`[ShipmentEnrichment] Claim ${claimId}: buscando shipment ${shipmentId}`);

    // Buscar dados completos do shipment
    const response = await fetch(
      `https://api.mercadolibre.com/shipments/${shipmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-format-new': 'true'
        }
      }
    );

    if (!response.ok) {
      logger.warn(`[ShipmentEnrichment] Erro HTTP ${response.status} ao buscar shipment ${shipmentId}`);
      return orderData;
    }

    const shipmentData = await response.json();

    // Log dos dados extraídos
    logger.info(`[ShipmentEnrichment] ✅ Shipment ${shipmentId} enriquecido:`, {
      logistic_type: shipmentData?.logistic?.type,
      tracking_number: shipmentData?.tracking_number,
      status: shipmentData?.status
    });

    // Mesclar dados enriquecidos mantendo estrutura original
    return {
      ...orderData,
      shipping: {
        ...orderData.shipping,
        ...shipmentData,
        // Garantir que campos críticos estão disponíveis em ambos formatos
        logistic_type: shipmentData?.logistic?.type || orderData.shipping?.logistic_type,
        tracking_number: shipmentData?.tracking_number || orderData.shipping?.tracking_number,
        detailed_shipping: shipmentData,
        shipping_enriched: true
      }
    };

  } catch (error) {
    logger.error(`[ShipmentEnrichment] Erro ao enriquecer shipment:`, error);
    return orderData;
  }
}

/**
 * Enriquecer múltiplos orders com dados de shipment em paralelo
 */
export async function enrichMultipleShipments(
  orders: any[],
  accessToken: string
): Promise<any[]> {
  if (!orders || orders.length === 0) {
    return orders;
  }

  logger.progress(`[ShipmentEnrichment] Enriquecendo ${orders.length} shipments...`);

  const enrichedOrders = await Promise.all(
    orders.map(order => 
      enrichShipmentData(order, accessToken, order.id || 'unknown')
    )
  );

  logger.success(`[ShipmentEnrichment] ✅ ${orders.length} shipments enriquecidos`);

  return enrichedOrders;
}
