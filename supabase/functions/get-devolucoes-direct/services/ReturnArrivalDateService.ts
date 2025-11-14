/**
 * 🎯 SERVIÇO: DATA DE CHEGADA DA DEVOLUÇÃO
 * Conforme documentação ML - extrai data de entrega do histórico de status do shipment
 */

import { logger } from '../../_shared/logger.ts';

interface StatusHistoryItem {
  status: string;
  date: string;
}

interface ShipmentData {
  status_history: StatusHistoryItem[];
}

interface ReturnShipment {
  shipment_id: string;
  destination?: {
    name?: string;
  };
}

interface ReturnData {
  shipments?: ReturnShipment[];
}

/**
 * Busca a data de chegada da devolução ao vendedor
 * @param claimId - ID da reclamação
 * @param accessToken - Token de acesso ML
 * @returns Data de chegada ou null
 */
export async function fetchReturnArrivalDate(
  claimId: string,
  accessToken: string
): Promise<string | null> {
  try {
    logger.info(`[ReturnArrival] 🔍 Iniciando busca para claim ${claimId}`);
    
    // 1. Buscar os returns associados ao claim
    const returnsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`;
    
    logger.debug(`[ReturnArrival] 📡 Chamando: ${returnsUrl}`);
    
    const returnsRes = await fetch(returnsUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    logger.debug(`[ReturnArrival] 📡 Response status: ${returnsRes.status}`);

    if (!returnsRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Falha ao obter returns para claim ${claimId} - Status: ${returnsRes.status}`);
      return null;
    }

    const returnsData: ReturnData = await returnsRes.json();
    
    logger.debug(`[ReturnArrival] 📦 Returns data recebida:`, JSON.stringify({
      has_shipments: !!returnsData.shipments,
      shipments_count: returnsData.shipments?.length || 0,
      shipments_sample: returnsData.shipments?.map(s => ({
        shipment_id: s.shipment_id,
        destination_name: s.destination?.name
      }))
    }));

    // 2. Encontrar o shipment de devolução para o vendedor
    const returnShipment = returnsData.shipments?.find(
      (s: ReturnShipment) => s.destination?.name === 'seller_address'
    );

    if (!returnShipment?.shipment_id) {
      logger.warn(`[ReturnArrival] ⚠️ Nenhum shipment com destination='seller_address' encontrado para claim ${claimId}`);
      logger.debug(`[ReturnArrival] Destinations encontrados:`, returnsData.shipments?.map(s => s.destination?.name));
      return null;
    }

    const shipmentId = returnShipment.shipment_id;
    logger.info(`[ReturnArrival] ✅ Shipment encontrado: ${shipmentId}`);

    // 3. Buscar detalhes do shipment
    const shipmentUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    
    logger.debug(`[ReturnArrival] 📡 Chamando: ${shipmentUrl}`);
    
    const shipmentRes = await fetch(shipmentUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    logger.debug(`[ReturnArrival] 📡 Shipment response status: ${shipmentRes.status}`);

    if (!shipmentRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Falha ao obter shipment ${shipmentId} - Status: ${shipmentRes.status}`);
      return null;
    }

    const shipmentData: ShipmentData = await shipmentRes.json();
    
    logger.debug(`[ReturnArrival] 📦 Shipment data recebida:`, JSON.stringify({
      has_status_history: !!shipmentData.status_history,
      status_history_count: shipmentData.status_history?.length || 0,
      statuses: shipmentData.status_history?.map(h => h.status)
    }));

    // 4. Encontrar a data de entrega no histórico de status
    const deliveredStatus = shipmentData.status_history?.find(
      (h: StatusHistoryItem) => h.status === 'delivered'
    );

    if (deliveredStatus?.date) {
      logger.info(`[ReturnArrival] ✅ Data de chegada encontrada para claim ${claimId}: ${deliveredStatus.date}`);
      return deliveredStatus.date;
    }

    logger.warn(`[ReturnArrival] ⚠️ Status 'delivered' não encontrado no histórico do shipment ${shipmentId}`);
    logger.debug(`[ReturnArrival] Status history completo:`, JSON.stringify(shipmentData.status_history));
    return null;

  } catch (error) {
    logger.error(`[ReturnArrival] ❌ ERRO ao buscar data de chegada para claim ${claimId}:`, error);
    logger.error(`[ReturnArrival] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}

/**
 * Busca datas de chegada para múltiplos claims em paralelo
 * @param claims - Array de claims com returnData
 * @param accessToken - Token de acesso ML
 * @returns Array de claims enriquecidos com data_chegada_produto
 */
export async function enrichClaimsWithArrivalDates(
  claims: any[],
  accessToken: string
): Promise<any[]> {
  logger.info(`[ReturnArrival] 🚀 Iniciando enriquecimento de ${claims.length} claims com datas de chegada...`);

  const enrichedClaims = await Promise.all(
    claims.map(async (claim, index) => {
      logger.debug(`[ReturnArrival] Processando claim ${index + 1}/${claims.length} - ID: ${claim.id}`);
      const arrivalDate = await fetchReturnArrivalDate(claim.id, accessToken);
      return {
        ...claim,
        return_arrival_date: arrivalDate
      };
    })
  );

  const foundCount = enrichedClaims.filter(c => c.return_arrival_date).length;
  logger.info(`[ReturnArrival] ✅ CONCLUÍDO: ${foundCount}/${claims.length} datas de chegada encontradas`);
  
  if (foundCount === 0) {
    logger.warn(`[ReturnArrival] ⚠️ ATENÇÃO: Nenhuma data de chegada foi encontrada!`);
  }

  return enrichedClaims;
}
