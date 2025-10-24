/**
 * 💬 MAPEADOR DE DADOS DE COMUNICAÇÃO
 * Consolida: mensagens, timeline, anexos
 */

export const mapCommunicationData = (item: any) => {
  // ✅ CORRIGIDO: claim_messages vem de endpoint separado /claims/$CLAIM_ID/messages
  const messages = item.claim_messages?.messages || [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  
  return {
    // Mensagens (via endpoint separado)
    timeline_mensagens: messages,
    ultima_mensagem_data: lastMessage?.date_created || null,
    ultima_mensagem_remetente: lastMessage?.from?.role || null,
    numero_interacoes: messages.length || null,
    mensagens_nao_lidas: null,
    qualidade_comunicacao: null,
    status_moderacao: null,
    
    // Timeline
    timeline_events: item.timeline_events || [],
    timeline_consolidado: null,
    marcos_temporais: null,
    data_criacao_claim: item.claim_details?.created_date || null, // ✅ CORRIGIDO: created_date
    data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
    data_fechamento_claim: item.claim_details?.resolution?.date_created || null, // ✅ CORRIGIDO: date_created (não data_created)
    historico_status: [],
    
    // Anexos
    anexos_ml: [],
    total_evidencias: null
  };
};
