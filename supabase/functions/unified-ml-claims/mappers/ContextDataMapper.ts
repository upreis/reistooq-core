/**
 * 🔄 MAPEADOR DE DADOS CONTEXTUAIS
 * Consolida: mediação, troca, dados adicionais
 */

export const mapContextData = (item: any) => {
  const claim = item;
  return {
    // ===== MEDIAÇÃO =====
    em_mediacao: claim.type === 'meditations' || claim.stage === 'dispute',
    data_inicio_mediacao: null, // ❌ ML não fornece data específica de início de mediação
    escalado_para_ml: claim.type === 'meditations' || claim.stage === 'dispute',
    mediador_ml: claim.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
    
    // ===== TROCA =====
    eh_troca: claim.change_details?.type === 'change' || claim.change_details?.type === 'replace' || false,
    data_estimada_troca: claim.change_details?.estimated_exchange_date?.from || 
                         claim.change_details?.estimated_exchange_date?.to || null,
    data_limite_troca: claim.change_details?.estimated_exchange_date?.to || null,
    
    // ===== COMPRADOR =====
    comprador_cpf: claim.billing_info?.doc_number || 
                   claim.order_data?.buyer?.billing_info?.doc_number || null,
    comprador_nome_completo: claim.order_data?.buyer?.first_name && claim.order_data?.buyer?.last_name 
      ? `${claim.order_data.buyer.first_name} ${claim.order_data.buyer.last_name}`.trim()
      : claim.order_data?.buyer?.nickname || null,
    comprador_nickname: claim.order_data?.buyer?.nickname || null,
    
    // ===== DADOS ADICIONAIS =====
    tags_automaticas: [],
    hash_verificacao: null,
    versao_api_utilizada: null,
    origem_timeline: null,
    status_produto_novo: null,
    endereco_destino: null,
    valor_diferenca_troca: claim.resolution?.exchange_difference || null,
    data_vencimento_acao: claim.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    
    // ===== MEDIAÇÃO DETALHADOS =====
    resultado_mediacao: claim.resolution?.reason || null,
    detalhes_mediacao: claim.resolution?.details || claim.resolution?.description || null,
    produto_troca_id: claim.change_details?.items?.[0]?.id || null,
    novo_pedido_id: claim.change_details?.new_orders_ids?.[0] || null,
    
    dias_restantes_acao: (() => {
      const dueDate = claim.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date;
      if (!dueDate) return null;
      const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    prazo_revisao_dias: (() => {
      const prazo = claim.return_details?.estimated_handling_limit?.date;
      if (!prazo) return null;
      const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    usuario_ultima_acao: claim.last_updated_by || null
  };
};
