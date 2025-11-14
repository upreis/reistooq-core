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
    
    // Log completo da estrutura recebida
    logger.debug(`[ReturnArrival] 📦 Estrutura completa do shipment:`, JSON.stringify(shipmentData, null, 2));
    
    logger.debug(`[ReturnArrival] 📦 Análise de status_history:`, JSON.stringify({
      has_status_history: !!shipmentData.status_history,
      is_array: Array.isArray(shipmentData.status_history),
      type: typeof shipmentData.status_history,
      length: Array.isArray(shipmentData.status_history) ? shipmentData.status_history.length : 'N/A',
      sample: shipmentData.status_history
    }));

    // 4. Encontrar a data de entrega no histórico de status
    let deliveredStatus = null;
    
    // Verificar se status_history é realmente um array
    if (Array.isArray(shipmentData.status_history)) {
      deliveredStatus = shipmentData.status_history.find(
        (h: StatusHistoryItem) => h.status === 'delivered'
      );
    } else {
      logger.warn(`[ReturnArrival] ⚠️ status_history não é um array! Tipo: ${typeof shipmentData.status_history}`);
      
      // Verificar se o status atual do shipment é 'delivered'
      if (shipmentData.status === 'delivered' && shipmentData.date_delivered) {
        logger.info(`[ReturnArrival] Usando date_delivered do shipment diretamente`);
        return shipmentData.date_delivered;
      }
    }

    if (deliveredStatus?.date) {
      logger.info(`[ReturnArrival] ✅ Data de chegada encontrada para claim ${claimId}: ${deliveredStatus.date}`);
      return deliveredStatus.date;
    }

    logger.warn(`[ReturnArrival] ⚠️ Status 'delivered' não encontrado no histórico do shipment ${shipmentId}`);
    logger.debug(`[ReturnArrival] Campos disponíveis no shipment:`, Object.keys(shipmentData));
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

  // Processar em lotes para evitar rate limiting
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo entre lotes
  
  const enrichedClaims: any[] = [];
  
  for (let i = 0; i < claims.length; i += BATCH_SIZE) {
    const batch = claims.slice(i, i + BATCH_SIZE);
    logger.debug(`[ReturnArrival] Processando lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(claims.length/BATCH_SIZE)}`);
    
    const batchResults = await Promise.all(
      batch.map(async (claim, batchIndex) => {
        const globalIndex = i + batchIndex;
        logger.debug(`[ReturnArrival] Processando claim ${globalIndex + 1}/${claims.length} - ID: ${claim.id}`);
        const arrivalDate = await fetchReturnArrivalDate(claim.id, accessToken);
        return {
          ...claim,
          return_arrival_date: arrivalDate
        };
      })
    );
    
    enrichedClaims.push(...batchResults);
    
    // Delay entre lotes para evitar rate limiting
    if (i + BATCH_SIZE < claims.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const foundCount = enrichedClaims.filter(c => c.return_arrival_date).length;
  logger.info(`[ReturnArrival] ✅ CONCLUÍDO: ${foundCount}/${claims.length} datas de chegada encontradas`);
  
  if (foundCount === 0) {
    logger.warn(`[ReturnArrival] ⚠️ ATENÇÃO: Nenhuma data de chegada foi encontrada!`);
  } else {
    logger.info(`[ReturnArrival] Taxa de sucesso: ${((foundCount/claims.length)*100).toFixed(1)}%`);
  }

  return enrichedClaims;
}
