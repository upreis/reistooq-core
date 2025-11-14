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
    // 1. Buscar os returns associados ao claim
    const returnsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`;
    
    const returnsRes = await fetch(returnsUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!returnsRes.ok) {
      logger.debug(`[ReturnArrival] Não foi possível obter returns para claim ${claimId}`);
      return null;
    }

    const returnsData: ReturnData = await returnsRes.json();

    // 2. Encontrar o shipment de devolução para o vendedor
    const returnShipment = returnsData.shipments?.find(
      (s: ReturnShipment) => s.destination?.name === 'seller_address'
    );

    if (!returnShipment?.shipment_id) {
      logger.debug(`[ReturnArrival] Nenhum shipment de retorno ao vendedor encontrado para claim ${claimId}`);
      return null;
    }

    const shipmentId = returnShipment.shipment_id;

    // 3. Buscar detalhes do shipment
    const shipmentUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    
    const shipmentRes = await fetch(shipmentUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!shipmentRes.ok) {
      logger.debug(`[ReturnArrival] Não foi possível obter shipment ${shipmentId}`);
      return null;
    }

    const shipmentData: ShipmentData = await shipmentRes.json();

    // 4. Encontrar a data de entrega no histórico de status
    const deliveredStatus = shipmentData.status_history?.find(
      (h: StatusHistoryItem) => h.status === 'delivered'
    );

    if (deliveredStatus?.date) {
      logger.debug(`[ReturnArrival] ✅ Data de chegada encontrada para claim ${claimId}: ${deliveredStatus.date}`);
      return deliveredStatus.date;
    }

    logger.debug(`[ReturnArrival] Status 'delivered' não encontrado no histórico do shipment ${shipmentId}`);
    return null;

  } catch (error) {
    logger.error(`[ReturnArrival] Erro ao buscar data de chegada para claim ${claimId}:`, error);
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
  logger.progress(`[ReturnArrival] Enriquecendo ${claims.length} claims com datas de chegada...`);

  const enrichedClaims = await Promise.all(
    claims.map(async (claim) => {
      const arrivalDate = await fetchReturnArrivalDate(claim.id, accessToken);
      return {
        ...claim,
        return_arrival_date: arrivalDate
      };
    })
  );

  const foundCount = enrichedClaims.filter(c => c.return_arrival_date).length;
  logger.info(`[ReturnArrival] ✅ ${foundCount}/${claims.length} datas de chegada encontradas`);

  return enrichedClaims;
}
