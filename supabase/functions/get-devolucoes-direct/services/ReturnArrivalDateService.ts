/**
 * 🎯 SERVIÇO: DATA DE CHEGADA DA DEVOLUÇÃO
 * Extrai data de entrega do status_history (objeto) do shipment
 */

import { logger } from '../../_shared/logger.ts';
import pLimit from 'https://esm.sh/p-limit@6.1.0';

interface ShipmentData {
  status_history?: {
    date_delivered?: string;
    date_returned?: string;
    [key: string]: any;
  };
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

export async function fetchReturnArrivalDate(
  claimId: string,
  accessToken: string
): Promise<string | null> {
  try {
    logger.debug(`[ReturnArrival] 🔍 Iniciando para claim ${claimId}`);
    
    // 1. Buscar returns
    const returnsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`;
    const returnsRes = await fetch(returnsUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (returnsRes.status === 404) {
      logger.debug(`[ReturnArrival] ⚠️ Sem return físico (claim ${claimId})`);
      return null;
    }

    if (!returnsRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Erro ${returnsRes.status} em returns`);
      return null;
    }

    const returnsData: ReturnData = await returnsRes.json();
    
    // 2. Encontrar shipment de devolução
    let returnShipment = returnsData.shipments?.find(
      (s: ReturnShipment) => s.destination?.name === 'seller_address'
    );
    
    if (!returnShipment) {
      returnShipment = returnsData.shipments?.find(
        (s: ReturnShipment) => s.destination?.name === 'warehouse'
      );
    }

    if (!returnShipment?.shipment_id) {
      logger.warn(`[ReturnArrival] ❌ Sem shipment válido (claim ${claimId})`);
      return null;
    }

    const shipmentId = returnShipment.shipment_id;
    logger.debug(`[ReturnArrival] ✅ Shipment: ${shipmentId}`);

    // 3. Buscar detalhes do shipment
    const shipmentUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    const shipmentRes = await fetch(shipmentUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!shipmentRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Erro ${shipmentRes.status} em shipment`);
      return null;
    }

    const shipmentData: ShipmentData = await shipmentRes.json();
    
    // 4. Extrair data_delivered do objeto status_history
    if (shipmentData.status_history && typeof shipmentData.status_history === 'object') {
      const sh = shipmentData.status_history;
      
      if (sh.date_delivered) {
        logger.info(`[ReturnArrival] ✅ date_delivered: ${sh.date_delivered}`);
        return sh.date_delivered;
      }
      
      if (sh.date_returned) {
        logger.info(`[ReturnArrival] ✅ date_returned: ${sh.date_returned}`);
        return sh.date_returned;
      }
      
      logger.debug(`[ReturnArrival] 🔍 status_history sem datas`);
    } else {
      logger.warn(`[ReturnArrival] ⚠️ Sem status_history`);
    }

    logger.warn(`[ReturnArrival] ⚠️ Data não encontrada (claim ${claimId})`);
    return null;
    
  } catch (error: any) {
    logger.error(`[ReturnArrival] 💥 ERRO: ${error.message}`);
    return null;
  }
}

/**
 * 🚀 BATCH: Busca datas de chegada para múltiplos claims com rate limiting
 * Usa p-limit para controlar concorrência e respeitar rate limits da API ML
 */
export async function fetchMultipleReturnArrivalDates(
  claims: any[],
  accessToken: string,
  concurrencyLimit: number = 10
): Promise<Map<string, string | null>> {
  const limit = pLimit(concurrencyLimit);
  const results = new Map<string, string | null>();

  logger.progress(`📅 [ReturnArrival] Buscando datas de chegada para ${claims.length} claims (concorrência: ${concurrencyLimit})...`);

  const promises = claims.map((claim) =>
    limit(async () => {
      const claimId = claim.id || claim.claim_details?.id;
      if (!claimId) {
        results.set(claim.id || 'unknown', null);
        return;
      }

      try {
        const arrivalDate = await fetchReturnArrivalDate(String(claimId), accessToken);
        results.set(claimId, arrivalDate);
      } catch (error) {
        logger.error(`[ReturnArrival] Erro no claim ${claimId}:`, error);
        results.set(claimId, null);
      }
    })
  );

  await Promise.all(promises);

  const withDate = Array.from(results.values()).filter(d => d !== null).length;
  logger.progress(`📊 [ReturnArrival] Concluído: ${withDate}/${claims.length} com data_chegada_produto`);

  return results;
}
