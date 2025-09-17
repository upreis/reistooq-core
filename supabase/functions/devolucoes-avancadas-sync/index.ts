/**
 * 🚀 SISTEMA DE DEVOLUÇÕES - PROCESSAMENTO 100% TEMPO REAL
 * Busca e processa dados diretamente da API do Mercado Livre em tempo real
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

interface RequestBody {
  action?: 'real_time_processing' | 'unified_processing' | 'fetch_real_time_data';
  integration_account_id: string;
  limit?: number;
  force_refresh?: boolean;
  date_from?: string;
  date_to?: string;
}

interface MLAccessTokenResponse {
  access_token: string;
  account_identifier: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processamento em tempo real iniciado');
    
    if (req.method !== 'POST') {
      return fail('Método não permitido', 405);
    }

    const body: RequestBody = await req.json();
    const action = body.action || 'real_time_processing';
    
    console.log(`🔄 Ação: ${action}`, {
      integration_account_id: body.integration_account_id,
      limit: body.limit
    });

    const supabase = makeServiceClient();
    
    // Validar conta de integração
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('id, organization_id, name, provider, account_identifier')
      .eq('id', body.integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('❌ Conta de integração não encontrada:', accountError);
      return fail('Conta de integração não encontrada ou inativa');
    }

    console.log(`✅ Conta validada: ${account.name} (${account.provider})`);

    // Buscar token ML diretamente do banco (mesmo método que o frontend usa)
    const { data: secretRow, error: fetchError } = await supabase
      .from('integration_secrets')
      .select('secret_enc, provider, expires_at, simple_tokens, use_simple')
      .eq('integration_account_id', body.integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (fetchError || !secretRow) {
      console.error('❌ Token ML não encontrado:', fetchError);
      return fail('Token de acesso ML não encontrado. Configure a integração.');
    }

    // Decriptar token usando simple encryption (mesmo método do get-ml-token)
    let mlConfig = null;
    if (secretRow.simple_tokens && secretRow.use_simple) {
      try {
        const { data: decryptResult, error: decryptError } = await supabase
          .rpc('decrypt_simple', { 
            encrypted_data: secretRow.simple_tokens 
          });
        
        if (!decryptError && decryptResult) {
          const secret = JSON.parse(decryptResult);
          mlConfig = {
            access_token: secret.access_token,
            account_identifier: account.account_identifier
          };
          console.log(`✅ Token ML decriptado com sucesso para conta ${account.name}`);
        }
      } catch (error) {
        console.error('❌ Erro ao decriptar token:', error);
      }
    }

    if (!mlConfig || !mlConfig.access_token) {
      return fail('Falha ao obter token de acesso ML');
    }

    // Processar baseado na ação
    switch (action) {
      case 'real_time_processing':
      case 'unified_processing':
      case 'calculate_all_metrics':
      case 'fetch_real_time_data':
        return await processRealTimeData(supabase, body, mlConfig, account);
      
      default:
        return fail('Ação não reconhecida');
    }

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return fail(`Erro interno: ${error.message}`, 500);
  }
});

/**
 * 🔥 PROCESSAMENTO PRINCIPAL - USA DADOS JÁ DISPONÍVEIS
 * Usa dados da ml-api-direct que já está funcionando
 */
async function processRealTimeData(supabase: any, body: RequestBody, mlConfig: any, account: any) {
  try {
    console.log('🔥 Processando dados usando ml-api-direct');
    
    // 1. USAR DADOS DA ml-api-direct QUE JÁ ESTÁ FUNCIONANDO
    const { data: apiData, error: apiError } = await supabase.functions.invoke('ml-api-direct', {
      body: {
        action: 'get_claims_and_returns',
        integration_account_id: body.integration_account_id,
        seller_id: account.account_identifier,
        access_token: mlConfig.access_token,
        filters: {
          date_from: body.date_from || '',
          date_to: body.date_to || '',
          status: ''
        }
      }
    });

    if (apiError || !apiData?.success) {
      console.error('❌ Erro ao buscar dados via ml-api-direct:', apiError);
      return fail('Erro ao buscar dados da API ML');
    }

    const devolucoes = apiData.data || [];
    console.log(`📦 ${devolucoes.length} devoluções encontradas via ml-api-direct`);

    if (devolucoes.length === 0) {
      return ok({
        success: true,
        message: 'Nenhuma devolução encontrada',
        processed_count: 0,
        total_found: 0
      });
    }

    let processedCount = 0;
    const processedResults = [];

    // 2. PROCESSAR CADA DEVOLUÇÃO COM DADOS COMPLETOS
    for (const devolucao of devolucoes) {
      try {
        console.log(`🔄 Processando devolução ${devolucao.order_id}`);
        
        // Calcular métricas usando dados da API
        const enrichedData = processOrderFromApiData(devolucao, body.integration_account_id);

        // Salvar ou atualizar no banco
        await upsertOrderData(supabase, enrichedData);
        
        processedResults.push({
          order_id: devolucao.order_id,
          status: 'processed',
          metrics_calculated: true,
          calculated_metrics: {
            tempo_primeira_resposta: enrichedData.tempo_primeira_resposta_vendedor,
            valor_reembolso: enrichedData.valor_reembolso_total,
            taxa_ml: enrichedData.taxa_ml_reembolso,
            impacto_financeiro: enrichedData.impacto_financeiro_vendedor
          }
        });
        
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Erro ao processar devolução ${devolucao.order_id}:`, error);
        processedResults.push({
          order_id: devolucao.order_id,
          status: 'error',
          error: error.message
        });
      }
    }

    return ok({
      success: true,
      message: `${processedCount} devoluções processadas com métricas calculadas`,
      processed_count: processedCount,
      total_found: devolucoes.length,
      results: processedResults,
      debug_info: {
        first_item_sample: devolucoes[0] ? {
          order_id: devolucoes[0].order_id,
          has_payments: !!devolucoes[0].order_data?.payments?.length,
          has_marketplace_fee: !!devolucoes[0].order_data?.payments?.[0]?.marketplace_fee,
          transaction_amount: devolucoes[0].order_data?.payments?.[0]?.transaction_amount
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return fail(`Erro no processamento: ${error.message}`, 500);
  }
}

/**
 * 📡 BUSCAR PEDIDOS CANCELADOS DA API ML
 */
async function fetchCancelledOrdersFromML(accessToken: string, sellerId: string, body: RequestBody) {
  try {
    const baseUrl = 'https://api.mercadolibre.com';
    let allOrders = [];
    let offset = 0;
    const limit = 50;
    
    // Calcular datas
    const dateTo = body.date_to ? new Date(body.date_to) : new Date();
    const dateFrom = body.date_from ? new Date(body.date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const dateFromStr = dateFrom.toISOString();
    const dateToStr = dateTo.toISOString();
    
    console.log(`🔍 Buscando pedidos cancelados de ${dateFromStr} até ${dateToStr}`);

    do {
      const url = `${baseUrl}/orders/search?seller=${sellerId}&order.status=cancelled&order.date_created.from=${dateFromStr}&order.date_created.to=${dateToStr}&offset=${offset}&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        allOrders.push(...data.results);
        offset += limit;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        break;
      }
      
      // Limitar total se especificado
      if (body.limit && allOrders.length >= body.limit) {
        allOrders = allOrders.slice(0, body.limit);
        break;
      }
      
    } while (true);

    return allOrders;

  } catch (error) {
    console.error('❌ Erro ao buscar pedidos cancelados:', error);
    throw error;
  }
}

/**
 * 📋 BUSCAR DETALHES DO PEDIDO DA API ML
 */
async function fetchOrderDetailsFromML(accessToken: string, orderId: string) {
  try {
    const url = `https://api.mercadolibre.com/orders/${orderId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do pedido ${orderId}:`, error);
    throw error;
  }
}

/**
 * 🎯 BUSCAR CLAIMS DA API ML
 */
async function fetchClaimsFromML(accessToken: string, orderId: string) {
  try {
    const url = `https://api.mercadolibre.com/claims/search?resource=order&resource_id=${orderId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Sem claims
      }
      throw new Error(`ML API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];

  } catch (error) {
    console.error(`❌ Erro ao buscar claims do pedido ${orderId}:`, error);
    return [];
  }
}

/**
 * 💬 BUSCAR MENSAGENS DA API ML
 */
async function fetchMessagesFromML(accessToken: string, orderId: string) {
  try {
    const url = `https://api.mercadolibre.com/messages/packs/${orderId}/sellers`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Sem mensagens
      }
      throw new Error(`ML API error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`❌ Erro ao buscar mensagens do pedido ${orderId}:`, error);
    return [];
  }
}

/**
 * 🚚 BUSCAR DADOS DE ENVIO DA API ML
 */
async function fetchShippingFromML(accessToken: string, orderId: string) {
  try {
    const url = `https://api.mercadolibre.com/shipments/search?order=${orderId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Sem dados de envio
      }
      throw new Error(`ML API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.[0] || null;

  } catch (error) {
    console.error(`❌ Erro ao buscar dados de envio do pedido ${orderId}:`, error);
    return null;
  }
}

/**
 * ⚡ PROCESSAR DADOS DA API ML-API-DIRECT
 * Calcula todas as 13 métricas usando dados já processados
 */
function processOrderFromApiData(devolucao: any, integration_account_id: string) {
  try {
    console.log(`⚡ Processando devolução ${devolucao.order_id} com dados da API`);

    // Calcular métricas das 13 colunas usando dados da ml-api-direct
    const metrics = calculateMetricsFromApiData(devolucao);

    // Estrutura completa do registro
    const enrichedData = {
      // IDs básicos
      order_id: devolucao.order_id,
      claim_id: devolucao.claim_details?.id || null,
      integration_account_id,
      
      // Dados básicos
      data_criacao: devolucao.date_created,
      status_devolucao: devolucao.status,
      quantidade: devolucao.resource_data?.quantity || 1,
      sku: devolucao.resource_data?.sku || null,
      produto_titulo: devolucao.resource_data?.title || null,
      
      // Dados enriquecidos da API
      dados_order: devolucao.order_data,
      dados_claim: devolucao.claim_details,
      dados_mensagens: devolucao.claim_messages?.messages || [],
      dados_return: devolucao.return_details_v2,
      
      // 13 MÉTRICAS CALCULADAS EM TEMPO REAL
      tempo_primeira_resposta_vendedor: metrics.tempo_primeira_resposta_vendedor,
      tempo_total_resolucao: metrics.tempo_total_resolucao,
      dias_ate_resolucao: metrics.dias_ate_resolucao,
      sla_cumprido: metrics.sla_cumprido,
      eficiencia_resolucao: metrics.eficiencia_resolucao,
      score_qualidade: metrics.score_qualidade,
      valor_reembolso_total: metrics.valor_reembolso_total,
      valor_reembolso_produto: metrics.valor_reembolso_produto,
      valor_reembolso_frete: metrics.valor_reembolso_frete,
      taxa_ml_reembolso: metrics.taxa_ml_reembolso,
      custo_logistico_total: metrics.custo_logistico_total,
      impacto_financeiro_vendedor: metrics.impacto_financeiro_vendedor,
      data_processamento_reembolso: metrics.data_processamento_reembolso,
      
      // Campos extras da API
      tipo_claim: devolucao.tipo_claim,
      subtipo_claim: devolucao.subtipo_claim,
      motivo_categoria: devolucao.motivo_categoria,
      em_mediacao: devolucao.em_mediacao,
      nivel_prioridade: devolucao.nivel_prioridade,
      
      // Timestamps
      ultima_sincronizacao: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return enrichedData;

  } catch (error) {
    console.error('❌ Erro ao processar dados da API:', error);
    throw error;
  }
}

/**
 * 🧮 CALCULAR MÉTRICAS DOS DADOS DA API
 * Calcula as 13 métricas baseado nos dados da ml-api-direct
 */
function calculateMetricsFromApiData(devolucao: any) {
  const metrics: any = {};
  
  console.log('🧮 Calculando métricas dos dados da API...');

  // Extrair dados principais das estruturas corretas
  const orderData = devolucao.order_data;
  const claimData = devolucao.claim_details;
  const payment = orderData?.payments?.[0];
  
  // Datas corretas da estrutura
  const dataCreation = claimData?.date_created ? new Date(claimData.date_created) : 
                      (devolucao.date_created ? new Date(devolucao.date_created) : null);
  const dataFinalizacao = claimData?.last_updated ? new Date(claimData.last_updated) : 
                         (orderData?.date_closed ? new Date(orderData.date_closed) : null);
  
  // Mensagens de múltiplas fontes
  const messages = devolucao.timeline_mensagens || 
                  devolucao.claim_messages?.messages || 
                  devolucao.dados_mensagens || [];

  console.log(`📊 Dados para cálculo:`, {
    dataCreation: dataCreation?.toISOString(),
    dataFinalizacao: dataFinalizacao?.toISOString(),
    messagesCount: messages.length,
    orderAmount: orderData?.total_amount
  });

  // 1. TEMPO PRIMEIRA RESPOSTA VENDEDOR (em minutos)
  if (messages.length > 0 && dataCreation) {
    console.log(`🔍 Analisando ${messages.length} mensagens para primeira resposta do vendedor`);
    
    // Buscar primeira mensagem do vendedor com diferentes critérios
    const mensagensVendedor = messages.filter(msg => {
      const isSellerByRole = msg.from?.role === 'seller' || msg.from?.role === 'respondent';
      const isSellerByUserId = msg.from?.user_id && devolucao.buyer?.id && 
        msg.from.user_id.toString() !== devolucao.buyer.id.toString();
      const isSellerByReceiver = msg.receiver_role === 'buyer' || msg.to?.role === 'buyer';
      
      return isSellerByRole || isSellerByUserId || isSellerByReceiver;
    });
    
    console.log(`📊 Encontradas ${mensagensVendedor.length} mensagens do vendedor`);
    
    if (mensagensVendedor.length > 0) {
      // Ordenar por data para pegar a primeira
      mensagensVendedor.sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());
      
      const primeiraMensagem = new Date(mensagensVendedor[0].date_created);
      const diffMinutes = Math.floor((primeiraMensagem.getTime() - dataCreation.getTime()) / (1000 * 60));
      
      console.log(`⏰ Primeira mensagem do vendedor: ${mensagensVendedor[0].date_created}`);
      console.log(`⏰ Data criação claim: ${dataCreation.toISOString()}`);
      console.log(`⏰ Diferença calculada: ${diffMinutes} minutos`);
      
      if (diffMinutes >= 0 && diffMinutes < 10080) { // Max 1 semana, incluindo 0
        metrics.tempo_primeira_resposta_vendedor = diffMinutes;
        console.log(`✅ Tempo primeira resposta definido: ${diffMinutes} minutos`);
      } else {
        console.log(`⚠️ Tempo primeira resposta fora do range válido: ${diffMinutes} minutos`);
      }
    } else {
      console.log(`⚠️ Nenhuma mensagem do vendedor encontrada`);
    }
  } else {
    console.log(`⚠️ Sem mensagens (${messages.length}) ou data criação (${dataCreation})`);
  }

  // 2. TEMPO TOTAL RESOLUÇÃO (em minutos)
  if (dataCreation && dataFinalizacao) {
    const diffMinutes = Math.floor((dataFinalizacao.getTime() - dataCreation.getTime()) / (1000 * 60));
    if (diffMinutes > 0) {
      metrics.tempo_total_resolucao = diffMinutes;
      console.log(`✅ Tempo total resolução: ${diffMinutes} minutos`);
    }
  }

  // 3. DIAS ATÉ RESOLUÇÃO
  if (metrics.tempo_total_resolucao) {
    metrics.dias_ate_resolucao = Math.ceil(metrics.tempo_total_resolucao / (24 * 60));
  } else if (dataCreation && dataFinalizacao) {
    // Calcular diretamente em dias se não tiver minutos
    const diffDays = Math.ceil((dataFinalizacao.getTime() - dataCreation.getTime()) / (1000 * 60 * 60 * 24));
    metrics.dias_ate_resolucao = diffDays;
  }

  // 4. SLA CUMPRIDO (baseado em 72h para devoluções)
  metrics.sla_cumprido = metrics.dias_ate_resolucao ? metrics.dias_ate_resolucao <= 3 : true;

  // 5. EFICIÊNCIA RESOLUÇÃO
  if (metrics.tempo_primeira_resposta_vendedor && metrics.tempo_total_resolucao) {
    const eficiencia = 100 - ((metrics.tempo_primeira_resposta_vendedor / metrics.tempo_total_resolucao) * 100);
    metrics.eficiencia_resolucao = Math.max(0, Math.min(100, eficiencia)).toFixed(1);
  } else {
    // Calcular eficiência baseada em SLA
    metrics.eficiencia_resolucao = metrics.sla_cumprido ? "85.0" : "45.0";
  }

  // 6. SCORE QUALIDADE (baseado em múltiplos fatores)
  let scoreQualidade = 50; // Base
  if (metrics.sla_cumprido) scoreQualidade += 30;
  if (metrics.tempo_primeira_resposta_vendedor && metrics.tempo_primeira_resposta_vendedor < 240) scoreQualidade += 20; // < 4h
  if (messages.length > 0) scoreQualidade += 10; // Tem comunicação
  if (claimData?.status === 'closed') scoreQualidade += 10; // Resolvido
  metrics.score_qualidade = Math.min(100, scoreQualidade);

  // 7-9. VALORES DE REEMBOLSO (DADOS REAIS DA API)
  // Usar pagamento do pedido que foi reembolsado
  const refundedPayment = orderData?.payments?.find(p => 
    p.status === 'refunded' || p.status_detail?.includes('refunded')
  ) || payment;

  if (refundedPayment) {
    metrics.valor_reembolso_total = refundedPayment.transaction_amount_refunded || 
                                   refundedPayment.total_paid_amount || 
                                   refundedPayment.transaction_amount || 0;
    metrics.valor_reembolso_produto = refundedPayment.transaction_amount || 0;
    metrics.valor_reembolso_frete = refundedPayment.shipping_cost || 0;
    
    // 13. DATA PROCESSAMENTO REEMBOLSO
    if (refundedPayment.date_last_modified) {
      metrics.data_processamento_reembolso = refundedPayment.date_last_modified;
    }
    
    // 10. TAXA ML REEMBOLSO (DADOS REAIS DA API)
    if (refundedPayment.marketplace_fee) {
      metrics.taxa_ml_reembolso = refundedPayment.marketplace_fee;
    }
  } else {
    // Usar valor do amount se não tiver payment
    const valorTotal = devolucao.amount || orderData?.total_amount || 0;
    metrics.valor_reembolso_total = valorTotal;
    metrics.valor_reembolso_produto = valorTotal;
    metrics.valor_reembolso_frete = 0;
    
    // Calcular taxa padrão ML se não tiver dados reais
    if (valorTotal > 0) {
      metrics.taxa_ml_reembolso = valorTotal * 0.065; // 6.5% padrão ML
    }
  }

  // 11. CUSTO LOGÍSTICO TOTAL
  // Usar dados de shipping se disponível
  const shippingCost = orderData?.shipping?.cost || 
                      devolucao.shipping_cost || 
                      refundedPayment?.shipping_cost || 0;
  
  if (shippingCost > 0) {
    metrics.custo_logistico_total = shippingCost;
  } else if (metrics.valor_reembolso_produto > 0) {
    // Estimar custo logístico baseado no valor do produto
    const valorProduto = metrics.valor_reembolso_produto;
    if (valorProduto <= 100) metrics.custo_logistico_total = 8.50;
    else if (valorProduto <= 300) metrics.custo_logistico_total = 12.90;
    else if (valorProduto <= 500) metrics.custo_logistico_total = 15.50;
    else metrics.custo_logistico_total = 18.90;
  }

  // 12. IMPACTO FINANCEIRO VENDEDOR
  const taxaML = metrics.taxa_ml_reembolso || 0;
  const custoLog = metrics.custo_logistico_total || 0;
  const valorReemb = metrics.valor_reembolso_produto || 0;
  
  metrics.impacto_financeiro_vendedor = taxaML + custoLog + valorReemb;

  console.log('✅ Métricas calculadas:', {
    order_id: devolucao.order_id,
    tempo_primeira_resposta: metrics.tempo_primeira_resposta_vendedor,
    dias_resolucao: metrics.dias_ate_resolucao,
    sla_cumprido: metrics.sla_cumprido,
    valor_reembolso_total: metrics.valor_reembolso_total,
    taxa_ml: metrics.taxa_ml_reembolso,
    custo_logistico: metrics.custo_logistico_total,
    impacto_financeiro: metrics.impacto_financeiro_vendedor
  });

  return metrics;
}

/**
 * 💾 SALVAR/ATUALIZAR DADOS NO BANCO
 */
async function upsertOrderData(supabase: any, enrichedData: any) {
  try {
    // Usar UPSERT diretamente com ON CONFLICT
    const { error } = await supabase
      .from('devolucoes_avancadas')
      .upsert(enrichedData, {
        onConflict: 'order_id'
      });
    
    if (error) throw error;
    console.log(`✅ Pedido ${enrichedData.order_id} processado (upsert)`);

  } catch (error) {
    console.error(`❌ Erro ao processar pedido ${enrichedData.order_id}:`, error);
    // Continue processando outros pedidos mesmo se um falhar
  }
}

