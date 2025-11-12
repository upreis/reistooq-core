/**
 * 📦 MAPEADOR DE DADOS DE RASTREAMENTO - VERSÃO COMPLETA
 * Extrai TODOS os 10 campos de tracking detalhados de nível superior
 * Elimina objetos JSONB aninhados - apenas campos individuais
 */

export const mapTrackingData = (item: any) => {
  // ✅ ACESSO DIRETO ao claim
  const claim = item;
  const returnData = claim.return_details_v2 || claim.return_details;
  
  // 🐛 DEBUG: Log dados de tracking recebidos
  console.log('📦 TrackingDataMapper - Dados recebidos:', JSON.stringify({
    claim_id: claim.id,
    has_return_details: !!returnData,
    has_return_details_v2: !!claim.return_details_v2,
    has_shipment_history: !!claim.shipment_history_enriched,
    return_status: returnData?.status,
    shipments_count: returnData?.shipments?.length || 0,
    first_shipment_status: returnData?.shipments?.[0]?.status
  }));
  
  return {
    // ===== 🆕 TODOS OS 4 TIPOS DE STATUS =====
    
    // 1. Status Return (status da devolução - 14 estados possíveis)
    status_return: returnData?.status || null,
    
    // 2. Status Money (já existente, mantido)
    // Mapeado em FinancialDataMapper
    
    // 3. Status Shipment (status do envio - corrigido para usar shipments[0].status)
    status_envio: returnData?.shipments?.[0]?.status || claim.shipment_data?.status || null,
    
    // 4. Status Claim (status da reclamação - mapeado em BasicDataMapper)
    
    // ===== RASTREAMENTO BÁSICO =====
    tracking_number: returnData?.tracking_number || returnData?.shipments?.[0]?.tracking_number || claim.tracking_number || null,
    tracking_status: returnData?.status || claim.status || null,
    codigo_rastreamento: returnData?.tracking_number || claim.tracking_number || null,
    tracking_method: returnData?.tracking_method || claim.tracking_method || null,
    
    // Review
    review_id: claim.review_details?.id || claim.review?.id || null,
    review_status: claim.review_details?.status || claim.review?.status || null,
    review_type: claim.review_details?.type || claim.review?.type || null,
    revisor_responsavel: claim.review_details?.reviewer?.id || claim.review?.reviewer_id || null,
    
    // 📅 FASE 1: Datas críticas para gestão de devolução
    data_fechamento_devolucao: returnData?.closed_at || claim.date_closed || null,
    prazo_limite_analise: returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date || null,
    
    // ===== CAMPOS PRIORIDADE ALTA =====
    estimated_delivery_date: returnData?.estimated_delivery_date || returnData?.estimated_delivery_limit?.date || null,
    
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
    
    // 🚨 FASE 1: Cálculo de urgência - dias restantes para análise
    dias_restantes_analise: (() => {
      const prazo = returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date;
      if (!prazo) return null;
      const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    
    // ===== 🆕 FASE 2: SHIPPING AVANÇADO (4 campos críticos) =====
    
    // 1. 📍 Localização Atual do Produto (última movimentação)
    localizacao_atual_produto: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.location || latest?.checkpoint_description || null;
    })(),
    
    // 2. 🚚 Status Transporte Atual
    status_transporte_atual: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.status || latest?.checkpoint_status || null;
    })(),
    
    // 3. ⏱️ Tempo em Trânsito (dias desde primeira movimentação)
    tempo_transito_dias: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      
      const firstEvent = history[0];
      const lastEvent = history[history.length - 1];
      
      const firstDate = new Date(firstEvent?.date || firstEvent?.checkpoint_date);
      const lastDate = new Date(lastEvent?.date || lastEvent?.checkpoint_date);
      
      if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) return null;
      
      const diffDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : null;
    })(),
    
    // 4. 📅 Previsão de Chegada ao Vendedor
    previsao_chegada_vendedor: returnData?.estimated_delivery_date || 
                                 returnData?.estimated_delivery_limit?.date || null,
    
    // ===== CAMPOS DETALHADOS DE TRACKING (já existentes) =====
    estimated_delivery_limit: returnData?.estimated_delivery_limit?.date || null,
    shipment_status: claim.shipment_data?.status || claim.shipment_status || null,
    refund_at: returnData?.refund_at || claim.resolution?.refund_date || null,
    review_method: returnData?.review_method || claim.review_method || null,
    review_stage: returnData?.review_stage || claim.review_stage || null,
    
    // Localização e status já implementados acima (FASE 2)
    localizacao_atual: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.location || latest?.checkpoint_description || null;
    })(),
    
    tracking_history: claim.shipment_history_enriched?.return_shipment?.tracking_history || 
                      claim.shipment_data?.tracking_history || [],
    
    tracking_events: claim.shipment_history_enriched?.return_shipment?.tracking_events || 
                     claim.shipment_data?.tracking_events || [],
    
    data_ultima_movimentacao: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.date || latest?.checkpoint_date || null;
    })()
  };
  
  // 🐛 DEBUG: Log campos extraídos
  const result = {
    estimated_delivery_date: returnData?.estimated_delivery_date || returnData?.estimated_delivery_limit?.date || null,
    has_delay: (() => {
      const estimatedDate = returnData?.estimated_delivery_date || returnData?.estimated_delivery_limit?.date;
      if (!estimatedDate) return null;
      return new Date() > new Date(estimatedDate);
    })(),
    localizacao_atual_produto: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.location || latest?.checkpoint_description || null;
    })()
  };
  
  console.log('📦 TrackingDataMapper - Campos extraídos:', JSON.stringify({
    claim_id: claim.id,
    estimated_delivery_date: result.estimated_delivery_date,
    has_delay: result.has_delay,
    localizacao_atual: result.localizacao_atual_produto?.substring(0, 50)
  }));
  
  return {
    // ===== RASTREAMENTO BÁSICO =====
    tracking_number: returnData?.tracking_number || claim.tracking_number || null,
    tracking_status: returnData?.status || claim.status || null,
    codigo_rastreamento: returnData?.tracking_number || claim.tracking_number || null,
    tracking_method: returnData?.tracking_method || claim.tracking_method || null,
    
    // Review
    review_id: claim.review_details?.id || claim.review?.id || null,
    review_status: claim.review_details?.status || claim.review?.status || null,
    review_type: claim.review_details?.type || claim.review?.type || null,
    revisor_responsavel: claim.review_details?.reviewer?.id || claim.review?.reviewer_id || null,
    
    // 📅 FASE 1: Datas críticas para gestão de devolução
    data_fechamento_devolucao: returnData?.closed_at || claim.date_closed || null,
    prazo_limite_analise: returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date || null,
    
    // ===== CAMPOS PRIORIDADE ALTA =====
    estimated_delivery_date: result.estimated_delivery_date,
    has_delay: result.has_delay,
    return_quantity: returnData?.quantity || claim.quantity || 1,
    
    total_quantity: (() => {
      const orderItems = claim.order_data?.order_items || [];
      if (orderItems.length === 0) return returnData?.quantity || 1;
      return orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    })(),
    
    // 🚨 FASE 1: Cálculo de urgência - dias restantes para análise
    dias_restantes_analise: (() => {
      const prazo = returnData?.estimated_handling_limit?.date || returnData?.estimated_delivery_date;
      if (!prazo) return null;
      const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    
    // ===== 🆕 FASE 2: SHIPPING AVANÇADO (4 campos críticos) =====
    
    // 1. 📍 Localização Atual do Produto (última movimentação)
    localizacao_atual_produto: result.localizacao_atual_produto,
    
    // 2. 🚚 Status Transporte Atual
    status_transporte_atual: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.status || latest?.checkpoint_status || null;
    })(),
    
    // 3. ⏱️ Tempo em Trânsito (dias desde primeira movimentação)
    tempo_transito_dias: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      
      const firstEvent = history[0];
      const lastEvent = history[history.length - 1];
      
      const firstDate = new Date(firstEvent?.date || firstEvent?.checkpoint_date);
      const lastDate = new Date(lastEvent?.date || lastEvent?.checkpoint_date);
      
      if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) return null;
      
      const diffDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : null;
    })(),
    
    // 4. 📅 Previsão de Chegada ao Vendedor
    previsao_chegada_vendedor: returnData?.estimated_delivery_date || 
                                 returnData?.estimated_delivery_limit?.date || null,
    
    // ===== CAMPOS DETALHADOS DE TRACKING (já existentes) =====
    estimated_delivery_limit: returnData?.estimated_delivery_limit?.date || null,
    shipment_status: claim.shipment_data?.status || claim.shipment_status || null,
    refund_at: returnData?.refund_at || claim.resolution?.refund_date || null,
    review_method: returnData?.review_method || claim.review_method || null,
    review_stage: returnData?.review_stage || claim.review_stage || null,
    
    // Localização e status já implementados acima (FASE 2)
    localizacao_atual: result.localizacao_atual_produto,
    
    tracking_history: claim.shipment_history_enriched?.return_shipment?.tracking_history || 
                      claim.shipment_data?.tracking_history || [],
    
    tracking_events: claim.shipment_history_enriched?.return_shipment?.tracking_events || 
                     claim.shipment_data?.tracking_events || [],
    
    data_ultima_movimentacao: (() => {
      const history = claim.shipment_history_enriched?.return_shipment?.tracking_history;
      if (!history || !Array.isArray(history) || history.length === 0) return null;
      const latest = history[history.length - 1];
      return latest?.date || latest?.checkpoint_date || null;
    })()
  };
};
