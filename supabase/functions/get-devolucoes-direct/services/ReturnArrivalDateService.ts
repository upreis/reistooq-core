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
    logger.debug(`[ReturnArrival] 🔍 INICIANDO busca para claim ${claimId}`);
    
    // 1. Buscar os returns associados ao claim
    const returnsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`;
    logger.debug(`[ReturnArrival] 📡 Chamando: ${returnsUrl}`);
    
    const returnsRes = await fetch(returnsUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    logger.debug(`[ReturnArrival] 📊 Status da resposta: ${returnsRes.status}`);

    // 404 é esperado quando não há return físico (apenas reembolso)
    if (returnsRes.status === 404) {
      logger.debug(`[ReturnArrival] ⚠️ Claim ${claimId} não tem return físico (404 - apenas reembolso)`);
      return null;
    }

    if (!returnsRes.ok) {
      logger.warn(`[ReturnArrival] ❌ Status ${returnsRes.status} ao obter returns para claim ${claimId}`);
      return null;
    }

    const returnsData: ReturnData = await returnsRes.json();
    
    // 🔍 Log COMPLETO da resposta da API (primeiras 500 chars)
    const returnsDataStr = JSON.stringify(returnsData);
    logger.debug(`[ReturnArrival] 📦 RESPOSTA /returns/${claimId}: ${returnsDataStr.substring(0, 500)}...`);
    logger.debug(`[ReturnArrival] 📦 Shipments count: ${returnsData.shipments?.length || 0}`);

    // Log detalhado dos shipments
    if (returnsData.shipments && returnsData.shipments.length > 0) {
      returnsData.shipments.forEach((s, idx) => {
        logger.debug(`[ReturnArrival] 📍 Shipment ${idx}: ID=${s.shipment_id}, Destino=${s.destination?.name}`);
      });
      
      // 🔍 Log completo do primeiro shipment para debug
      logger.debug(`[ReturnArrival] 🔍 ESTRUTURA COMPLETA do primeiro shipment:`, JSON.stringify(returnsData.shipments[0], null, 2));
    }

    // 2. Encontrar o shipment de devolução
    // Prioridade 1: seller_address
    let returnShipment = returnsData.shipments?.find(
      (s: ReturnShipment) => s.destination?.name === 'seller_address'
    );
    
    // Prioridade 2: warehouse (caso seja Full)
    if (!returnShipment) {
      returnShipment = returnsData.shipments?.find(
        (s: ReturnShipment) => s.destination?.name === 'warehouse'
      );
      if (returnShipment) {
        logger.info(`[ReturnArrival] ⚠️ Claim ${claimId}: Usando warehouse shipment (pode ser Full)`);
      }
    }

    if (!returnShipment?.shipment_id) {
      // Muitos retornos vão para warehouse do ML, não para o seller
      const destinations = returnsData.shipments?.map(s => s.destination?.name).join(', ') || 'nenhum';
      logger.warn(`[ReturnArrival] ❌ Claim ${claimId}: Sem shipment válido. Destinos: ${destinations}`);
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
    logger.debug(`[ReturnArrival] 📊 Shipment ${shipmentId} obtido. Status atual: ${shipmentData.status}`);
    logger.debug(`[ReturnArrival] 📊 Tem status_history? ${!!shipmentData.status_history}, É array? ${Array.isArray(shipmentData.status_history)}`);

    // 4. Encontrar a data de entrega no histórico de status
    let deliveredStatus = null;
    
    // Verificar se status_history é realmente um array
    if (Array.isArray(shipmentData.status_history)) {
      logger.debug(`[ReturnArrival] 📜 Status history tem ${shipmentData.status_history.length} eventos`);
      
      // Log todos os status
      shipmentData.status_history.forEach((h: any, idx: number) => {
        logger.debug(`[ReturnArrival] 📍 Evento ${idx}: status=${h.status}, date=${h.date}`);
      });
      
      deliveredStatus = shipmentData.status_history.find(
        (h: StatusHistoryItem) => h.status === 'delivered'
      );
    } else if (shipmentData.status === 'delivered' && shipmentData.date_delivered) {
      // Fallback: usar date_delivered diretamente se disponível
      logger.info(`[ReturnArrival] ✅ Usando date_delivered do shipment ${shipmentId}: ${shipmentData.date_delivered}`);
      return shipmentData.date_delivered;
    } else {
      logger.warn(`[ReturnArrival] ⚠️ Sem status_history válido para shipment ${shipmentId}`);
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
  logger.progress(`[ReturnArrival] ========== INÍCIO DO ENRIQUECIMENTO ==========`);
  logger.progress(`[ReturnArrival] Total de claims recebidos: ${claims.length}`);
  logger.progress(`[ReturnArrival] AccessToken presente: ${!!accessToken}`);
  logger.progress(`[ReturnArrival] 🚀 Iniciando busca de datas de chegada...`);

  // Processar SEQUENCIALMENTE para evitar rate limiting
  const enrichedClaims: any[] = [];
  let successCount = 0;
  let error429Count = 0;
  let error404Count = 0;
  let noSellerAddressCount = 0;
  let notDeliveredCount = 0;
  
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    
    // ✅ Pegar o ID correto do claim
    const claimId = claim.id || claim.claim_details?.id;
    
    if (!claimId) {
      logger.warn(`[ReturnArrival] ⚠️ Claim sem ID encontrado no índice ${i}, pulando...`);
      enrichedClaims.push(claim);
      continue;
    }
    
    try {
      logger.progress(`[ReturnArrival] 🔄 Processando claim ${i+1}/${claims.length} (ID: ${claimId})`);
      const arrivalDate = await fetchReturnArrivalDate(claimId, accessToken);
      
      if (arrivalDate) {
        successCount++;
        logger.progress(`[ReturnArrival] ✅ ${i+1}/${claims.length} - Data encontrada: ${arrivalDate} para claim ${claimId}`);
      } else {
        logger.warn(`[ReturnArrival] ⚠️ ${i+1}/${claims.length} - Sem data para claim ${claimId}`);
      }
      
      const enrichedClaim = {
        ...claim,
        data_chegada_produto: arrivalDate  // ✅ Nome correto do campo
      };
      
      logger.debug(`[ReturnArrival] 💾 Claim ${claimId} enriquecido com data_chegada_produto: ${enrichedClaim.data_chegada_produto || 'NULL'}`);
      enrichedClaims.push(enrichedClaim);
      
    } catch (error) {
      logger.error(`[ReturnArrival] ❌ ${i+1}/${claims.length} - Erro no claim ${claimId}:`, error instanceof Error ? error.message : String(error));
      enrichedClaims.push(claim);
    }
    
    // Delay de 500ms entre CADA requisição para evitar 429
    if (i < claims.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  logger.progress(`[ReturnArrival] ========== FIM DO ENRIQUECIMENTO ==========`);
  logger.progress(`[ReturnArrival] ✅ Concluído: ${successCount}/${claims.length} datas encontradas`);
  logger.progress(`[ReturnArrival] 📊 Resumo: ${successCount} com data, ${claims.length - successCount} sem data`);
  
  // Debug: log alguns exemplos de claims enriquecidos
  if (enrichedClaims.length > 0) {
    logger.debug(`[ReturnArrival] 🔍 Exemplo do primeiro claim enriquecido:`, JSON.stringify({
      claim_id: enrichedClaims[0].id,
      data_chegada_produto: enrichedClaims[0].data_chegada_produto,
      has_field: 'data_chegada_produto' in enrichedClaims[0]
    }));
  }

  return enrichedClaims;
}
