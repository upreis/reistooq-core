/**
 * 🚚 MAPEADOR DE DADOS DE RASTREAMENTO
 * Consolida: rastreamento e review
 */

export const mapTrackingData = (item: any) => {
  return {
    // ✅ FASE 1.5: ID único do return
    return_id: item.return_details_v2?.id?.toString() || 
               item.return_details_v1?.id?.toString() || null,
    
    // Rastreamento
    shipment_id: item.order_data?.shipping?.id?.toString() || 
                 item.return_details_v2?.shipments?.[0]?.id?.toString() || null,
    codigo_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_number || 
                        item.order_data?.shipping?.tracking_number || null,
    codigo_rastreamento_devolucao: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
    transportadora: item.return_details_v2?.shipments?.[0]?.carrier || 
                   item.order_data?.shipping?.carrier || null,
    transportadora_devolucao: item.return_details_v2?.shipments?.[0]?.carrier || null,
    status_rastreamento: item.return_details_v2?.shipments?.[0]?.status || 
                        item.return_details_v2?.shipments?.[0]?.substatus || null,
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
    
    // ✅ FASE 1: Novos campos de devolução
    status_devolucao: item.return_details_v2?.status || null,
    subtipo_devolucao: item.return_details_v2?.subtype || null,
    
    // 📅 DATAS - API ML
    // ⚠️ NOTA: data_ultimo_update e data_atualizacao_devolucao NÃO EXISTEM no banco
    // São calculados em tempo real e não persistidos
    data_ultimo_update: item.claim_details?.last_updated || 
                       item.return_details_v2?.last_updated || null,
    data_atualizacao_devolucao: item.return_details_v2?.last_updated || 
                               item.return_details_v1?.last_updated || null,
    data_ultimo_status: item.return_details_v2?.shipments?.[0]?.status_history?.[0]?.date || null,
    data_criacao_devolucao: item.return_details_v2?.date_created || 
                           item.return_details_v1?.date_created || null,
    
    // 📦 LOGÍSTICA ADICIONAL
    shipment_id_devolucao: item.return_details_v2?.shipments?.[0]?.id?.toString() || null,
    endereco_destino_devolucao: item.return_details_v2?.shipments?.[0]?.destination_address || null,
    descricao_ultimo_status: item.return_details_v2?.shipments?.[0]?.substatus_description || 
                            item.return_details_v2?.shipments?.[0]?.status_description || null,
    
    // Review
    review_id: item.review_id || item.claim_details?.review?.id?.toString() || null,
    review_status: item.review_status || item.claim_details?.review?.status || null,
    review_result: item.review_result || item.claim_details?.review?.result || null,
    score_qualidade: item.review_score || item.claim_details?.review?.score || null,
    necessita_acao_manual: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
    problemas_encontrados: item.problemas_encontrados || [],
    data_inicio_review: item.claim_details?.created_date || null,
    observacoes_review: item.claim_details?.resolution?.reason || null,
    revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null
  };
};
