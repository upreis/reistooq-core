/**
 * 📦 MAPEADOR DE DADOS DE RASTREAMENTO - VERSÃO COMPLETA
 * Extrai TODOS os 10 campos de tracking detalhados de nível superior
 * Elimina objetos JSONB aninhados - apenas campos individuais
 */

export const mapTrackingData = (item: any) => {
  // ✅ CORREÇÃO: Usar dados do claim diretamente
  const claim = item.claim_details || item;
  const returnData = item.return_details_v2 || claim.return_details;
  
  return {
    // ===== CAMPOS DE RASTREAMENTO BÁSICOS (já existentes) =====
    tracking_number: returnData?.tracking_number || claim.tracking_number || null,
    tracking_status: returnData?.status || claim.status || null,
    codigo_rastreamento: returnData?.tracking_number || claim.tracking_number || null,
    tracking_method: returnData?.tracking_method || claim.tracking_method || null,
    
    // Review básico
    review_id: item.review_details?.id || claim.review?.id || null,
    review_status: item.review_details?.status || claim.review?.status || null,
    review_type: item.review_details?.type || claim.review?.type || null,
    revisor_responsavel: item.review_details?.reviewer?.id || claim.review?.reviewer_id || null,
    
    // Datas e prazos
    data_fechamento_devolucao: returnData?.closed_at || claim.date_closed || null,
    prazo_limite_analise: returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date || null,
    
    // ===== CAMPOS PRIORIDADE ALTA (já implementados) =====
    estimated_delivery_date: returnData?.estimated_delivery_date || claim.estimated_delivery_date || null,
    
    has_delay: (() => {
      const estimatedDate = returnData?.estimated_delivery_date || claim.estimated_delivery_date;
      if (!estimatedDate) return null;
      const estimated = new Date(estimatedDate);
      const now = new Date();
      return now > estimated;
    })(),
    
    return_quantity: returnData?.quantity || claim.quantity || 1,
    
    total_quantity: (() => {
      const orderItems = item.order_data?.order_items || [];
      if (orderItems.length === 0) return returnData?.quantity || claim.quantity || 1;
      return orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    })(),
    
    dias_restantes_analise: (() => {
      const prazo = returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date;
      if (!prazo) return null;
      const prazoDate = new Date(prazo);
      const hoje = new Date();
      const diff = Math.ceil((prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    // ===== 🆕 10 CAMPOS DE TRACKING DETALHADOS (nível superior individual) =====
    
    // 1. Estimated Delivery Limit (prazo limite de entrega)
    estimated_delivery_limit: returnData?.estimated_delivery_limit?.date || returnData?.estimated_delivery_date || null,
    
    // 2. Shipment Status (status do envio)
    shipment_status: item.shipment_data?.status || claim.shipment_status || null,
    
    // 3. Refund At (data real de reembolso)
    refund_at: returnData?.refund_at || claim.resolution?.refund_date || null,
    
    // 4. Review Method (método de revisão)
    review_method: returnData?.review_method || claim.review_method || null,
    
    // 5. Review Stage (estágio da revisão)
    review_stage: returnData?.review_stage || claim.review_stage || null,
    
    // 6. Localização Atual (do shipment_history_enriched)
    localizacao_atual: (() => {
      const history = item.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.location || latest?.checkpoint_description || null;
    })(),
    
    // 7. Status Transporte Atual (do shipment_history_enriched)
    status_transporte_atual: (() => {
      const history = item.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.status || latest?.checkpoint_status || null;
    })(),
    
    // 8. Tracking History (array completo de eventos)
    tracking_history: item.shipment_history_enriched?.return_shipment?.tracking_history || 
                      item.shipment_data?.tracking_history || [],
    
    // 9. Tracking Events (eventos de rastreamento formatados)
    tracking_events: item.shipment_history_enriched?.return_shipment?.tracking_events || 
                     item.shipment_data?.tracking_events || [],
    
    // 10. Data Última Movimentação (extraído do último evento do tracking_history)
    data_ultima_movimentacao: (() => {
      const history = item.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.date || latest?.checkpoint_date || null;
    })()
  };
};
