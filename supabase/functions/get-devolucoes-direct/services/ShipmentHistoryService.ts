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
}

/**
 * Buscar histórico completo de rastreamento de um shipment
 */
export async function fetchShipmentHistory(
  shipmentId: number,
  accessToken: string
): Promise<ShipmentHistoryData | null> {
  try {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}/history`;
    
    logger.debug(`[ShipmentHistoryService] Buscando histórico para shipment ${shipmentId}`);
    
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      logger.warn(`[ShipmentHistoryService] Erro ${response.status} ao buscar histórico shipment ${shipmentId}`);
      return null;
    }

    const data = await response.json();
    const events = data?.history || [];

    if (events.length === 0) {
      logger.debug(`[ShipmentHistoryService] Sem eventos para shipment ${shipmentId}`);
      return null;
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

    const enrichedData: ShipmentHistoryData = {
      shipment_id: shipmentId,
      tracking_number: data?.tracking_number || null,
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
      delays: delays
    };

    logger.info(`[ShipmentHistoryService] ✅ Histórico enriquecido: ${events.length} eventos, ${transitTimeDays || 0} dias trânsito`);
    
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
    const history = await fetchShipmentHistory(shipmentId, accessToken);
    if (history) {
      historyMap.set(shipmentId, history);
    }
    
    // Delay de 100ms entre requests para evitar rate limit
    await new Deno.delay(100);
  }
  
  return historyMap;
}
