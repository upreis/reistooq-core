/**
 * 💬 MAPEADOR DE DADOS DE COMUNICAÇÃO
 * Consolida: mensagens, timeline, anexos
 * 
 * ✅ CORRIGIDO: Implementa deduplicação por hash único
 * Conforme documentação ML, cada mensagem tem um campo "hash" único para evitar duplicatas
 */

export const mapCommunicationData = (item: any) => {
  // ✅ CORRIGIDO: claim_messages vem de endpoint separado /claims/$CLAIM_ID/messages
  const rawMessages = item.claim_messages?.messages || [];
  
  // ✅ NOVO: Deduplicação por hash único
  // API ML retorna campo "hash" único: "5313707006_0_c793a662-fa12-3cfb-a069-9770f016baac"
  const uniqueMessages = rawMessages.reduce((acc: any[], msg: any) => {
    // ✅ CORRIGIDO: message_date é OBJETO { created, received, read }, não string
    const msgDate = msg.date_created || msg.message_date?.created || msg.message_date?.received || '';
    const messageHash = msg.hash || `${msg.sender_role}_${msg.receiver_role}_${msgDate}_${msg.message}`;
    
    // Verificar se já existe mensagem com este hash
    const isDuplicate = acc.some(existingMsg => {
      const existingDate = existingMsg.date_created || existingMsg.message_date?.created || existingMsg.message_date?.received || '';
      const existingHash = existingMsg.hash || `${existingMsg.sender_role}_${existingMsg.receiver_role}_${existingDate}_${existingMsg.message}`;
      return existingHash === messageHash;
    });
    
    if (!isDuplicate) {
      acc.push(msg);
    }
    
    return acc;
  }, []);
  
  // Ordenar por data (mais recente primeiro)
  const sortedMessages = uniqueMessages.sort((a, b) => {
    const dateA = new Date(a.date_created || a.message_date?.created || 0).getTime();
    const dateB = new Date(b.date_created || b.message_date?.created || 0).getTime();
    return dateB - dateA;
  });
  
  const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
  
  return {
    // ✅ Mensagens (deduplicated por hash)
    timeline_mensagens: sortedMessages,
    ultima_mensagem_data: lastMessage?.date_created || lastMessage?.message_date?.created || null,
    ultima_mensagem_remetente: lastMessage?.sender_role || lastMessage?.from?.role || null,
    numero_interacoes: sortedMessages.length || null,
    mensagens_nao_lidas: item.claim_messages?.unread_messages || null,
    
    // ✅ Qualidade da comunicação (baseado em moderação)
    qualidade_comunicacao: (() => {
      if (sortedMessages.length === 0) return null;
      
      const cleanMessages = sortedMessages.filter((m: any) => 
        m.message_moderation?.status === 'clean'
      ).length;
      
      const totalMessages = sortedMessages.length;
      const cleanPercentage = (cleanMessages / totalMessages) * 100;
      
      if (cleanPercentage >= 90) return 'excelente';
      if (cleanPercentage >= 70) return 'boa';
      if (cleanPercentage >= 50) return 'regular';
      return 'ruim';
    })(),
    
    status_moderacao: (() => {
      const moderatedCount = sortedMessages.filter((m: any) => 
        m.message_moderation?.status === 'moderated' || 
        m.message_moderation?.status === 'rejected'
      ).length;
      
      return moderatedCount > 0 ? 'com_mensagens_moderadas' : 'limpo';
    })(),
    
    // Timeline
    timeline_events: item.timeline_events || [],
    timeline_consolidado: null,
    marcos_temporais: null,
    data_criacao_claim: item.claim_details?.date_created || null, // ✅ CORRIGIDO: date_created (nome oficial API ML)
    data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
    data_fechamento_claim: item.claim_details?.resolution?.date_created || null, // ✅ CORRIGIDO: date_created (API ML)
    historico_status: [],
    
    // Anexos
    anexos_ml: [],
    total_evidencias: null
  };
};
