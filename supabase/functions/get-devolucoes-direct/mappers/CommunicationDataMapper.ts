/**
 * 💬 MAPEADOR DE DADOS DE COMUNICAÇÃO
 * Consolida: mensagens, timeline, anexos
 * 
 * ✅ FASE 2: Logs de debug robustos para investigar estrutura de claim_messages
 * 🔍 Objetivo: Corrigir contagem de mensagens que está sempre 0
 */

export const mapCommunicationData = (item: any) => {
  const claim = item;
  
  // ✅ ESTRUTURA CONFIRMADA: API ML retorna ARRAY DIRETO de mensagens
  // Endpoint: GET /marketplace/v2/claims/{claim_id}/messages
  // Resposta: [ { sender_role, message, date_created, ... }, ... ]
  // Documentação: https://global-selling.mercadolibre.com/devsite/manage-claims-messages
  
  console.log('💬 === MESSAGES DEBUG ===');
  console.log('💬 claim_id:', claim.id);
  console.log('💬 claim_messages existe?', !!claim.claim_messages);
  console.log('💬 claim_messages é array?', Array.isArray(claim.claim_messages));
  
  if (claim.claim_messages) {
    if (Array.isArray(claim.claim_messages)) {
      console.log('💬 ✅ ARRAY DIRETO com', claim.claim_messages.length, 'mensagens');
    } else {
      console.log('💬 ⚠️ NÃO é array! Tipo:', typeof claim.claim_messages);
      console.log('💬 Keys:', Object.keys(claim.claim_messages));
    }
  }
  
  // ✅ CORRETO: A API retorna ARRAY DIRETO de mensagens
  const rawMessages = Array.isArray(claim.claim_messages) 
    ? claim.claim_messages 
    : [];
  
  // Deduplicação e ordenação de mensagens
  const uniqueMessages = rawMessages.reduce((acc: any[], msg: any) => {
    const msgDate = msg.date_created || msg.message_date?.created || '';
    const messageHash = msg.hash || `${msg.sender_role}_${msgDate}_${msg.message}`;
    
    const isDuplicate = acc.some(existingMsg => {
      const existingDate = existingMsg.date_created || existingMsg.message_date?.created || '';
      const existingHash = existingMsg.hash || `${existingMsg.sender_role}_${existingDate}_${existingMsg.message}`;
      return existingHash === messageHash;
    });
    
    if (!isDuplicate) acc.push(msg);
    return acc;
  }, []);
  
  const sortedMessages = uniqueMessages.sort((a, b) => {
    const dateA = new Date(a.date_created || a.message_date?.created || 0).getTime();
    const dateB = new Date(b.date_created || b.message_date?.created || 0).getTime();
    return dateB - dateA;
  });
  
  const lastMessage = sortedMessages[0] || null;
  
  // 🐛 DEBUG FASE 3: Log resultado final do mapeamento
  const totalMensagens = sortedMessages.length;
  console.log('💬 === FASE 3 RESULTADO ===');
  console.log('💬 claim_id:', claim.id);
  console.log('💬 Total mensagens RAW encontradas:', Array.isArray(rawMessages) ? rawMessages.length : 'N/A');
  console.log('💬 Total mensagens APÓS dedup/sort:', totalMensagens);
  console.log('💬 Qualidade comunicação:', (() => {
    if (sortedMessages.length === 0) return 'sem_mensagens';
    
    const cleanMessages = sortedMessages.filter((m: any) => 
      !m.message_moderation || m.message_moderation?.status === 'clean'
    ).length;
    
    const cleanPercentage = (cleanMessages / sortedMessages.length) * 100;
    
    if (cleanPercentage >= 90) return 'excelente';
    if (cleanPercentage >= 70) return 'boa';
    if (cleanPercentage >= 50) return 'regular';
    return 'ruim';
  })());
  console.log('💬 ==================');
  
  return {
    // ===== CAMPOS DE COMUNICAÇÃO BÁSICOS (já existentes) =====
    timeline_mensagens: sortedMessages,
    ultima_mensagem_data: lastMessage?.date_created || lastMessage?.message_date?.created || null,
    ultima_mensagem_remetente: lastMessage?.sender_role || lastMessage?.from?.role || null,
    mensagens_nao_lidas: item.claim_messages?.unread_messages || null,
    
    // ===== CAMPOS PRIORIDADE ALTA (FASE 2: corrigido) =====
    numero_interacoes: sortedMessages.length || 0,  // ✅ Retorna 0 ao invés de null se vazio
    
    qualidade_comunicacao: (() => {
      if (sortedMessages.length === 0) return 'sem_mensagens';
      
      const cleanMessages = sortedMessages.filter((m: any) => 
        !m.message_moderation || m.message_moderation?.status === 'clean'
      ).length;
      
      const cleanPercentage = (cleanMessages / sortedMessages.length) * 100;
      
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
    total_anexos_comprador: rawMessages.filter((m: any) => 
      m.sender_role === 'buyer' && m.attachments?.length > 0
    ).reduce((total: number, m: any) => total + m.attachments.length, 0) || 0,
    total_anexos_vendedor: rawMessages.filter((m: any) => 
      m.sender_role === 'seller' && m.attachments?.length > 0
    ).reduce((total: number, m: any) => total + m.attachments.length, 0) || 0,
    total_anexos_ml: rawMessages.filter((m: any) => 
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
