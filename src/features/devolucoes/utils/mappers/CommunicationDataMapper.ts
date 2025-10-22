/**
 * 💬 MAPEADOR DE DADOS DE COMUNICAÇÃO
 * Consolida: mensagens, timeline, anexos
 */

export const mapCommunicationData = (item: any) => {
  return {
    // Mensagens
    timeline_mensagens: item.claim_messages?.messages || [],
    ultima_mensagem_data: item.claim_messages?.messages?.[item.claim_messages?.messages?.length - 1]?.date_created || null,
    ultima_mensagem_remetente: item.claim_messages?.messages?.[item.claim_messages?.messages?.length - 1]?.from?.role || null,
    numero_interacoes: null,
    mensagens_nao_lidas: null,
    qualidade_comunicacao: null,
    status_moderacao: null,
    
    // Timeline
    timeline_events: item.timeline_events || [],
    timeline_consolidado: null,
    marcos_temporais: null,
    data_criacao_claim: item.claim_details?.date_created || null,
    data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
    data_fechamento_claim: item.claim_details?.resolution?.date_created || null,
    historico_status: [],
    
    // Anexos
    anexos_count: null,
    anexos_ml: [],
    total_evidencias: null
  };
};
