/**
 * 💬 MAPEADOR DE DADOS DE COMUNICAÇÃO
 * Consolida: mensagens, timeline, anexos
 */

export const mapCommunicationData = (item: any) => {
  return {
    // Mensagens
    timeline_mensagens: item.claim_messages?.messages || [],
    ultima_mensagem_data: item.claim_messages?.messages?.length > 0 ? 
      item.claim_messages.messages[item.claim_messages.messages.length - 1]?.date_created : null,
    ultima_mensagem_remetente: item.claim_messages?.messages?.length > 0 ? 
      item.claim_messages.messages[item.claim_messages.messages.length - 1]?.from?.role : null,
    numero_interacoes: item.claim_messages?.messages?.length || 0,
    mensagens_nao_lidas: item.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0,
    qualidade_comunicacao: null,
    status_moderacao: null,
    
    // Timeline
    timeline_events: item.timeline_events || [],
    timeline_consolidado: {
      data_inicio: item.date_created || item.claim_details?.date_created,
      data_fim: item.claim_details?.resolution?.date_created || null,
      duracao_total_dias: item.claim_details?.resolution ? 
        Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                   new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60 * 24)) : null
    },
    marcos_temporais: {
      data_criacao_claim: item.claim_details?.date_created || null,
      data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
      data_fechamento_claim: item.claim_details?.resolution?.date_created || null
    },
    data_criacao_claim: item.claim_details?.date_created || null,
    data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
    data_fechamento_claim: item.claim_details?.resolution?.date_created || null,
    historico_status: [],
    
    // Anexos
    anexos_count: 0,
    anexos_comprador: [],
    anexos_vendedor: [],
    anexos_ml: [],
    total_evidencias: (item.claim_messages?.messages?.length || 0)
  };
};
