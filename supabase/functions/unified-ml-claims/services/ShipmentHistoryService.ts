/**
 * 📦 SHIPMENT HISTORY SERVICE
 * Busca e enriquece dados de histórico de rastreamento completo
 */

import { fetchWithRetry } from '../../_shared/retryUtils.ts';
import { logger } from '../../_shared/logger.ts';

export interface ShipmentEvent {
  date_created: string;
  status: string;
  substatus: string | null;
  status_detail: string | null;
  location: {
    city: string | null;
    state: string | null;
  } | null;
}

export interface ShipmentHistoryData {
  shipment_id: number;
  tracking_number: string | null;
  events: ShipmentEvent[];
  total_events: number;
  first_event: ShipmentEvent | null;
  last_event: ShipmentEvent | null;
  transit_time_days: number | null;
  current_location: string | null;
  delays: string[];
  // ✅ FASE 1: Novos campos críticos de shipment
  estimated_delivery_limit?: string | null;
  carrier_name?: string | null;
  carrier_tracking_url?: string | null;
  shipping_option_name?: string | null;
  logistic_type?: string | null;
  // ✅ FASE 2: Campos adicionais de prazo
  estimated_delivery_time?: string | null;
  estimated_delivery_time_type?: string | null;
  // ✅ FASE 3: Método de envio e histórico
  shipping_method_name?: string | null;
  tracking_method?: string | null;
  status_history?: any[] | null;
}

/**
 * Buscar histórico completo de rastreamento de um shipment
 */
export async function fetchShipmentHistory(
  shipmentId: number,
  accessToken: string
): Promise<ShipmentHistoryData | null> {
  try {
    // ✅ FASE 1: Buscar shipment completo (não apenas history) para obter estimated_delivery_limit e carrier
    const shipmentUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    
    logger.debug(`[ShipmentHistoryService] Buscando shipment completo ${shipmentId}`);
    
    const shipmentResponse = await fetchWithRetry(shipmentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'x-format-new': 'true' // ✅ Formato novo com mais detalhes
      }
    });

    if (!shipmentResponse.ok) {
      logger.warn(`[ShipmentHistoryService] Erro ${shipmentResponse.status} ao buscar shipment ${shipmentId}`);
      return null;
    }

    const shipmentData = await shipmentResponse.json();
    
    // Buscar histórico separadamente
    const historyUrl = `https://api.mercadolibre.com/shipments/${shipmentId}/history`;
    const historyResponse = await fetchWithRetry(historyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    let historyData = { history: [] };
    if (historyResponse.ok) {
      historyData = await historyResponse.json();
    }
    
    const events = historyData?.history || [];

    if (events.length === 0) {
      logger.debug(`[ShipmentHistoryService] Sem eventos para shipment ${shipmentId}`);
    }

    // Extrair dados enriquecidos
    const firstEvent = events[events.length - 1]; // Primeiro evento (array vem invertido)
    const lastEvent = events[0]; // Último evento
    
    // Calcular tempo de trânsito
    let transitTimeDays = null;
    if (firstEvent?.date_created && lastEvent?.date_created) {
      const start = new Date(firstEvent.date_created);
      const end = new Date(lastEvent.date_created);
      transitTimeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Detectar atrasos (eventos com substatus indicando atraso)
    const delays = events
      .filter((e: any) => 
        e.substatus?.includes('delay') || 
        e.substatus?.includes('retention') ||
        e.status_detail?.includes('atraso')
      )
      .map((e: any) => e.substatus || e.status_detail);

    // Localização atual
    const currentLocation = lastEvent?.location 
      ? [lastEvent.location.city, lastEvent.location.state].filter(Boolean).join(', ')
      : null;

    // ✅ FASE 1 + FASE 2: Extrair campos críticos do shipment completo
    const estimatedDeliveryLimit = shipmentData?.estimated_delivery_limit?.date || 
                                   shipmentData?.estimated_delivery_time?.date || null;
    const carrierName = shipmentData?.carrier_info?.name || null;
    const carrierTrackingUrl = shipmentData?.carrier_info?.tracking_url || null;
    const shippingOptionName = shipmentData?.shipping_option?.name || null;
    const logisticType = shipmentData?.logistic_type || null;
    
    // ✅ FASE 2: Prazo estimado de entrega
    const estimatedDeliveryTime = shipmentData?.estimated_delivery_time?.date || null;
    const estimatedDeliveryTimeType = shipmentData?.estimated_delivery_time?.type || null;
    
    // ✅ FASE 3: Método de envio e histórico
    const shippingMethodName = shipmentData?.shipping_method?.name || null;
    const trackingMethod = shipmentData?.tracking_method || null;
    const statusHistory = shipmentData?.status_history || null;
    
    logger.info(`[ShipmentHistoryService] 📦 FASE 1+2+3 - Dados extraídos: carrier=${carrierName}, shipping_method=${shippingMethodName}, tracking_method=${trackingMethod}, status_history_count=${statusHistory?.length || 0}`);
    const enrichedData: ShipmentHistoryData = {
      shipment_id: shipmentId,
      tracking_number: shipmentData?.tracking_number || null,
      events: events.map((e: any) => ({
        date_created: e.date_created,
        status: e.status,
        substatus: e.substatus || null,
        status_detail: e.status_detail || null,
        location: e.location ? {
          city: e.location.city || null,
          state: e.location.state || null
        } : null
      })),
      total_events: events.length,
      first_event: firstEvent ? {
        date_created: firstEvent.date_created,
        status: firstEvent.status,
        substatus: firstEvent.substatus || null,
        status_detail: firstEvent.status_detail || null,
        location: firstEvent.location || null
      } : null,
      last_event: lastEvent ? {
        date_created: lastEvent.date_created,
        status: lastEvent.status,
        substatus: lastEvent.substatus || null,
        status_detail: lastEvent.status_detail || null,
        location: lastEvent.location || null
      } : null,
      transit_time_days: transitTimeDays,
      current_location: currentLocation,
      delays: delays,
      // ✅ FASE 1: Novos campos críticos
      estimated_delivery_limit: estimatedDeliveryLimit,
      carrier_name: carrierName,
      carrier_tracking_url: carrierTrackingUrl,
      shipping_option_name: shippingOptionName,
      logistic_type: logisticType,
      // ✅ FASE 2: Prazo estimado
      estimated_delivery_time: estimatedDeliveryTime,
      estimated_delivery_time_type: estimatedDeliveryTimeType,
      // ✅ FASE 3: Método de envio e histórico
      shipping_method_name: shippingMethodName,
      tracking_method: trackingMethod,
      status_history: statusHistory
    };

    logger.info(`[ShipmentHistoryService] ✅ Shipment completo enriquecido: ${events.length} eventos, carrier=${carrierName}`);
    
    return enrichedData;

  } catch (error) {
    logger.error(`[ShipmentHistoryService] Erro ao buscar histórico shipment ${shipmentId}:`, error);
    return null;
  }
}

/**
 * Buscar histórico de múltiplos shipments (original + devolução)
 */
export async function fetchMultipleShipmentHistories(
  shipmentIds: number[],
  accessToken: string
): Promise<Map<number, ShipmentHistoryData>> {
  const historyMap = new Map<number, ShipmentHistoryData>();
  
  for (const shipmentId of shipmentIds) {
    try {
      const history = await fetchShipmentHistory(shipmentId, accessToken);
      if (history) {
        historyMap.set(shipmentId, history);
        logger.debug(`[ShipmentHistoryService] ✅ Histórico shipment ${shipmentId} enriquecido`);
      } else {
        logger.debug(`[ShipmentHistoryService] ⚠️ Sem dados histórico shipment ${shipmentId}`);
      }
      
      // ✅ CORREÇÃO: Delay correto usando setTimeout
      if (shipmentIds.indexOf(shipmentId) < shipmentIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      logger.error(`[ShipmentHistoryService] ❌ Erro shipment ${shipmentId}:`, err);
    }
  }
  
  return historyMap;
}
