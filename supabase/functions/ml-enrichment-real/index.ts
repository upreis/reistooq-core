/**
 * 🚀 SISTEMA DE ENRIQUECIMENTO REAL ML API
 * Implementação completa dos endpoints baseados no PDF da documentação ML
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

interface EnrichmentRequest {
  action: 'real_enrich_claims' | 'test_ml_connection' | 'batch_enrich' | 'check_missing_data';
  integration_account_id: string;
  claim_ids?: string[];
  limit?: number;
  force_refresh?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 ML Enrichment System - Starting...');
    
    if (req.method !== 'POST') {
      return fail('Método não permitido', 405);
    }

    const body: EnrichmentRequest = await req.json();
    console.log(`🔄 Ação: ${body.action}`, { 
      integration_account_id: body.integration_account_id,
      claim_ids: body.claim_ids?.length 
    });

    const supabase = makeServiceClient();
    
    // Validar conta de integração e buscar dados de autenticação
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select(`
        id, 
        organization_id, 
        name, 
        provider, 
        account_identifier,
        token_status
      `)
      .eq('id', body.integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('❌ Conta não encontrada:', accountError);
      return fail('Conta de integração não encontrada ou inativa');
    }

    // Buscar token de acesso
    const accessToken = await getMLAccessToken(supabase, body.integration_account_id);
    if (!accessToken) {
      return fail('Token de acesso ML não encontrado. Configure a integração.');
    }

    console.log(`✅ Conta validada: ${account.name} - Token status: ${account.token_status}`);

    switch (body.action) {
      case 'test_ml_connection':
        return await testMLConnection(accessToken, account.account_identifier);
      
      case 'real_enrich_claims':
        return await realEnrichClaims(supabase, body, accessToken, account.account_identifier);
      
      case 'batch_enrich':
        return await batchEnrichProcess(supabase, body, accessToken, account.account_identifier);
      
      case 'check_missing_data':
        return await checkMissingData(supabase, body);
      
      default:
        return fail('Ação não reconhecida');
    }

  } catch (error) {
    console.error('❌ Erro na ML Enrichment System:', error);
    return fail(`Erro interno: ${error.message}`, 500);
  }
});

/**
 * 🔑 BUSCAR TOKEN DE ACESSO ML
 */
async function getMLAccessToken(supabase: any, accountId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-ml-token', {
      body: {
        integration_account_id: accountId,
        provider: 'mercadolivre'
      }
    });

    if (error || !data?.access_token) {
      console.error('❌ Erro ao obter token ML:', error);
      return null;
    }

    console.log('✅ Token ML obtido com sucesso');
    return data.access_token;
  } catch (error) {
    console.error('❌ Erro ao buscar token:', error);
    return null;
  }
}

/**
 * 🧪 TESTAR CONEXÃO COM ML API
 */
async function testMLConnection(accessToken: string, sellerId: string) {
  try {
    console.log('🧪 Testando conexão com ML API...');
    
    // Testar endpoint básico ML
    const response = await fetch(`https://api.mercadolibre.com/users/${sellerId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Falha na conexão ML:', response.status, response.statusText);
      return fail(`Falha na conexão ML: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    console.log('✅ Conexão ML OK - User:', userData.nickname);

    return ok({
      success: true,
      message: 'Conexão com ML API estabelecida com sucesso',
      user_data: {
        id: userData.id,
        nickname: userData.nickname,
        country_id: userData.country_id
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    return fail(`Erro no teste de conexão: ${error.message}`);
  }
}

/**
 * 🔍 VERIFICAR DADOS FALTANTES
 */
async function checkMissingData(supabase: any, body: EnrichmentRequest) {
  try {
    console.log('🔍 Verificando dados faltantes...');
    
    const { data: claims, error } = await supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        order_id,
        claim_id,
        timeline_mensagens,
        anexos_count,
        nivel_prioridade,
        status_moderacao,
        mensagens_nao_lidas,
        data_vencimento_acao,
        custo_envio_devolucao,
        valor_compensacao
      `)
      .eq('integration_account_id', body.integration_account_id)
      .not('claim_id', 'is', null);

    if (error) {
      return fail(`Erro ao verificar dados: ${error.message}`);
    }

    const analysis = analyzeMissingData(claims || []);
    
    console.log('📊 Análise de dados faltantes:', analysis);
    
    return ok({
      success: true,
      analysis,
      total_claims: claims?.length || 0,
      needs_enrichment: analysis.claims_needing_enrichment
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return fail(`Erro na verificação: ${error.message}`);
  }
}

/**
 * 🚀 ENRIQUECIMENTO REAL DE CLAIMS
 */
async function realEnrichClaims(supabase: any, body: EnrichmentRequest, accessToken: string, sellerId: string) {
  try {
    console.log('🚀 Iniciando enriquecimento real de claims...');
    
    const limit = body.limit || 10;
    
    // Buscar claims que precisam de enriquecimento
    let query = supabase
      .from('devolucoes_avancadas')
      .select(`
        id,
        order_id,
        claim_id,
        timeline_mensagens,
        anexos_count,
        nivel_prioridade,
        dados_claim,
        dados_mensagens,
        dados_return
      `)
      .eq('integration_account_id', body.integration_account_id)
      .not('claim_id', 'is', null);

    // Se não forçar refresh, buscar apenas os que precisam
    if (!body.force_refresh) {
      query = query.or('timeline_mensagens.is.null,anexos_count.is.null,nivel_prioridade.is.null');
    }

    if (body.claim_ids && body.claim_ids.length > 0) {
      query = query.in('claim_id', body.claim_ids);
    }

    query = query.limit(limit);

    const { data: claims, error } = await query;

    if (error) {
      return fail(`Erro ao buscar claims: ${error.message}`);
    }

    if (!claims || claims.length === 0) {
      return ok({
        success: true,
        message: 'Nenhum claim encontrado para enriquecimento',
        enriched_count: 0
      });
    }

    console.log(`📦 Processando ${claims.length} claims...`);

    let enrichedCount = 0;
    let errors: any[] = [];

    // Processar cada claim
    for (const claim of claims) {
      try {
        console.log(`🔄 Enriquecendo claim ${claim.claim_id}...`);
        
        const enrichedData = await enrichClaimWithRealMLData(
          claim, 
          accessToken, 
          sellerId
        );

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('devolucoes_avancadas')
          .update(enrichedData)
          .eq('id', claim.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar claim ${claim.id}:`, updateError);
          errors.push({ claim_id: claim.claim_id, error: updateError.message });
          continue;
        }

        enrichedCount++;
        console.log(`✅ Claim ${claim.claim_id} enriquecido com sucesso`);

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erro ao processar claim ${claim.claim_id}:`, error);
        errors.push({ claim_id: claim.claim_id, error: error.message });
      }
    }

    const result = {
      success: true,
      message: `${enrichedCount}/${claims.length} claims enriquecidos com dados reais da ML`,
      enriched_count: enrichedCount,
      total_processed: claims.length,
      errors_count: errors.length,
      errors: errors.slice(0, 5) // Limitar erros no response
    };

    console.log('✅ Enriquecimento real concluído:', result);
    return ok(result);

  } catch (error) {
    console.error('❌ Erro no enriquecimento real:', error);
    return fail(`Erro no enriquecimento real: ${error.message}`, 500);
  }
}

/**
 * 🔄 PROCESSO DE ENRIQUECIMENTO EM LOTE
 */
async function batchEnrichProcess(supabase: any, body: EnrichmentRequest, accessToken: string, sellerId: string) {
  try {
    console.log('🔄 Iniciando processo de enriquecimento em lote...');
    
    // Primeiro, verificar dados faltantes
    const missingDataCheck = await checkMissingData(supabase, body);
    
    if (!missingDataCheck.ok) {
      return missingDataCheck;
    }

    const missingData = await missingDataCheck.json();
    
    if (missingData.analysis.claims_needing_enrichment === 0) {
      return ok({
        success: true,
        message: 'Todos os claims já estão enriquecidos',
        enriched_count: 0
      });
    }

    // Processar em lotes de 5 para não sobrecarregar
    const batchSize = 5;
    let totalEnriched = 0;
    let batchNumber = 1;

    while (totalEnriched < missingData.analysis.claims_needing_enrichment) {
      console.log(`📦 Processando lote ${batchNumber}...`);
      
      const batchResult = await realEnrichClaims(
        supabase, 
        { ...body, limit: batchSize }, 
        accessToken, 
        sellerId
      );

      if (batchResult.ok) {
        const result = await batchResult.json();
        totalEnriched += result.enriched_count;
        
        if (result.enriched_count === 0) {
          break; // Não há mais dados para processar
        }
      }

      batchNumber++;
      
      // Delay entre lotes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return ok({
      success: true,
      message: `Processo em lote concluído: ${totalEnriched} claims enriquecidos`,
      total_enriched: totalEnriched,
      batches_processed: batchNumber - 1
    });

  } catch (error) {
    console.error('❌ Erro no processo em lote:', error);
    return fail(`Erro no processo em lote: ${error.message}`, 500);
  }
}

/**
 * 🎯 ENRIQUECIMENTO COM DADOS REAIS DA ML API
 */
async function enrichClaimWithRealMLData(claim: any, accessToken: string, sellerId: string) {
  console.log(`🎯 Enriquecendo claim ${claim.claim_id} com dados REAIS da ML API...`);
  
  const enrichedData: any = {
    updated_at: new Date().toISOString()
  };

  try {
    // 1. BUSCAR MENSAGENS - /post-purchase/v1/claims/{claim_id}/messages
    const messagesData = await fetchClaimMessagesReal(claim.claim_id, accessToken);
    if (messagesData) {
      enrichedData.timeline_mensagens = messagesData.messages || [];
      enrichedData.mensagens_nao_lidas = messagesData.unread_count || 0;
      enrichedData.ultima_mensagem_data = messagesData.last_message_date;
      enrichedData.ultima_mensagem_remetente = messagesData.last_sender;
      enrichedData.numero_interacoes = messagesData.total_count || 0;
    }

    // 2. BUSCAR ANEXOS - /post-purchase/v1/claims/{claim_id}/attachments
    const attachmentsData = await fetchClaimAttachmentsReal(claim.claim_id, accessToken);
    if (attachmentsData) {
      enrichedData.anexos_count = attachmentsData.total_count || 0;
      enrichedData.total_evidencias = attachmentsData.total_count || 0;
    }

    // 3. BUSCAR DADOS DE DEVOLUÇÃO - /post-purchase/v2/claims/{claim_id}/returns
    const returnsData = await fetchClaimReturnsReal(claim.claim_id, accessToken);
    if (returnsData) {
      enrichedData.codigo_rastreamento = returnsData.tracking_number;
      enrichedData.status_rastreamento = returnsData.status;
      enrichedData.endereco_destino = returnsData.destination;
    }

    // 4. CALCULAR PRIORIDADE E URGÊNCIA
    enrichedData.nivel_prioridade = calculatePriorityFromRealData(enrichedData);
    enrichedData.acao_seller_necessaria = enrichedData.mensagens_nao_lidas > 0;
    enrichedData.impacto_reputacao = calculateReputationImpact(enrichedData);

    // 5. CALCULAR PRAZOS
    if (enrichedData.timeline_mensagens && enrichedData.timeline_mensagens.length > 0) {
      const lastMessage = enrichedData.timeline_mensagens[enrichedData.timeline_mensagens.length - 1];
      enrichedData.data_vencimento_acao = calculateActionDeadline(lastMessage.date_created);
      enrichedData.tempo_resposta_medio = calculateResponseTime(enrichedData.timeline_mensagens);
    }

    // 6. TAGS AUTOMÁTICAS
    enrichedData.tags_automaticas = generateTagsFromRealData(enrichedData);

    console.log(`✅ Claim ${claim.claim_id} enriquecido com dados reais`);
    return enrichedData;

  } catch (error) {
    console.error(`❌ Erro ao enriquecer claim ${claim.claim_id}:`, error);
    
    // Retornar dados mínimos mesmo em caso de erro
    return {
      nivel_prioridade: 'medium',
      acao_seller_necessaria: false,
      updated_at: new Date().toISOString()
    };
  }
}

/**
 * 📨 BUSCAR MENSAGENS REAIS
 */
async function fetchClaimMessagesReal(claimId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Erro ao buscar mensagens (${response.status}):`, await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`📨 Mensagens obtidas para claim ${claimId}:`, data.paging?.total || 0);

    return {
      messages: data.messages || [],
      total_count: data.paging?.total || 0,
      unread_count: data.messages?.filter((msg: any) => !msg.date_read).length || 0,
      last_message_date: data.messages?.[0]?.date_created,
      last_sender: data.messages?.[0]?.from?.role
    };

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    return null;
  }
}

/**
 * 📎 BUSCAR ANEXOS REAIS
 */
async function fetchClaimAttachmentsReal(claimId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}/attachments`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Erro ao buscar anexos (${response.status}):`, await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`📎 Anexos obtidos para claim ${claimId}:`, data.length || 0);

    return {
      total_count: data.length || 0,
      attachments: data || []
    };

  } catch (error) {
    console.error('❌ Erro ao buscar anexos:', error);
    return null;
  }
}

/**
 * 📦 BUSCAR DADOS DE DEVOLUÇÃO REAIS
 */
async function fetchClaimReturnsReal(claimId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Erro ao buscar returns (${response.status}):`, await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`📦 Returns obtidos para claim ${claimId}`);

    return data;

  } catch (error) {
    console.error('❌ Erro ao buscar returns:', error);
    return null;
  }
}

// Funções auxiliares
function analyzeMissingData(claims: any[]) {
  let needsEnrichment = 0;
  const analysis = {
    missing_timeline: 0,
    missing_attachments: 0,
    missing_priority: 0,
    missing_moderation: 0,
    missing_deadlines: 0
  };

  claims.forEach(claim => {
    let needsUpdate = false;

    if (!claim.timeline_mensagens || claim.timeline_mensagens.length === 0) {
      analysis.missing_timeline++;
      needsUpdate = true;
    }
    if (claim.anexos_count === null || claim.anexos_count === undefined) {
      analysis.missing_attachments++;
      needsUpdate = true;
    }
    if (!claim.nivel_prioridade) {
      analysis.missing_priority++;
      needsUpdate = true;
    }
    if (!claim.status_moderacao) {
      analysis.missing_moderation++;
      needsUpdate = true;
    }
    if (!claim.data_vencimento_acao) {
      analysis.missing_deadlines++;
      needsUpdate = true;
    }

    if (needsUpdate) needsEnrichment++;
  });

  return {
    ...analysis,
    claims_needing_enrichment: needsEnrichment,
    percentage_incomplete: Math.round((needsEnrichment / claims.length) * 100)
  };
}

function calculatePriorityFromRealData(data: any): string {
  if (data.anexos_count > 3 || data.mensagens_nao_lidas > 3) return 'high';
  if (data.mensagens_nao_lidas > 1) return 'medium';
  return 'low';
}

function calculateReputationImpact(data: any): string {
  if (data.anexos_count > 5) return 'high';
  if (data.mensagens_nao_lidas > 2) return 'medium';
  return 'low';
}

function calculateActionDeadline(lastMessageDate: string): string {
  const deadline = new Date(lastMessageDate);
  deadline.setDate(deadline.getDate() + 3);
  return deadline.toISOString();
}

function calculateResponseTime(messages: any[]): number {
  if (messages.length < 2) return 0;
  
  const times: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    const current = new Date(messages[i].date_created);
    const previous = new Date(messages[i - 1].date_created);
    times.push((current.getTime() - previous.getTime()) / (1000 * 60));
  }
  
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

function generateTagsFromRealData(data: any): string[] {
  const tags: string[] = [];
  
  if (data.anexos_count > 2) tags.push('muitas_evidencias');
  if (data.mensagens_nao_lidas > 1) tags.push('resposta_pendente');
  if (data.nivel_prioridade === 'high') tags.push('alta_prioridade');
  
  return tags;
}