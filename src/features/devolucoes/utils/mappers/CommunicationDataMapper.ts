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
    // ===== CAMPOS DE COMUNICAÇÃO BÁSICOS (já existentes) =====
    timeline_mensagens: sortedMessages,
    ultima_mensagem_data: lastMessage?.date_created || lastMessage?.message_date?.created || null,
    ultima_mensagem_remetente: lastMessage?.sender_role || lastMessage?.from?.role || null,
    mensagens_nao_lidas: item.claim_messages?.unread_messages || null,
    
    // ===== CAMPOS PRIORIDADE ALTA (já implementados) =====
    numero_interacoes: sortedMessages.length || null,
    
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
    
    // Anexos básicos
    total_anexos_comprador: item.claim_messages?.messages?.filter((m: any) => 
      m.sender_role === 'buyer' && m.attachments?.length > 0
    ).reduce((total: number, m: any) => total + m.attachments.length, 0) || 0,
    total_anexos_vendedor: item.claim_messages?.messages?.filter((m: any) => 
      m.sender_role === 'seller' && m.attachments?.length > 0
    ).reduce((total: number, m: any) => total + m.attachments.length, 0) || 0,
    total_anexos_ml: item.claim_messages?.messages?.filter((m: any) => 
      m.sender_role === 'mediator' && m.attachments?.length > 0
    ).reduce((total: number, m: any) => total + m.attachments.length, 0) || 0,
    
    // Timeline consolidado (mantido para compatibilidade)
    timeline_consolidado: null,
    
    // ===== 🆕 6 CAMPOS DE COMUNICAÇÃO DETALHADOS (nível superior individual) =====
    
    // 1. Timeline Events (array de eventos temporais)
    timeline_events: item.timeline_events || [],
    
    // 2. Marcos Temporais (principais datas/eventos)
    marcos_temporais: item.marcos_temporais || null,
    
    // 3. Data Criação Claim
    data_criacao_claim: item.claim_details?.date_created || null,
    
    // 4. Data Início Return
    data_inicio_return: item.return_details_v2?.date_created || null,
    
    // 5. Data Fechamento Claim
    data_fechamento_claim: item.claim_details?.closed_at || item.claim_details?.date_closed || null,
    
    // 6. Histórico Status (array de mudanças de status)
    historico_status: item.status_history || [],
    
    // ===== CAMPOS PARA METADADOS (total_evidencias, anexos_ml) =====
    total_evidencias: item.attachments?.length || 0,
    anexos_ml: item.attachments || []
  };
};
