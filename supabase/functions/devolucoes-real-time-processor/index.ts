/**
 * ⚡ FASE 4: PROCESSADOR EM TEMPO REAL
 * Processa webhook events e atualiza dados em tempo real
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

interface WebhookEvent {
  integration_account_id: string;
  event_type: 'claim_update' | 'order_update' | 'message_received' | 'status_change';
  resource_id: string;
  data: any;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return fail('Método não permitido', 405);
    }

    const event: WebhookEvent = await req.json();
    console.log('⚡ Processando evento em tempo real:', event.event_type);

    const supabase = makeServiceClient();
    
    // Validar conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('id, organization_id, name')
      .eq('id', event.integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return fail('Conta de integração não encontrada');
    }

    switch (event.event_type) {
      case 'claim_update':
        return await processClaimUpdate(supabase, event);
      
      case 'order_update':
        return await processOrderUpdate(supabase, event);
      
      case 'message_received':
        return await processMessageReceived(supabase, event);
      
      case 'status_change':
        return await processStatusChange(supabase, event);
      
      default:
        return fail('Tipo de evento não reconhecido');
    }

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return fail(`Erro no processamento: ${error.message}`, 500);
  }
});

/**
 * 📋 PROCESSAR ATUALIZAÇÃO DE CLAIM
 */
async function processClaimUpdate(supabase: any, event: WebhookEvent) {
  try {
    console.log(`📋 Processando atualização de claim: ${event.resource_id}`);

    const claimData = event.data;
    
    // Buscar devolução existente
    const { data: existing, error: findError } = await supabase
      .from('devolucoes_avancadas')
      .select('id, timeline_mensagens, anexos_count')
      .eq('claim_id', event.resource_id)
      .eq('integration_account_id', event.integration_account_id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      return fail(`Erro ao buscar devolução: ${findError.message}`);
    }

    const updateData = mapClaimToAdvancedFields(claimData);
    updateData.updated_at = new Date().toISOString();

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) {
        return fail(`Erro ao atualizar: ${updateError.message}`);
      }

      console.log(`✅ Devolução ${existing.id} atualizada`);
    } else {
      // Criar novo registro se necessário
      updateData.claim_id = event.resource_id;
      updateData.integration_account_id = event.integration_account_id;

      const { error: insertError } = await supabase
        .from('devolucoes_avancadas')
        .insert(updateData);

      if (insertError) {
        console.warn(`⚠️ Erro ao inserir: ${insertError.message}`);
      }
    }

    return ok({
      success: true,
      message: 'Claim atualizado com sucesso',
      event_type: 'claim_update',
      resource_id: event.resource_id
    });

  } catch (error) {
    console.error('❌ Erro no processamento de claim:', error);
    return fail(`Erro no processamento: ${error.message}`, 500);
  }
}

/**
 * 📦 PROCESSAR ATUALIZAÇÃO DE PEDIDO
 */
async function processOrderUpdate(supabase: any, event: WebhookEvent) {
  try {
    console.log(`📦 Processando atualização de pedido: ${event.resource_id}`);

    const orderData = event.data;
    
    // Buscar devoluções relacionadas ao pedido
    const { data: devolucoes, error: findError } = await supabase
      .from('devolucoes_avancadas')
      .select('id, dados_order')
      .eq('order_id', event.resource_id)
      .eq('integration_account_id', event.integration_account_id);

    if (findError) {
      return fail(`Erro ao buscar devoluções: ${findError.message}`);
    }

    const updateData = mapOrderToAdvancedFields(orderData);
    updateData.updated_at = new Date().toISOString();

    let updatedCount = 0;

    // Atualizar todas as devoluções relacionadas
    for (const dev of devolucoes || []) {
      const { error: updateError } = await supabase
        .from('devolucoes_avancadas')
        .update(updateData)
        .eq('id', dev.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    return ok({
      success: true,
      message: `${updatedCount} devoluções atualizadas`,
      event_type: 'order_update',
      resource_id: event.resource_id,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error('❌ Erro no processamento de pedido:', error);
    return fail(`Erro no processamento: ${error.message}`, 500);
  }
}

/**
 * 💬 PROCESSAR NOVA MENSAGEM
 */
async function processMessageReceived(supabase: any, event: WebhookEvent) {
  try {
    console.log(`💬 Processando nova mensagem: ${event.resource_id}`);

    const messageData = event.data;
    
    // Buscar devolução pelo claim_id ou order_id
    const { data: devolucao, error: findError } = await supabase
      .from('devolucoes_avancadas')
      .select('id, timeline_mensagens, mensagens_nao_lidas, anexos_count')
      .or(`claim_id.eq.${messageData.claim_id},order_id.eq.${messageData.order_id}`)
      .eq('integration_account_id', event.integration_account_id)
      .single();

    if (findError) {
      return fail(`Devolução não encontrada: ${findError.message}`);
    }

    // Atualizar timeline de mensagens
    const timeline = devolucao.timeline_mensagens || [];
    const newMessage = formatMessageForTimeline(messageData);
    timeline.push(newMessage);

    // Contar anexos
    const newAttachmentCount = (newMessage.anexos || []).length;
    const totalAttachments = (devolucao.anexos_count || 0) + newAttachmentCount;

    // Contar mensagens não lidas (se for do comprador)
    const unreadCount = messageData.sender_type === 'buyer' 
      ? (devolucao.mensagens_nao_lidas || 0) + 1
      : devolucao.mensagens_nao_lidas;

    const updateData = {
      timeline_mensagens: timeline,
      ultima_mensagem_data: messageData.timestamp || new Date().toISOString(),
      ultima_mensagem_remetente: messageData.sender_type || 'unknown',
      mensagens_nao_lidas: unreadCount,
      anexos_count: totalAttachments,
      acao_seller_necessaria: messageData.sender_type === 'buyer',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('devolucoes_avancadas')
      .update(updateData)
      .eq('id', devolucao.id);

    if (updateError) {
      return fail(`Erro ao atualizar: ${updateError.message}`);
    }

    return ok({
      success: true,
      message: 'Mensagem processada com sucesso',
      event_type: 'message_received',
      resource_id: event.resource_id,
      unread_count: unreadCount
    });

  } catch (error) {
    console.error('❌ Erro no processamento de mensagem:', error);
    return fail(`Erro no processamento: ${error.message}`, 500);
  }
}

/**
 * 🔄 PROCESSAR MUDANÇA DE STATUS
 */
async function processStatusChange(supabase: any, event: WebhookEvent) {
  try {
    console.log(`🔄 Processando mudança de status: ${event.resource_id}`);

    const statusData = event.data;
    
    // Buscar devolução
    const { data: devolucao, error: findError } = await supabase
      .from('devolucoes_avancadas')
      .select('id, status_devolucao, historico_status')
      .or(`claim_id.eq.${event.resource_id},order_id.eq.${event.resource_id}`)
      .eq('integration_account_id', event.integration_account_id)
      .single();

    if (findError) {
      return fail(`Devolução não encontrada: ${findError.message}`);
    }

    // Atualizar histórico de status
    const historico = devolucao.historico_status || [];
    historico.push({
      status_anterior: devolucao.status_devolucao,
      status_novo: statusData.new_status,
      timestamp: statusData.timestamp || new Date().toISOString(),
      motivo: statusData.reason || 'mudança_automática'
    });

    const updateData = {
      status_devolucao: statusData.new_status,
      historico_status: historico,
      updated_at: new Date().toISOString()
    };

    // Definir flags baseadas no novo status
    if (statusData.new_status === 'escalated') {
      updateData.escalado_para_ml = true;
      updateData.nivel_prioridade = 'high';
    }

    if (statusData.new_status === 'mediation') {
      updateData.em_mediacao = true;
      updateData.data_inicio_mediacao = new Date().toISOString();
    }

    if (['closed', 'resolved'].includes(statusData.new_status)) {
      updateData.acao_seller_necessaria = false;
      updateData.tempo_total_resolucao = calculateResolutionTime(devolucao.data_criacao);
    }

    const { error: updateError } = await supabase
      .from('devolucoes_avancadas')
      .update(updateData)
      .eq('id', devolucao.id);

    if (updateError) {
      return fail(`Erro ao atualizar: ${updateError.message}`);
    }

    return ok({
      success: true,
      message: 'Status atualizado com sucesso',
      event_type: 'status_change',
      resource_id: event.resource_id,
      new_status: statusData.new_status
    });

  } catch (error) {
    console.error('❌ Erro no processamento de status:', error);
    return fail(`Erro no processamento: ${error.message}`, 500);
  }
}

/**
 * 🗺️ MAPEAR DADOS DE CLAIM PARA CAMPOS AVANÇADOS
 */
function mapClaimToAdvancedFields(claimData: any): any {
  return {
    dados_claim: claimData,
    status_devolucao: claimData.status || 'opened',
    tipo_claim: claimData.type || null,
    subtipo_claim: claimData.subtype || null,
    motivo_categoria: claimData.reason?.category || null,
    valor_retido: claimData.amount?.value || 0,
    status_moderacao: claimData.moderation?.status || 'pending',
    mediador_ml: claimData.mediator?.id || null,
    detalhes_mediacao: claimData.mediation_details || {},
    anexos_comprador: claimData.buyer_attachments || [],
    anexos_vendedor: claimData.seller_attachments || [],
    anexos_ml: claimData.ml_attachments || []
  };
}

/**
 * 🗺️ MAPEAR DADOS DE PEDIDO PARA CAMPOS AVANÇADOS
 */
function mapOrderToAdvancedFields(orderData: any): any {
  return {
    dados_order: orderData,
    produto_titulo: orderData.order_items?.[0]?.item?.title || null,
    sku: orderData.order_items?.[0]?.item?.seller_sku || null,
    quantidade: orderData.order_items?.[0]?.quantity || 1,
    shipping_method: orderData.shipping?.mode || null,
    codigo_rastreamento: orderData.shipping?.tracking_number || null,
    transportadora: orderData.shipping?.carrier || null,
    endereco_destino: orderData.shipping?.receiver_address || {}
  };
}

/**
 * 💬 FORMATAR MENSAGEM PARA TIMELINE
 */
function formatMessageForTimeline(messageData: any): any {
  return {
    timestamp: messageData.timestamp || new Date().toISOString(),
    remetente: messageData.sender_type || 'unknown',
    tipo: messageData.message_type || 'mensagem',
    conteudo: messageData.text || '',
    anexos: messageData.attachments || [],
    metadata: {
      message_id: messageData.id,
      read: false,
      sender_id: messageData.sender_id
    }
  };
}

/**
 * ⏱️ CALCULAR TEMPO DE RESOLUÇÃO
 */
function calculateResolutionTime(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60)); // retorna em minutos
}