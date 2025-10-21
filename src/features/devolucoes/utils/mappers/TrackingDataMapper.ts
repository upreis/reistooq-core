/**
 * 🚚 MAPEADOR DE DADOS DE RASTREAMENTO
 * Consolida: rastreamento e review
 */

export const mapTrackingData = (item: any) => {
  return {
    // Rastreamento
    shipment_id: item.order_data?.shipping?.id?.toString() || null,
    codigo_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
    codigo_rastreamento_devolucao: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
    transportadora: item.return_details_v2?.shipments?.[0]?.carrier || null,
    transportadora_devolucao: item.return_details_v2?.shipments?.[0]?.carrier || null,
    status_rastreamento: item.return_details_v2?.shipments?.[0]?.status || null,
    url_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_url || null,
    localizacao_atual: item.tracking_history?.[0]?.location || null,
    status_transporte_atual: item.return_details_v2?.shipments?.[0]?.substatus || null,
    tracking_history: item.tracking_history || [],
    tracking_events: item.tracking_events || [],
    data_ultima_movimentacao: item.tracking_events?.[0]?.date || item.tracking_history?.[0]?.date || null,
    historico_localizacoes: item.tracking_history || [],
    carrier_info: null,
    tempo_transito_dias: null,
    shipment_delays: [],
    shipment_costs: null,
    previsao_entrega_vendedor: item.return_details_v2?.estimated_delivery_date || null,
    
    // Review
    review_id: item.review_id || item.claim_details?.review?.id?.toString() || null,
    review_status: item.review_status || item.claim_details?.review?.status || null,
    review_result: item.review_result || item.claim_details?.review?.result || null,
    score_qualidade: item.review_score || item.claim_details?.review?.score || null,
    necessita_acao_manual: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
    problemas_encontrados: item.problemas_encontrados || [],
    acoes_necessarias_review: [],
    data_inicio_review: item.claim_details?.date_created || null,
    observacoes_review: item.claim_details?.resolution?.reason || null,
    revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null
  };
};
