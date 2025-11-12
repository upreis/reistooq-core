/**
 * 🔄 MAPEADOR DE DADOS CONTEXTUAIS
 * Consolida: mediação, troca, dados adicionais
 */

export const mapContextData = (item: any) => {
  return {
    // ===== CAMPOS DE MEDIAÇÃO BÁSICOS (já existentes) =====
    em_mediacao: item.claim_details?.type === 'meditations' || item.claim_details?.stage === 'dispute',
    data_inicio_mediacao: item.claim_details?.date_created || null,
    escalado_para_ml: item.claim_details?.type === 'meditations' || item.claim_details?.stage === 'dispute',
    
    // ===== CAMPOS PRIORIDADE ALTA (já implementados) =====
    mediador_ml: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
    
    // Troca
    eh_troca: item.change_details?.type === 'change' || item.change_details?.type === 'replace' || false,
    data_estimada_troca: item.change_details?.estimated_exchange_date?.from ?? 
                        item.change_details?.estimated_exchange_date?.to ?? null,
    data_limite_troca: item.change_details?.estimated_exchange_date?.to || null,
    
    // Comprador
    comprador_cpf: item.billing_info?.doc_number || 
                   item.order_data?.buyer?.billing_info?.doc_number || null,
    comprador_nome_completo: item.order_data?.buyer?.first_name && item.order_data?.buyer?.last_name 
      ? `${item.order_data.buyer.first_name} ${item.order_data.buyer.last_name}`.trim()
      : item.order_data?.buyer?.nickname || null,
    comprador_nickname: item.order_data?.buyer?.nickname || null,
    
    // Dados adicionais (mantidos para compatibilidade)
    tags_automaticas: [],
    hash_verificacao: null,
    versao_api_utilizada: null,
    origem_timeline: null,
    status_produto_novo: null,
    endereco_destino: null,
    valor_diferenca_troca: item.claim_details?.resolution?.exchange_difference || null,
    data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    
    // ===== 🆕 6 CAMPOS DE MEDIAÇÃO DETALHADOS (nível superior individual) =====
    
    // 1. Resultado Mediação
    resultado_mediacao: item.claim_details?.resolution?.reason || null,
    
    // 2. Detalhes Mediação (texto descritivo)
    detalhes_mediacao: item.claim_details?.resolution?.details || 
                       item.claim_details?.resolution?.description || null,
    
    // 3. Produto Troca ID
    produto_troca_id: item.change_details?.items?.[0]?.id || null,
    
    // 4. Novo Pedido ID (gerado pela troca)
    novo_pedido_id: item.change_details?.new_orders_ids?.[0] || null,
    
    // 5. Dias Restantes Ação (calculado do due_date)
    dias_restantes_acao: (() => {
      const dueDate = item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date;
      if (!dueDate) return null;
      const due = new Date(dueDate);
      const now = new Date();
      const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    // 6. Prazo Revisão Dias (calculado do estimated_handling_limit)
    prazo_revisao_dias: (() => {
      const prazo = item.return_details_v2?.estimated_handling_limit?.date;
      if (!prazo) return null;
      const prazoDate = new Date(prazo);
      const hoje = new Date();
      const diff = Math.ceil((prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    })(),
    
    // ===== CAMPO PARA METADADOS (usuario_ultima_acao) =====
    usuario_ultima_acao: item.claim_details?.last_updated_by || null
  };
};
