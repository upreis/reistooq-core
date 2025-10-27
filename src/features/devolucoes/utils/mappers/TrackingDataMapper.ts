/**
 * 🚚 MAPEADOR DE DADOS DE RASTREAMENTO
 * Consolida: rastreamento e review
 */

export const mapTrackingData = (item: any) => {
  // ✅ CORRIGIDO: shipments é array, pegar primeiro shipment (type: "return")
  const returnShipment = item.return_details_v2?.shipments?.find((s: any) => s.type === 'return') || 
                        item.return_details_v2?.shipments?.[0];
  
  return {
    // ✅ FASE 1.5: ID único do return
    return_id: item.return_details_v2?.id?.toString() || null,
    
    // Rastreamento (✅ CORRIGIDO: usar shipments array)
    shipment_id: returnShipment?.shipment_id?.toString() || 
                 item.order_data?.shipping?.id?.toString() || null,
    codigo_rastreamento: returnShipment?.tracking_number || 
                        item.order_data?.shipping?.tracking_number || null,
    codigo_rastreamento_devolucao: returnShipment?.tracking_number || null,
    transportadora: null, // Não disponível em v2
    transportadora_devolucao: null,
    // ✅ CORRIGIDO: status vem de shipments[].status com fallback robusto
    // Valores: pending, ready_to_ship, shipped, not_delivered, delivered, cancelled
    status_rastreamento: returnShipment?.status || 
                        item.return_details_v2?.shipments?.[0]?.status || 
                        item.order_data?.shipping?.status || null,
    url_rastreamento: null, // Não disponível em v2
    localizacao_atual: item.tracking_history?.[0]?.location || null,
    status_transporte_atual: returnShipment?.status || null,
    tracking_history: item.tracking_history || [],
    tracking_events: item.tracking_events || [],
    data_ultima_movimentacao: item.tracking_events?.[0]?.date || item.tracking_history?.[0]?.date || null,
    historico_localizacoes: item.tracking_history || [],
    carrier_info: null,
    tempo_transito_dias: null,
    shipment_delays: [],
    shipment_costs: null,
    previsao_entrega_vendedor: null, // Removido em v2
    
    // ✅ FASE 1: Novos campos de devolução
    status_devolucao: item.return_details_v2?.status || null,
    subtipo_devolucao: item.return_details_v2?.subtype || null, // low_cost, return_partial, return_total
    
    // 📅 DATAS - API ML
    last_updated: item.claim_details?.last_updated || 
                  item.return_details_v2?.last_updated || null,
    data_atualizacao_devolucao: item.return_details_v2?.last_updated || null,
    data_ultimo_status: item.shipment_history?.combined_events?.[0]?.date_created || null,
    data_criacao_devolucao: item.return_details_v2?.date_created || null,
    
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
    descricao_ultimo_status: item.shipment_history?.history?.[0]?.description || 
                            item.tracking_events?.[0]?.description || 
                            item.tracking_history?.[0]?.description || 
                            returnShipment?.substatus || 
                            null,
    
    // ✅ Review (agora endpoint separado: GET /returns/$RETURN_ID/reviews)
    review_id: item.review_id || null,
    review_status: item.review_status || null,
    review_result: item.review_result || null,
    score_qualidade: item.review?.score || null,
    necessita_acao_manual: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
    problemas_encontrados: item.problemas_encontrados || [],
    data_inicio_review: item.claim_details?.date_created || null,
    observacoes_review: item.claim_details?.resolution?.reason || null,
    revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null
  };
};
