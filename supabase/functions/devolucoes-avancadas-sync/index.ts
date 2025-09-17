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

    // Buscar token ML
    const mlTokens = await getMLAccessToken(supabase, body.integration_account_id);
    if (!mlTokens) {
      return fail('Token de acesso ML não encontrado. Configure a integração.');
    }

    // Processar baseado na ação
    switch (action) {
      case 'real_time_processing':
        return await processRealTimeData(supabase, body, mlTokens, account);
      
      case 'unified_processing':
        return await unifiedRealTimeProcessing(supabase, body, mlTokens, account);
      
      case 'fetch_real_time_data':
        return await fetchRealTimeMLData(supabase, body, mlTokens, account);
      
      default:
        return fail('Ação não reconhecida');
    }

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return fail(`Erro interno: ${error.message}`, 500);
  }
});

/**
 * 🔥 PROCESSAMENTO PRINCIPAL - 100% TEMPO REAL
 * Busca dados diretamente da API ML e calcula todas as métricas
 */
async function processRealTimeData(supabase: any, body: RequestBody, mlTokens: MLAccessTokenResponse, account: any) {
  try {
    console.log('🔥 Iniciando processamento 100% tempo real');
    
    // 1. BUSCAR PEDIDOS CANCELADOS DA API ML
    const cancelledOrders = await fetchCancelledOrdersFromML(mlTokens.access_token, account.account_identifier, body);
    console.log(`📦 ${cancelledOrders.length} pedidos cancelados encontrados na API`);

    if (cancelledOrders.length === 0) {
      return ok({
        success: true,
        message: 'Nenhum pedido cancelado encontrado na API',
        processed_count: 0,
        total_found: 0
      });
    }

    let processedCount = 0;
    const processedResults = [];

    // 2. PROCESSAR CADA PEDIDO EM TEMPO REAL
    for (const order of cancelledOrders) {
      try {
        console.log(`🔄 Processando pedido ${order.id} em tempo real`);
        
        // Buscar dados completos da API
        const orderDetails = await fetchOrderDetailsFromML(mlTokens.access_token, order.id);
        const claimsData = await fetchClaimsFromML(mlTokens.access_token, order.id);
        const messagesData = await fetchMessagesFromML(mlTokens.access_token, order.id);
        const shippingData = await fetchShippingFromML(mlTokens.access_token, order.id);

        // Processar e calcular métricas
        const enrichedData = await processOrderRealTime({
          order: orderDetails,
          claims: claimsData,
          messages: messagesData,
          shipping: shippingData,
          integration_account_id: body.integration_account_id
        });

        // Salvar ou atualizar no banco
        await upsertOrderData(supabase, enrichedData);
        
        processedResults.push({
          order_id: order.id,
          status: 'processed',
          metrics_calculated: true
        });
        
        processedCount++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erro ao processar pedido ${order.id}:`, error);
        processedResults.push({
          order_id: order.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return ok({
      success: true,
      message: `${processedCount} pedidos processados em tempo real`,
      processed_count: processedCount,
      total_found: cancelledOrders.length,
      results: processedResults
    });

  } catch (error) {
    console.error('❌ Erro no processamento tempo real:', error);
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
 * ⚡ PROCESSAR PEDIDO EM TEMPO REAL
 * Calcula todas as 13 métricas baseado nos dados da API
 */
async function processOrderRealTime(data: any) {
  try {
    const { order, claims, messages, shipping, integration_account_id } = data;
    
    console.log(`⚡ Processando pedido ${order.id} com dados da API`);

    // Calcular métricas das 13 colunas
    const metrics = calculateRealTimeMetrics({
      order,
      claims,
      messages,
      shipping
    });

    // Estrutura completa do registro
    const enrichedData = {
      // IDs básicos
      order_id: order.id,
      claim_id: claims[0]?.id || null,
      integration_account_id,
      
      // Dados básicos
      data_criacao: order.date_created,
      status_devolucao: order.status,
      quantidade: order.order_items?.[0]?.quantity || 1,
      sku: order.order_items?.[0]?.item?.seller_sku || null,
      produto_titulo: order.order_items?.[0]?.item?.title || null,
      
      // Dados enriquecidos da API
      dados_order: order,
      dados_claim: claims[0] || null,
      dados_mensagens: messages,
      dados_return: shipping,
      
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
      
      // Timestamps
      ultima_sincronizacao: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return enrichedData;

  } catch (error) {
    console.error('❌ Erro ao processar pedido em tempo real:', error);
    throw error;
  }
}

/**
 * 🧮 CALCULAR MÉTRICAS EM TEMPO REAL
 * Calcula as 13 métricas baseado nos dados frescos da API
 */
function calculateRealTimeMetrics(data: any) {
  const { order, claims, messages, shipping } = data;
  const metrics: any = {};
  
  const dataCreation = order.date_created ? new Date(order.date_created) : null;
  const dataFinalizacao = order.date_closed ? new Date(order.date_closed) : null;
  
  console.log('🧮 Calculando métricas em tempo real...');

  // 1. TEMPO PRIMEIRA RESPOSTA VENDEDOR (em minutos)
  if (messages && Array.isArray(messages) && messages.length > 0 && dataCreation) {
    // Buscar primeira mensagem do vendedor
    const mensagensVendedor = messages.filter(msg => 
      msg.from?.role === 'seller' || 
      (msg.from?.user_id && msg.from.user_id.toString() !== order.buyer?.id?.toString())
    );
    
    if (mensagensVendedor.length > 0) {
      const primeiraMensagem = new Date(mensagensVendedor[0].date_created);
      const diffMinutes = Math.floor((primeiraMensagem.getTime() - dataCreation.getTime()) / (1000 * 60));
      if (diffMinutes > 0 && diffMinutes < 10080) { // Max 1 semana
        metrics.tempo_primeira_resposta_vendedor = diffMinutes;
      }
    }
  }

  // 2. TEMPO TOTAL RESOLUÇÃO (em minutos)
  if (dataCreation && dataFinalizacao) {
    const diffMinutes = Math.floor((dataFinalizacao.getTime() - dataCreation.getTime()) / (1000 * 60));
    if (diffMinutes > 0) {
      metrics.tempo_total_resolucao = diffMinutes;
    }
  }

  // 3. DIAS ATÉ RESOLUÇÃO
  if (metrics.tempo_total_resolucao) {
    metrics.dias_ate_resolucao = Math.ceil(metrics.tempo_total_resolucao / (24 * 60));
  }

  // 4. SLA CUMPRIDO (baseado em 72h para devoluções)
  metrics.sla_cumprido = metrics.dias_ate_resolucao ? metrics.dias_ate_resolucao <= 3 : true;

  // 5. EFICIÊNCIA RESOLUÇÃO
  if (metrics.tempo_primeira_resposta_vendedor && metrics.tempo_total_resolucao) {
    const eficiencia = 100 - ((metrics.tempo_primeira_resposta_vendedor / metrics.tempo_total_resolucao) * 100);
    metrics.eficiencia_resolucao = Math.max(0, Math.min(100, eficiencia)).toFixed(1);
  }

  // 6. SCORE QUALIDADE (baseado em múltiplos fatores)
  let scoreQualidade = 50; // Base
  if (metrics.sla_cumprido) scoreQualidade += 30;
  if (metrics.tempo_primeira_resposta_vendedor && metrics.tempo_primeira_resposta_vendedor < 240) scoreQualidade += 20; // < 4h
  if (messages && messages.length > 0) scoreQualidade += 10; // Tem comunicação
  metrics.score_qualidade = Math.min(100, scoreQualidade);

  // 7-9. VALORES DE REEMBOLSO
  const payment = order.payments?.[0];
  if (payment) {
    metrics.valor_reembolso_total = payment.total_paid_amount || payment.transaction_amount || 0;
    metrics.valor_reembolso_produto = payment.transaction_amount || 0;
    metrics.valor_reembolso_frete = payment.shipping_cost || 0;
    
    // 13. DATA PROCESSAMENTO REEMBOLSO
    if (payment.date_last_modified) {
      metrics.data_processamento_reembolso = payment.date_last_modified;
    }
  }

  // 10. TAXA ML REEMBOLSO
  if (payment) {
    if (payment.marketplace_fee_details?.amount) {
      metrics.taxa_ml_reembolso = payment.marketplace_fee_details.amount;
    } else if (payment.marketplace_fee) {
      metrics.taxa_ml_reembolso = payment.marketplace_fee;
    } else if (metrics.valor_reembolso_produto) {
      // Calcular taxa padrão ML (aproximadamente 6.5% para devoluções)
      metrics.taxa_ml_reembolso = metrics.valor_reembolso_produto * 0.065;
    }
  }

  // 11. CUSTO LOGÍSTICO TOTAL
  if (shipping) {
    if (shipping.cost) {
      metrics.custo_logistico_total = shipping.cost;
    } else if (order.shipping?.cost) {
      metrics.custo_logistico_total = order.shipping.cost;
    }
  } else if (order.shipping?.cost) {
    // Para envios ML Full, usar custo estimado baseado no valor
    const valorProduto = metrics.valor_reembolso_produto || 0;
    if (valorProduto > 0) {
      if (valorProduto <= 100) metrics.custo_logistico_total = 8.50;
      else if (valorProduto <= 300) metrics.custo_logistico_total = 12.90;
      else if (valorProduto <= 500) metrics.custo_logistico_total = 15.50;
      else metrics.custo_logistico_total = 18.90;
    }
  }

  // 12. IMPACTO FINANCEIRO VENDEDOR
  const taxaML = metrics.taxa_ml_reembolso || 0;
  const custoLog = metrics.custo_logistico_total || 0;
  const valorReemb = metrics.valor_reembolso_produto || 0;
  
  if (taxaML > 0 || custoLog > 0 || valorReemb > 0) {
    metrics.impacto_financeiro_vendedor = taxaML + custoLog + valorReemb;
  }

  console.log('✅ Métricas calculadas:', {
    tempo_primeira_resposta: metrics.tempo_primeira_resposta_vendedor,
    dias_resolucao: metrics.dias_ate_resolucao,
    sla_cumprido: metrics.sla_cumprido,
    valor_reembolso: metrics.valor_reembolso_total,
    impacto_financeiro: metrics.impacto_financeiro_vendedor
  });

  return metrics;
}

/**
 * 💾 SALVAR/ATUALIZAR DADOS NO BANCO
 */
async function upsertOrderData(supabase: any, enrichedData: any) {
  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('devolucoes_avancadas')
      .select('id')
      .eq('order_id', enrichedData.order_id)
      .eq('integration_account_id', enrichedData.integration_account_id)
      .single();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('devolucoes_avancadas')
        .update(enrichedData)
        .eq('id', existing.id);
      
      if (error) throw error;
      console.log(`✅ Pedido ${enrichedData.order_id} atualizado`);
    } else {
      // Inserir
      const { error } = await supabase
        .from('devolucoes_avancadas')
        .insert(enrichedData);
      
      if (error) throw error;
      console.log(`✅ Pedido ${enrichedData.order_id} inserido`);
    }

  } catch (error) {
    console.error(`❌ Erro ao salvar pedido ${enrichedData.order_id}:`, error);
    throw error;
  }
}

/**
 * 🔑 BUSCAR TOKEN ML
 */
async function getMLAccessToken(supabase: any, accountId: string): Promise<MLAccessTokenResponse | null> {
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

    return {
      access_token: data.access_token,
      account_identifier: data.account_identifier
    };

  } catch (error) {
    console.error('❌ Erro ao buscar token ML:', error);
    return null;
  }
}

/**
 * 🔄 PROCESSAMENTO UNIFICADO
 */
async function unifiedRealTimeProcessing(supabase: any, body: RequestBody, mlTokens: MLAccessTokenResponse, account: any) {
  console.log('🔄 Iniciando processamento unificado em tempo real');
  return await processRealTimeData(supabase, body, mlTokens, account);
}

/**
 * 📡 BUSCAR DADOS EM TEMPO REAL
 */
async function fetchRealTimeMLData(supabase: any, body: RequestBody, mlTokens: MLAccessTokenResponse, account: any) {
  console.log('📡 Buscando dados em tempo real da API ML');
  return await processRealTimeData(supabase, body, mlTokens, account);
}