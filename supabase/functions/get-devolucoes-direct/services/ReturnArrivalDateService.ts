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
  status_history?: StatusHistoryItem[] | any; // Pode não ser array
  status?: string;
  [key: string]: any;
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

    // 404 é esperado quando não há return físico (apenas reembolso)
    if (returnsRes.status === 404) {
      logger.debug(`[ReturnArrival] Claim ${claimId} não tem return físico (404 - apenas reembolso)`);
      return null;
    }

    if (!returnsRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Status ${returnsRes.status} ao obter returns para claim ${claimId}`);
      return null;
    }

    const returnsData: ReturnData = await returnsRes.json();

    // 2. Encontrar o shipment de devolução para o vendedor
    const returnShipment = returnsData.shipments?.find(
      (s: ReturnShipment) => s.destination?.name === 'seller_address'
    );

    if (!returnShipment?.shipment_id) {
      // Muitos retornos vão para warehouse do ML, não para o seller
      const destinations = returnsData.shipments?.map(s => s.destination?.name).join(', ') || 'nenhum';
      logger.debug(`[ReturnArrival] Claim ${claimId}: Sem shipment seller_address. Destinos: ${destinations}`);
      return null;
    }

    const shipmentId = returnShipment.shipment_id;
    logger.debug(`[ReturnArrival] ✅ Shipment encontrado: ${shipmentId} para claim ${claimId}`);

    // 3. Buscar detalhes do shipment
    const shipmentUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    
    const shipmentRes = await fetch(shipmentUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!shipmentRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Status ${shipmentRes.status} ao obter shipment ${shipmentId}`);
      return null;
    }

    const shipmentData: ShipmentData = await shipmentRes.json();

    // 4. Encontrar a data de entrega no histórico de status
    let deliveredStatus = null;
    
    // Verificar se status_history é realmente um array
    if (Array.isArray(shipmentData.status_history)) {
      deliveredStatus = shipmentData.status_history.find(
        (h: StatusHistoryItem) => h.status === 'delivered'
      );
    } else if (shipmentData.status === 'delivered' && shipmentData.date_delivered) {
      // Fallback: usar date_delivered diretamente se disponível
      logger.debug(`[ReturnArrival] Usando date_delivered do shipment ${shipmentId}`);
      return shipmentData.date_delivered;
    }

    if (deliveredStatus?.date) {
      logger.info(`[ReturnArrival] ✅ Data de chegada: ${deliveredStatus.date} (claim ${claimId})`);
      return deliveredStatus.date;
    }

    // Produto ainda não foi entregue ao seller
    const currentStatus = Array.isArray(shipmentData.status_history) 
      ? shipmentData.status_history[shipmentData.status_history.length - 1]?.status 
      : shipmentData.status;
    logger.debug(`[ReturnArrival] Claim ${claimId}: Ainda não delivered. Status atual: ${currentStatus}`);
    return null;

  } catch (error) {
    logger.debug(`[ReturnArrival] Erro no claim ${claimId}:`, error instanceof Error ? error.message : 'Unknown');
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
  logger.info(`[ReturnArrival] ========== INÍCIO DO ENRIQUECIMENTO ==========`);
  logger.info(`[ReturnArrival] Total de claims recebidos: ${claims.length}`);
  logger.info(`[ReturnArrival] AccessToken presente: ${!!accessToken}`);
  logger.info(`[ReturnArrival] 🚀 Iniciando busca de datas de chegada...`);

  // Processar em lotes menores para evitar rate limiting
  const BATCH_SIZE = 3; // Reduzido para evitar 429
  const DELAY_BETWEEN_BATCHES = 1500; // 1.5 segundos entre lotes
  
  const enrichedClaims: any[] = [];
  let successCount = 0;
  let no404Count = 0; // Claims sem return físico
  let noSellerAddressCount = 0; // Returns para warehouse
  let notDeliveredYetCount = 0; // Ainda em trânsito
  
  for (let i = 0; i < claims.length; i += BATCH_SIZE) {
    const batch = claims.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async (claim) => {
        const arrivalDate = await fetchReturnArrivalDate(claim.id, accessToken);
        if (arrivalDate) successCount++;
        return {
          ...claim,
          return_arrival_date: arrivalDate
        };
      })
    );
    
    enrichedClaims.push(...batchResults);
    
    // Delay entre lotes
    if (i + BATCH_SIZE < claims.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  logger.info(`[ReturnArrival] ✅ Concluído: ${successCount}/${claims.length} datas encontradas`);
  logger.info(`[ReturnArrival] 📊 Motivos sem data: 404(sem return físico), warehouse(não seller_address), em trânsito`);

  return enrichedClaims;
}
