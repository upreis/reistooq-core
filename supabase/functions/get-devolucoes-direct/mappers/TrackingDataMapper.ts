/**
 * 🚚 MAPEADOR DE DADOS DE RASTREAMENTO
 * Consolida: rastreamento e review
 */

export const mapTrackingData = (item: any) => {
  // ✅ CORRIGIDO: shipments é array, pegar primeiro shipment (type: "return")
  const returnShipment = item.return_details_v2?.shipments?.find((s: any) => s.type === 'return') || 
                        item.return_details_v2?.shipments?.[0];
  
  // 🆕 PRIORIDADE: Usar tracking real da API se disponível
  const originalTracking = item.shipment_tracking?.original_tracking?.tracking_number || 
                          item.order_data?.shipping?.tracking_number || 
                          returnShipment?.tracking_number;
  
  const returnTracking = item.shipment_tracking?.return_tracking?.tracking_number || 
                        returnShipment?.tracking_number;
  
  // ✅ FASE 2: Extrair quantidade do primeiro item do pedido
  const firstOrderItem = item.return_details_v2?.orders?.[0];
  
  return {
    // ✅ FASE 1.5: ID único do return
    return_id: item.return_details_v2?.id?.toString() || null,
    
    // Rastreamento (✅ CORRIGIDO: usar tracking real da API primeiro)
    shipment_id: returnShipment?.shipment_id?.toString() || 
                 item.order_data?.shipping?.id?.toString() || null,
    codigo_rastreamento: originalTracking || null,
    codigo_rastreamento_devolucao: returnTracking || null,
    transportadora: null, // Não disponível em v2
    transportadora_devolucao: null,
    // ✅ CORRIGIDO: status vem de shipments[].status com fallback robusto
    // Valores: pending, ready_to_ship, shipped, not_delivered, delivered, cancelled
    status_rastreamento: returnShipment?.status || 
                        item.return_details_v2?.shipments?.[0]?.status || 
                        item.order_data?.shipping?.status || null,
    url_rastreamento: null, // Não disponível em v2
    localizacao_atual: item.shipment_history_enriched?.return_shipment?.current_location || 
                       item.tracking_history?.[0]?.location || null,
    status_transporte_atual: returnShipment?.status || null,
    tracking_history: item.shipment_history_enriched?.return_shipment?.events || 
                     item.tracking_history || [],
    tracking_events: item.tracking_events || [],
    data_ultima_movimentacao: item.shipment_history_enriched?.return_shipment?.last_event?.date_created ||
                             item.tracking_events?.[0]?.date || 
                             item.tracking_history?.[0]?.date || null,
    historico_localizacoes: item.shipment_history_enriched?.return_shipment?.events || 
                           item.tracking_history || [],
    carrier_info: null,
    
    // 🆕 FASE 2: Dados enriquecidos de rastreamento
    tempo_transito_dias: item.shipment_history_enriched?.return_shipment?.transit_time_days || null,
    shipment_delays: item.shipment_history_enriched?.return_shipment?.delays || [],
    total_tracking_events: item.shipment_history_enriched?.return_shipment?.total_events || 0,
    primeiro_evento_rastreamento: item.shipment_history_enriched?.return_shipment?.first_event || null,
    ultimo_evento_rastreamento: item.shipment_history_enriched?.return_shipment?.last_event || null,
    
    // 🆕 PRIORIDADE ALTA: Data estimada de entrega ao vendedor
    estimated_delivery_date: item.return_details_v2?.estimated_delivery?.from || 
                            item.return_details_v2?.estimated_delivery?.to ||
                            item.shipment_history_enriched?.estimated_delivery_date || null,
    
    // 🆕 PRIORIDADE ALTA: Indica se há atraso no envio
    has_delay: (() => {
      const estimatedDate = item.return_details_v2?.estimated_delivery?.to || 
                           item.shipment_history_enriched?.estimated_delivery_date;
      if (!estimatedDate) return null;
      
      const now = new Date();
      const estimated = new Date(estimatedDate);
      const isDelayed = now > estimated && 
                       returnShipment?.status !== 'delivered' && 
                       returnShipment?.status !== 'cancelled';
      
      return isDelayed || item.shipment_history_enriched?.has_delay || false;
    })(),
    
    // 🆕 PRIORIDADE ALTA: Quantidades (devolvida vs. total)
    return_quantity: item.return_details_v2?.orders?.[0]?.quantity || 
                    item.quantity || 
                    firstOrderItem?.quantity || null,
    total_quantity: item.order_data?.order_items?.[0]?.quantity || null,
    
    // Custos de envio enriquecidos
    shipment_costs: item.shipping_costs_enriched || null,
    previsao_entrega_vendedor: item.return_details_v2?.estimated_delivery?.to || null,
    
    // ✅ FASE 1: Novos campos de devolução
    status_devolucao: item.return_details_v2?.status || null,
    subtipo_devolucao: item.return_details_v2?.subtype || null, // low_cost, return_partial, return_total
    
    // 📅 DATAS - API ML
    last_updated: item.claim_details?.last_updated || 
                  item.return_details_v2?.last_updated || null,
    data_atualizacao_devolucao: item.return_details_v2?.last_updated || null,
    data_ultimo_status: item.shipment_history?.combined_events?.[0]?.date_created || null,
    data_criacao_devolucao: item.return_details_v2?.date_created || null,
    
    // 📅 FASE 1: Datas críticas da devolução
    data_fechamento_devolucao: item.return_details_v2?.closed_at || null,
    prazo_limite_analise: item.return_details_v2?.estimated_handling_limit?.date || null,
    dias_restantes_analise: (() => {
      const prazo = item.return_details_v2?.estimated_handling_limit?.date;
      if (!prazo) return null;
      
      const prazoDate = new Date(prazo);
      const hoje = new Date();
      const diffTime = prazoDate.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
    })(),
    
    // 📦 LOGÍSTICA ADICIONAL (✅ CORRIGIDO: usar destination.shipping_address)
    shipment_id_devolucao: returnShipment?.shipment_id?.toString() || null,
    endereco_destino_devolucao: (() => {
      const addr = returnShipment?.destination?.shipping_address;
      if (!addr || typeof addr !== 'object') return null;
      
      const parts = [
        addr.street_name,
        addr.street_number,
        addr.city?.name,
        addr.state?.id || addr.state?.name
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : null;
    })(),
    descricao_ultimo_status: (() => {
      // 1. Se claim está fechado, usar o motivo da resolução
      if (item.claim_details?.resolution?.reason) {
        return item.claim_details.resolution.reason;
      }
      
      // 2. Se há devolução, usar o status dela
      if (item.return_details_v2?.status) {
        return item.return_details_v2.status;
      }
      
      // 3. Usar substatus do shipment de devolução
      if (returnShipment?.substatus) {
        return returnShipment.substatus;
      }
      
      // 4. Usar stage do claim como fallback
      if (item.claim_details?.stage) {
        return item.claim_details.stage;
      }
      
      return null;
    })(),
    
    // ✅ Review (agora endpoint separado: GET /returns/$RETURN_ID/reviews)
    review_id: item.review_id || null,
    review_status: item.review_status || null,
    review_result: item.review_result || null,
    score_qualidade: item.review?.score || null,
    necessita_acao_manual: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
    problemas_encontrados: item.problemas_encontrados || [],
    data_inicio_review: item.claim_details?.date_created || null,
    observacoes_review: item.claim_details?.resolution?.reason || null,
    revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
    
    // ✅ FASE 2: Novos campos que JÁ vem da API (ml-returns edge function)
    estimated_delivery_date: item.estimated_delivery_date || null,
    estimated_delivery_limit: item.estimated_delivery_limit || null,
    has_delay: item.has_delay || false,
    shipment_status: item.shipment_status || returnShipment?.status || null,
    refund_at: item.refund_at || null,
    review_method: item.review_method || null,
    review_stage: item.review_stage || null,
    return_quantity: firstOrderItem?.return_quantity ? parseInt(firstOrderItem.return_quantity) : null,
    total_quantity: firstOrderItem?.total_quantity ? parseInt(firstOrderItem.total_quantity) : null,
  };
};
