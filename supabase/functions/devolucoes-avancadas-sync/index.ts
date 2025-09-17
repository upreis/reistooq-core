/**
 * 🚀 SISTEMA DE DEVOLUÇÕES OTIMIZADO - PROCESSAMENTO RÁPIDO
 * Cache inteligente + processamento paralelo para máxima performance
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

interface RequestBody {
  action: 'calculate_all_metrics' | 'fetch_advanced_metrics';
  integration_account_id: string;
  limit?: number;
}

// Cache simples em memória para evitar reprocessamento
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processamento otimizado iniciado');
    
    if (req.method !== 'POST') {
      return fail('Método não permitido', 405);
    }

    const body: RequestBody = await req.json();
    const { integration_account_id, limit = 100 } = body;
    
    console.log(`🔄 Ação: ${body.action}`, { integration_account_id, limit });

    const supabase = makeServiceClient();
    
    // 1. Validar conta (sem await desnecessário)
    const { data: account, error: accountError } = await supabase
      .from('integration_accounts')
      .select('id, organization_id, name, provider, account_identifier')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('❌ Conta não encontrada:', accountError);
      return fail('Conta de integração não encontrada');
    }

    console.log(`✅ Conta validada: ${account.name} (${account.provider})`);

    // 2. Buscar token otimizado
    const tokenData = await getTokenOptimized(supabase, integration_account_id, account);
    if (!tokenData) {
      return fail('Token ML não encontrado');
    }

    console.log(`✅ Token ML decriptado com sucesso para conta ${account.name}`);

    // 3. Verificar cache primeiro
    const cacheKey = `claims_${integration_account_id}`;
    const cached = cache.get(cacheKey);
    
    let claims = [];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('📦 Usando dados do cache');
      claims = cached.data;
    } else {
      // Buscar dados via ml-api-direct com timeout otimizado
      console.log('🔥 Buscando dados frescos via ml-api-direct');
      
      const { data: mlData, error: mlError } = await supabase.functions.invoke('ml-api-direct', {
        body: {
          action: 'get_claims_and_returns',
          integration_account_id,
          seller_id: account.account_identifier,
          access_token: tokenData.access_token,
          filters: { date_from: '', date_to: '', status: '' }
        }
      });

      if (mlError || !mlData?.success) {
        console.error('❌ Erro ao buscar dados via ml-api-direct:', mlError);
        throw new Error(`Erro ML API: ${mlError?.message || 'Unknown error'}`);
      }

      claims = mlData.data || [];
      // Armazenar no cache
      cache.set(cacheKey, { data: claims, timestamp: Date.now() });
    }

    console.log(`📊 Processando ${claims.length} claims/returns`);

    if (claims.length === 0) {
      return ok({
        success: true,
        message: 'Nenhuma devolução encontrada',
        processed_count: 0,
        total_found: 0
      });
    }

    // 4. Processar claims em paralelo (máximo 5 simultâneas)
    const results = [];
    const batchSize = 5;
    const claimsToProcess = claims.slice(0, limit);
    
    console.log(`⚡ Processando ${claimsToProcess.length} claims em lotes de ${batchSize}`);
    
    for (let i = 0; i < claimsToProcess.length; i += batchSize) {
      const batch = claimsToProcess.slice(i, i + batchSize);
      console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(claimsToProcess.length/batchSize)}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (claim) => {
          const processedClaim = await processClaimData(claim, supabase);
          // Salvar no banco em background
          EdgeRuntime.waitUntil(upsertOrderData(supabase, processedClaim));
          return processedClaim;
        })
      );
      
      // Coletar apenas os sucessos
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Erro no claim ${batch[index]?.order_id}:`, result.reason);
        }
      });
    }

    return ok({
      success: true,
      message: `${results.length} devoluções processadas com métricas`,
      processed_count: results.length,
      total_found: claims.length,
      cache_used: cached ? true : false,
      processing_time_optimized: true
    });

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return fail(`Erro interno: ${error.message}`, 500);
  }
});

async function getTokenOptimized(supabase: any, integration_account_id: string, account: any) {
  const { data: secretRow, error: fetchError } = await supabase
    .from('integration_secrets')
    .select('simple_tokens, use_simple')
    .eq('integration_account_id', integration_account_id)
    .eq('provider', 'mercadolivre')
    .maybeSingle();

  if (fetchError || !secretRow?.simple_tokens) {
    return null;
  }

  try {
    const { data: decryptResult, error: decryptError } = await supabase
      .rpc('decrypt_simple', { encrypted_data: secretRow.simple_tokens });
    
    if (!decryptError && decryptResult) {
      const secret = JSON.parse(decryptResult);
      return {
        access_token: secret.access_token,
        account_identifier: account.account_identifier
      };
    }
  } catch (error) {
    console.error('❌ Erro ao decriptar token:', error);
  }
  
  return null;
}

async function processClaimData(claim: any, supabase: any) {
  const orderData = claim.order_data || {};
  const claimDetails = claim.claim_details || {};
  const claimMessages = claim.claim_messages || {};
  const messages = claimMessages.messages || [];
  
  // Usar Promise.all para operações paralelas quando possível
  const [dataCreated, dataUpdated, sellerId] = await Promise.resolve([
    new Date(claim.date_created || orderData.date_created),
    new Date(orderData.last_updated || claim.date_created),
    claim.order_data?.seller?.id?.toString()
  ]);
  
  const dataResolution = claimDetails.last_updated ? new Date(claimDetails.last_updated) : null;
  
  // Cálculos rápidos em paralelo
  const calculations = calculateMetrics(messages, dataCreated, dataResolution, sellerId, orderData);
  
  return {
    order_id: claim.order_id,
    claim_id: claimDetails.id,
    ...calculations,
    integration_account_id: claim.integration_account_id || claim.order_data?.integration_account_id,
    organization_id: claim.organization_id || claim.order_data?.organization_id,
    data_created: dataCreated.toISOString(),
    data_updated: dataUpdated.toISOString(),
    raw_data: claim
  };
}

function calculateMetrics(messages: any[], dataCreated: Date, dataResolution: Date | null, sellerId: string, orderData: any) {
  // 1. Tempo primeira resposta (otimizado com find ao invés de filter)
  let primeiraRespostaVendedor = null;
  const sellerMessage = messages.find((msg: any) => {
    const isFromSeller = msg.from?.role === 'seller' || 
                        msg.sender_id?.toString() === sellerId ||
                        msg.author_role === 'seller';
    if (!isFromSeller) return false;
    
    const messageDate = new Date(msg.date_created || msg.created_at || msg.date);
    return messageDate > dataCreated;
  });
  
  if (sellerMessage) {
    const messageDate = new Date(sellerMessage.date_created || sellerMessage.created_at || sellerMessage.date);
    primeiraRespostaVendedor = Math.round((messageDate.getTime() - dataCreated.getTime()) / (1000 * 60 * 60));
  }
  
  // 2-3. Tempos de resolução
  let tempoTotalResolucao = null;
  let diasResolucao = null;
  if (dataResolution) {
    tempoTotalResolucao = Math.round((dataResolution.getTime() - dataCreated.getTime()) / (1000 * 60 * 60));
    diasResolucao = Math.ceil((dataResolution.getTime() - dataCreated.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // 4. SLA e eficiência (cálculos rápidos)
  const slaCumprido = (primeiraRespostaVendedor === null || primeiraRespostaVendedor <= 72) && 
                      (diasResolucao === null || diasResolucao <= 7);
  
  let eficiencia = null;
  if (tempoTotalResolucao !== null) {
    const tempoEsperado = 72;
    eficiencia = Math.max(0, Math.min(100, Math.round((tempoEsperado / tempoTotalResolucao) * 100)));
  }
  
  // 5. Score simplificado
  let score = 0;
  if (slaCumprido) score += 40;
  if (primeiraRespostaVendedor && primeiraRespostaVendedor <= 24) score += 30;
  if (eficiencia && eficiencia >= 80) score += 30;
  
  // 6. Valores financeiros (pegando o primeiro payment refunded)
  const payments = orderData.payments || [];
  const refundedPayment = payments.find((p: any) => p.status === 'refunded') || payments[0] || {};
  
  const valorReembolsoTotal = refundedPayment.transaction_amount_refunded || refundedPayment.total_paid_amount || 0;
  const valorReembolsoFrete = refundedPayment.shipping_cost || 0;
  const valorReembolsoProduto = valorReembolsoTotal - valorReembolsoFrete;
  const taxaML = refundedPayment.marketplace_fee || 0;
  const custoLogistico = valorReembolsoFrete;
  const impactoVendedor = valorReembolsoTotal + taxaML;
  const dataReembolso = refundedPayment.date_last_modified || refundedPayment.date_approved || null;
  
  return {
    tempo_primeira_resposta_vendedor: primeiraRespostaVendedor,
    tempo_total_resolucao: tempoTotalResolucao,
    dias_resolucao: diasResolucao,
    sla_cumprido: slaCumprido,
    eficiencia: eficiencia,
    score_qualidade: score,
    valor_reembolso_total: valorReembolsoTotal,
    valor_reembolso_produto: valorReembolsoProduto,
    valor_reembolso_frete: valorReembolsoFrete,
    taxa_ml: taxaML,
    custo_logistico: custoLogistico,
    impacto_vendedor: impactoVendedor,
    data_reembolso: dataReembolso
  };
}

async function upsertOrderData(supabase: any, processedClaim: any) {
  try {
    const { error } = await supabase
      .from('ml_devolucoes_avancadas')
      .upsert({
        order_id: processedClaim.order_id,
        claim_id: processedClaim.claim_id,
        integration_account_id: processedClaim.integration_account_id,
        organization_id: processedClaim.organization_id,
        
        // 13 métricas calculadas
        tempo_primeira_resposta_vendedor: processedClaim.tempo_primeira_resposta_vendedor,
        tempo_total_resolucao: processedClaim.tempo_total_resolucao,
        dias_resolucao: processedClaim.dias_resolucao,
        sla_cumprido: processedClaim.sla_cumprido,
        eficiencia: processedClaim.eficiencia,
        score_qualidade: processedClaim.score_qualidade,
        valor_reembolso_total: processedClaim.valor_reembolso_total,
        valor_reembolso_produto: processedClaim.valor_reembolso_produto,
        valor_reembolso_frete: processedClaim.valor_reembolso_frete,
        taxa_ml: processedClaim.taxa_ml,
        custo_logistico: processedClaim.custo_logistico,
        impacto_vendedor: processedClaim.impacto_vendedor,
        data_reembolso: processedClaim.data_reembolso,
        
        data_created: processedClaim.data_created,
        data_updated: processedClaim.data_updated,
        raw_data: processedClaim.raw_data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      });

    if (error) {
      console.error(`❌ Erro ao salvar ${processedClaim.order_id}:`, error);
    } else {
      console.log(`✅ Dados salvos para order ${processedClaim.order_id}`);
    }
  } catch (error) {
    console.error(`❌ Erro crítico ao salvar ${processedClaim.order_id}:`, error);
  }
}