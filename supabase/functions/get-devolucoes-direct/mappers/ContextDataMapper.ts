/**
 * 🔄 MAPEADOR DE DADOS CONTEXTUAIS
 * Consolida: mediação, troca, dados adicionais
 */

export const mapContextData = (item: any) => {
  return {
    // Mediação (✅ CORRIGIDO: meditations com T)
    em_mediacao: item.claim_details?.type === 'meditations' || item.claim_details?.stage === 'dispute',
    data_inicio_mediacao: item.claim_details?.date_created || null,
    mediador_ml: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
    resultado_mediacao: item.claim_details?.resolution?.reason || null,
    detalhes_mediacao: null,
    escalado_para_ml: item.claim_details?.type === 'meditations' || item.claim_details?.stage === 'dispute',
    
    // ✅ CORRIGIDO: Troca (endpoint: GET /claims/$CLAIM_ID/changes)
    eh_troca: item.change_details?.type === 'change' || item.change_details?.type === 'replace' || false,
    produto_troca_id: item.change_details?.items?.[0]?.id || null,
    // ✅ CORRIGIDO: estimated_exchange_date é objeto com {from, to} - usar ?? (nullish coalescing)
    data_estimada_troca: item.change_details?.estimated_exchange_date?.from ?? 
                        item.change_details?.estimated_exchange_date?.to ?? null,
    data_limite_troca: item.change_details?.estimated_exchange_date?.to || null,
    novo_pedido_id: item.change_details?.new_orders_ids?.[0] || null,
    data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    dias_restantes_acao: null,
    prazo_revisao_dias: null,
    valor_diferenca_troca: null,
    
    // Dados adicionais
    tags_automaticas: [],
    usuario_ultima_acao: null,
    hash_verificacao: null,
    versao_api_utilizada: null,
    origem_timeline: null,
    status_produto_novo: null,
    endereco_destino: null,
    
    // Comprador
    // ✅ FASE 1: Priorizar billing_info enriquecido (CPF/CNPJ oficial)
    comprador_cpf: item.billing_info?.doc_number || 
                   item.order_data?.buyer?.billing_info?.doc_number || null,
    comprador_nome_completo: item.order_data?.buyer?.first_name && item.order_data?.buyer?.last_name 
      ? `${item.order_data.buyer.first_name} ${item.order_data.buyer.last_name}`.trim()
      : item.order_data?.buyer?.nickname || null,
    comprador_nickname: item.order_data?.buyer?.nickname || null
  };
};
