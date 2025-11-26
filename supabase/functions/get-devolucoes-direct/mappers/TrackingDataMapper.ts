/**
 * 📦 MAPEADOR DE DADOS DE RASTREAMENTO - VERSÃO LIMPA
 * Extrai TODOS os campos de tracking conforme documentação oficial ML
 * ✅ SEM DUPLICAÇÕES - Um único return statement
 */

export const mapTrackingData = (item: any) => {
  const claim = item;
  const returnData = claim.return_details_v2 || claim.return_details;
  
  // 🐛 DEBUG: Log dados de tracking recebidos
  console.log('📦 TrackingDataMapper - Dados recebidos:', JSON.stringify({
    claim_id: claim.id,
    has_return_details_v2: !!claim.return_details_v2,
    return_status: returnData?.status,
    return_date_created: returnData?.date_created,
    return_last_updated: returnData?.last_updated,
    return_date_closed: returnData?.date_closed,
    return_refund_at: returnData?.refund_at,
    shipments_count: returnData?.shipments?.length || 0,
    first_shipment_status: returnData?.shipments?.[0]?.status,
    first_shipment_type: returnData?.shipments?.[0]?.type,
    first_shipment_tracking: returnData?.shipments?.[0]?.tracking_number
  }));
  
  return {
    // ===== STATUS =====
    status_return: returnData?.status || null,
    // ✅ CORREÇÃO CRÍTICA: API retorna "shipping" (singular), não "shipments" (array)
    status_envio: returnData?.shipping?.status || claim.shipment_data?.status || null,
    shipping_mode: claim.shipping?.mode || claim.shipping?.shipping_mode || returnData?.shipping_mode || null,
    
    // ===== RASTREAMENTO BÁSICO =====
    // ✅ CORREÇÃO: shipping.tracking_number (singular)
    tracking_number: returnData?.shipping?.tracking_number || returnData?.tracking_number || claim.tracking_number || null,
    tracking_status: returnData?.status || claim.status || null,
    codigo_rastreamento: returnData?.shipping?.tracking_number || returnData?.tracking_number || claim.tracking_number || null,
    tracking_method: returnData?.tracking_method || claim.tracking_method || null,
    
    // ===== DADOS DE ENVIO DA DEVOLUÇÃO (doc ML) =====
    // ✅ CORREÇÃO: shipping é objeto, não array
    tipo_envio_devolucao: returnData?.shipping?.type || null,
    destino_devolucao: returnData?.shipping?.destination?.name || null,
    endereco_destino_devolucao: returnData?.shipping?.destination?.shipping_address?.address_line || null,
    rua_destino: returnData?.shipping?.destination?.shipping_address?.street_name || null,
    numero_destino: returnData?.shipping?.destination?.shipping_address?.street_number || null,
    cidade_destino: returnData?.shipping?.destination?.shipping_address?.city?.name || null,
    estado_destino: returnData?.shipping?.destination?.shipping_address?.state?.name || null,
    cep_destino: returnData?.shipping?.destination?.shipping_address?.zip_code || null,
    bairro_destino: returnData?.shipping?.destination?.shipping_address?.neighborhood?.name || null,
    
    // ===== REVIEW =====
    review_id: claim.review_details?.id || claim.review?.id || null,
    review_status: claim.review_details?.status || claim.review?.status || null,
    review_type: claim.review_details?.type || claim.review?.type || null,
    revisor_responsavel: claim.review_details?.reviewer?.id || claim.review?.reviewer_id || null,
    
    // ===== DADOS COMPLETOS DO REVIEW (JSONB) =====
    dados_reviews: (() => {
      const reviewData = claim.review_details;
      if (!reviewData || !reviewData.reviews || reviewData.reviews.length === 0) {
        return null;
      }
      
      const firstReview = reviewData.reviews[0];
      const resourceReview = firstReview.resource_reviews?.[0];
      
      return {
        resource: firstReview.resource || null,
        resource_id: firstReview.resource_id?.toString() || null,
        method: firstReview.method || null,
        date_created: firstReview.date_created || null,
        last_updated: firstReview.last_updated || null,
        stage: resourceReview?.stage || null,
        status: resourceReview?.status || null,
        product_condition: resourceReview?.product_condition || null,
        product_destination: resourceReview?.product_destination || null,
        reason_id: resourceReview?.reason_id || null,
        benefited: resourceReview?.benefited || null,
        seller_status: resourceReview?.seller_status || null,
        seller_reason: resourceReview?.seller_reason || null,
        missing_quantity: resourceReview?.missing_quantity || null
      };
    })(),
    
    // ===== DATAS CRÍTICAS (conforme doc ML) =====
    data_inicio_return: returnData?.date_created || null,
    data_ultima_atualizacao_return: returnData?.last_updated || null,
    data_fechamento_devolucao: returnData?.date_closed || null,
    prazo_limite_analise: returnData?.estimated_handling_limit?.date || null,
    
    // 🎯 DATA DE CHEGADA: Vem do serviço ReturnArrivalDateService
    // Busca no histórico do shipment de devolução (status 'delivered')
    data_chegada_produto: (() => {
      // ✅ Pegar claim ID correto para logs
      const claimId = claim.id || claim.claim_details?.id || item.id || 'unknown';
      console.log(`📅 [TrackingMapper] Claim ${claimId}: data_chegada_produto=${claim.data_chegada_produto || item.data_chegada_produto || 'NULL'}`);
      
      // Prioridade 1: Usar campo enriquecido pelo serviço (pode estar em item ou claim)
      const arrivedDate = item.data_chegada_produto || claim.data_chegada_produto;
      if (arrivedDate) {
        console.log(`📅 [TrackingMapper] ✅ Usando data do serviço: ${arrivedDate}`);
        return arrivedDate;
      }
      
      // Fallback: tentar extrair do enriched history
      const enrichedHistory = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (enrichedHistory && Array.isArray(enrichedHistory)) {
        const deliveredEvent = enrichedHistory.find((event: any) => 
          event.status === 'delivered' || 
          event.checkpoint?.toLowerCase().includes('delivered') ||
          event.checkpoint?.toLowerCase().includes('entregue')
        );
        if (deliveredEvent) {
          const date = deliveredEvent.date || deliveredEvent.checkpoint_date || null;
          console.log(`📅 [TrackingMapper] ✅ Usando data do enriched history: ${date}`);
          return date;
        }
      }
      
      // Fallback 2: tentar do return_details_v2
      const returnHistory = returnData?.status_history;
      if (returnHistory && Array.isArray(returnHistory)) {
        const deliveredEvent = returnHistory.find((event: any) => 
          event.status === 'delivered'
        );
        if (deliveredEvent?.date) {
          console.log(`📅 [TrackingMapper] ✅ Usando data do return_details_v2: ${deliveredEvent.date}`);
          return deliveredEvent.date;
        }
      }
      
      console.log(`📅 [TrackingMapper] ❌ Nenhuma data encontrada para claim ${claim.id}`);
      return null;
    })(),
    
    estimated_delivery_date: returnData?.estimated_delivery_date || null,
    
    // ===== TRANSPORTADORA =====
    carrier_name: claim.shipping?.carrier_name || claim.shipment_history_enriched?.carrier || null,
    carrier_tracking_url: claim.shipping?.carrier_tracking_url || claim.shipment_history_enriched?.tracking_url || null,
    shipping_option_name: claim.shipping?.option_name || claim.shipment_history_enriched?.shipping_option || null,
    estimated_delivery_time: claim.shipping?.estimated_delivery_time?.date || claim.shipment_history_enriched?.estimated_delivery?.date || null,
    estimated_delivery_time_type: claim.shipping?.estimated_delivery_time?.type || claim.shipment_history_enriched?.estimated_delivery?.type || null,
    shipping_method_name: claim.shipping?.method?.name || claim.shipment_history_enriched?.method || null,
    status_history: claim.shipment_history_enriched?.status_history || null,

    // ===== CÁLCULOS =====
    has_delay: (() => {
      const estimatedDate = returnData?.estimated_delivery_date || returnData?.estimated_delivery_limit?.date;
      if (!estimatedDate) return null;
      return new Date() > new Date(estimatedDate);
    })(),
    
    return_quantity: returnData?.quantity || claim.quantity || 1,
    
    total_quantity: (() => {
      const orderItems = claim.order_data?.order_items || [];
      if (orderItems.length === 0) return returnData?.quantity || 1;
      return orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    })(),
    
    dias_restantes_analise: (() => {
      const prazo = returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date;
      if (!prazo) return null;
      const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    // ===== LOCALIZAÇÃO E TRACKING AVANÇADO =====
    localizacao_atual_produto: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.location || latest?.checkpoint_description || null;
    })(),
    
    status_transporte_atual: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.status || latest?.checkpoint || null;
    })(),
    
    tempo_transito_dias: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length < 2) return null;
      const first = new Date(history[0].date || history[0].checkpoint_date);
      const last = new Date(history[history.length - 1].date || history[history.length - 1].checkpoint_date);
      return Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
    })(),
    
    previsao_chegada_vendedor: returnData?.estimated_delivery_date || null,
    
    // ===== CAMPOS DETALHADOS (TrackingDetailedCells) =====
    estimated_delivery_limit: returnData?.estimated_delivery_limit?.date || null,
    
    // ✅ CORREÇÃO: shipping.status (singular)
    shipment_status: returnData?.shipping?.status || null,
    refund_at: returnData?.refund_at || null,
    review_method: claim.review_details?.method || claim.review?.method || null,
    review_stage: claim.review_details?.stage || claim.review?.stage || null,
    localizacao_atual: claim.shipment_history_enriched?.status_history?.[0]?.location || null,
    
    tracking_history: claim.shipment_history_enriched?.status_history || [],
    tracking_events: claim.tracking_info?.events || [],
    
    // ✅ ÚNICA FONTE: última movimentação vem do tracking history
    data_ultima_movimentacao: claim.shipment_history_enriched?.status_history?.[0]?.date || null,
  };
};
