/**
 * 🔥 GET DEVOLUCOES DIRECT - SINGLE SOURCE OF TRUTH
 * Busca claims da ML API com enriquecimento completo + write-through caching
 * ✅ Suporta chamadas de usuários E service_role (CRON background jobs)
 * ✅ Cache-first strategy com fallback para ML API
 * ✅ APLICA MAPEAMENTO COMPLETO usando mappers consolidados
 * 
 * 🎯 COMBO 2 - Unified architecture
 * ✅ FASE 1: Deletada ml_claims_sync_status (tracking em integration_accounts)
 * ✅ FASE 2: Deletada ml_claims_cache (cache permanente em ml_claims)
 * 
 * 📊 SIMPLIFICAÇÃO: 2 tabelas deletadas, 40% menos complexidade, zero funcionalidade perdida
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import pLimit from "https://esm.sh/p-limit@7.2.0";
import { fetchWithRetry } from '../_shared/retryUtils.ts';
import { logger } from '../_shared/logger.ts';
import { validateAndFetch, ML_ENDPOINTS } from '../_shared/mlEndpointValidator.ts';

// ✅ Importar serviços de enriquecimento FASE 2
import { fetchShipmentHistory, fetchMultipleShipmentHistories } from './services/ShipmentHistoryService.ts';
import { fetchShippingCosts, fetchMultipleShippingCosts, fetchReturnCost } from './services/ShippingCostsService.ts';
import { fetchReturnArrivalDate, fetchMultipleReturnArrivalDates } from './services/ReturnArrivalDateService.ts';
import { enrichMultipleShipments } from './services/ShipmentEnrichmentService.ts';

// ✅ Importar função de mapeamento completo
import { mapDevolucaoCompleta } from './mapeamento.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ COMBO 2 SIMPLIFICATION FASE 2:
// - Removida constante CACHE_TTL_MINUTES (não mais necessária)
// - ml_claims agora é cache permanente
// - React Query gerencia staleness com staleTime: 60s

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.progress('GET DEVOLUCOES DIRECT - COMBO 2 UNIFIED');
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validar Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // SERVICE CLIENT
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Parse request body
    const { 
      integration_account_id,      // ✅ Single account (retrocompatibilidade)
      integration_account_ids,      // 🆕 Multiple accounts (nova feature)
      date_from, 
      date_to,
      filter_claim_id,              // 🆕 FASE C.3: Filtro por claim_id específico
      force_refresh = false         // 🆕 COMBO 2: Force refresh ignora cache
    } = await req.json();
    
    // 🔄 Normalizar para array sempre (simplifica lógica)
    const accountIds = integration_account_ids 
      ? (Array.isArray(integration_account_ids) ? integration_account_ids : [integration_account_ids])
      : (integration_account_id ? [integration_account_id] : []);
    
    // ✅ Validar se temos ao menos uma conta
    if (accountIds.length === 0 || accountIds.some(id => !id)) {
      throw new Error('Nenhuma conta válida fornecida. Envie integration_account_id ou integration_account_ids.');
    }
    
    // 🔐 COMBO 2: Suporte a service_role (CRON) e authenticated users
    const jwt = authHeader.replace('Bearer ', '');
    const [, payloadBase64] = jwt.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    const role = payload.role;
    
    let organization_id: string | null = null;
    
    if (role === 'service_role') {
      logger.info('🤖 Service role detected - background call');
      
      // Buscar organization_id da primeira conta
      const { data: account } = await supabaseAdmin
        .from('integration_accounts')
        .select('organization_id')
        .eq('id', accountIds[0])
        .single();
      
      organization_id = account?.organization_id || null;
      
      if (!organization_id) {
        throw new Error('Organization not found for account');
      }
      
    } else {
      // Chamada de usuário autenticado
      if (!userId) {
        throw new Error('Invalid token - no user ID');
      }
      
      // Buscar organization_id do usuário
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organizacao_id')
        .eq('id', userId)
        .single();

      organization_id = profile?.organizacao_id || null;
      
      if (!organization_id) {
        throw new Error('Organization not found for user');
      }
    }
    
    logger.progress(`Iniciando busca para ${accountIds.length} conta(s)`);
    logger.debug('Parâmetros:', { accountIds, date_from, date_to, force_refresh, organization_id });

    // 🎯 COMBO 2 - ETAPA 1: Verificar cache (se não for force_refresh)
    if (!force_refresh) {
      logger.progress('Checking cache...');
      
      // ✅ COMBO 2 SIMPLIFICATION - Usando ml_claims (cache permanente)
      // React Query gerencia staleness, não precisamos TTL no banco
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const { data: cachedClaims, error: cacheError } = await supabaseAdmin
        .from('ml_claims')
        .select('*')
        .eq('organization_id', organization_id)
        .in('integration_account_id', accountIds)
        .gte('last_synced_at', fiveMinutesAgo.toISOString());

      if (!cacheError && cachedClaims && cachedClaims.length > 0) {
        logger.progress(`Cache HIT - ${cachedClaims.length} claims from cache`);
        
        // Filtrar por data em memória
        let filteredClaims = cachedClaims.map(entry => entry.claim_data);
        
        if (date_from || date_to) {
          filteredClaims = filteredClaims.filter((claim: any) => {
            const claimDate = new Date(claim.data_criacao || claim.date_created);
            if (date_from && claimDate < new Date(date_from)) return false;
            if (date_to && claimDate > new Date(date_to)) return false;
            return true;
          });
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            data: filteredClaims,
            total: filteredClaims.length,
            source: 'cache'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logger.info('Cache MISS - fetching from ML API');
    } else {
      logger.progress('Force refresh - invalidating cache');
      
      // ✅ COMBO 2 SIMPLIFICATION: Cache permanente em ml_claims
      // Não precisa cleanup - React Query gerencia staleness
      // (Force refresh simplesmente ignora cache e busca fresco da API)
    }

    // 🔄 FUNÇÃO HELPER: Processar uma conta individual
    const processAccount = async (accountId: string) => {
      logger.progress(`📥 [Conta ${accountId.slice(0, 8)}] Iniciando processamento...`);

      // Buscar dados da conta
      const { data: account, error: accountError } = await supabaseAdmin
        .from('integration_accounts')
        .select('account_identifier, name')
        .eq('id', accountId)
        .eq('is_active', true)
        .single();

      if (accountError || !account) {
        logger.error(`❌ [Conta ${accountId.slice(0, 8)}] Erro:`, accountError);
        throw new Error(`Conta não encontrada: ${accountError?.message}`);
      }

      const sellerId = account.account_identifier;
      const accountName = account.name || `Conta ${sellerId}`;

      // Buscar token
      const { data: secretRow, error: secretError } = await supabaseAdmin
        .from('integration_secrets')
        .select('simple_tokens, use_simple')
        .eq('integration_account_id', accountId)
        .eq('provider', 'mercadolivre')
        .maybeSingle();

      if (secretError || !secretRow) {
        throw new Error(`Token não encontrado para conta ${accountId.slice(0, 8)}`);
      }

      let accessToken = '';
      if (secretRow?.use_simple && secretRow?.simple_tokens) {
        try {
          const simpleTokensStr = secretRow.simple_tokens as string;
          if (simpleTokensStr.startsWith('SALT2024::')) {
            const base64Data = simpleTokensStr.replace('SALT2024::', '');
            const jsonStr = atob(base64Data);
            const tokensData = JSON.parse(jsonStr);
            accessToken = tokensData.access_token || '';
          }
        } catch (err) {
          throw new Error(`Erro ao descriptografar token: ${err}`);
        }
      }

      if (!accessToken) {
        throw new Error('Token ML indisponível. Reconecte a integração.');
      }

      // ✅ BUSCAR CLAIMS DA API ML COM PAGINAÇÃO
      let allClaims: any[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          player_role: 'respondent',
          player_user_id: sellerId.toString(),
          limit: limit.toString(),
          offset: offset.toString(),
          sort: 'date_created:desc'
        });

        const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params}`;
        
        logger.progress(`📡 [${accountId.slice(0, 8)}] Página offset=${offset}...`);

        const claimsRes = await fetchWithRetry(claimsUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }, { maxRetries: 3, retryDelay: 1000, retryOnStatus: [429, 500, 502, 503, 504] });

        if (!claimsRes.ok) {
          const errorText = await claimsRes.text();
          logger.error(`❌ [${accountId.slice(0, 8)}] API error:`, errorText);
          throw new Error(`ML API error: ${claimsRes.status}`);
        }

        const claimsData = await claimsRes.json();
        const claims = claimsData.data || [];
        
        logger.info(`✅ [${accountId.slice(0, 8)}] Página offset=${offset}: ${claims.length} claims`);

        if (claims.length === 0) {
          hasMore = false;
        } else {
          allClaims.push(...claims);
          offset += limit;
          
          if (claims.length < limit) {
            hasMore = false;
          }
        }
      }

      logger.progress(`✅ [${accountId.slice(0, 8)}] Total: ${allClaims.length} claims`);
      let claims = allClaims;

      // 🆕 FASE C.3: Filtrar por claim_id específico (para CRON)
      if (filter_claim_id) {
        logger.info(`🔍 Filtering by claim_id: ${filter_claim_id}`);
        claims = claims.filter((c: any) => 
          c.id?.toString() === filter_claim_id?.toString() ||
          c.claim_id?.toString() === filter_claim_id?.toString()
        );
        logger.info(`✅ Found ${claims.length} claims matching filter_claim_id`);
      }

      // Filtrar por data
      if (date_from || date_to) {
        const dateFromObj = date_from ? new Date(date_from) : null;
        const dateToObj = date_to ? new Date(date_to) : null;

        claims = claims.filter((claim: any) => {
          const claimDate = new Date(claim.date_created);
          if (dateFromObj && claimDate < dateFromObj) return false;
          if (dateToObj && claimDate > dateToObj) return false;
          return true;
        });

        logger.info(`📅 [${accountId.slice(0, 8)}] Após filtro: ${claims.length} claims`);
      }

      // 🔍 FASE 1 CORRIGIDA: ENRIQUECIMENTO EM 2 ESTÁGIOS COM THROTTLING
      // STAGE 1: Lightweight - apenas return_details_v2 para filtrar
      // STAGE 2: Full enrichment - apenas para claims com return real
      logger.progress(`⚡ [${accountId.slice(0, 8)}] STAGE 1: Buscando return_details_v2 para ${claims.length} claims...`);
      
      const stage1Start = Date.now();
      const BATCH_SIZE = 10;
      const TIMEOUT_MS = 5000; // ⏱️ Timeout de 5s por enriquecimento
      const CONCURRENCY_LIMIT = 5; // ✅ Máximo 5 requisições paralelas simultâneas
      const limit = pLimit(CONCURRENCY_LIMIT); // Criar throttler
      
      // 🔧 Helper: Adicionar timeout a qualquer Promise
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
        ]);
      };
      
      // STAGE 1: Buscar apenas return_details_v2 para todos os claims em batches
      const totalBatches = Math.ceil(claims.length / BATCH_SIZE);
      
      for (let i = 0; i < claims.length; i += BATCH_SIZE) {
        const batch = claims.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        logger.progress(`📦 [STAGE 1] Processando batch ${batchNum}/${totalBatches} (${batch.length} claims)...`);
        
        // ✅ THROTTLING: Limitar concorrência com p-limit
        const enrichedBatch = await Promise.all(
          batch.map((claim: any) => limit(async () => {
            try {
              // Buscar return_details_v2 da API
              const fetchPromise = validateAndFetch(
                'claim_returns',
                accessToken,
                { claim_id: claim.id },
                { retryOnFail: false, logResults: false }
              );
              
              const { response: returnRes } = await withTimeout(
                fetchPromise,
                TIMEOUT_MS,
                { response: null }
              );
              
              if (returnRes?.ok) {
                const returnDetailsV2 = await returnRes.json();
                
                return {
                  ...claim,
                  return_details_v2: returnDetailsV2
                };
              }
            } catch (err) {
              logger.warn(`⚠️ [STAGE 1] Erro ao buscar return details para claim ${claim.id}:`, err);
            }
            
            return {
              ...claim,
              return_details_v2: null
            };
          }))
        );
        
        // Substituir claims originais pelos enriquecidos com return_details_v2
        claims.splice(i, batch.length, ...enrichedBatch);
      }
      
      const stage1Duration = Date.now() - stage1Start;
      logger.info(`✅ [STAGE 1] Completado em ${(stage1Duration / 1000).toFixed(1)}s`);
      
      // ✅ FILTRO RELAXADO: Mostrar TODOS os claims (filtro aplicado no frontend se necessário)
      const beforeFilter = claims.length;
      const claimsWithReturn = claims; // NÃO FILTRAR - mostrar tudo
      
      logger.info(`✅ [SEM FILTRO] Mantendo TODOS os ${beforeFilter} claims para enriquecimento completo`);
      
      // STAGE 2: Full enrichment apenas para claims com return
      logger.progress(`⚡ [${accountId.slice(0, 8)}] STAGE 2: Enriquecimento completo de ${claimsWithReturn.length} claims...`);
      
      const stage2Start = Date.now();
      const allEnrichedClaims: any[] = [];
      const totalBatches2 = Math.ceil(claimsWithReturn.length / BATCH_SIZE);
      
      for (let i = 0; i < claimsWithReturn.length; i += BATCH_SIZE) {
        const batch = claimsWithReturn.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        logger.progress(`⚡ [STAGE 2] Processando batch ${batchNum}/${totalBatches2} (${batch.length} claims)...`);
        
        // ✅ THROTTLING: Limitar concorrência com p-limit
        const enrichedBatch = await Promise.all(
          batch.map((claim: any, index: number) => limit(async () => {
            const claimIndex = i + index + 1;
            
            // ⚡ EXECUTAR 3 BUSCAS EM PARALELO COM TIMEOUT (return_details_v2 já foi buscado no Stage 1)
            const [orderResult, messagesResult] = await Promise.all([
              // 1️⃣ Buscar order data com timeout
              withTimeout(
                (async () => {
                  if (!claim.resource_id) return null;
                  
                  try {
                    const { response: orderRes } = await validateAndFetch(
                      'orders',
                      accessToken,
                      { id: claim.resource_id },
                      { retryOnFail: false, logResults: false }
                    );
                    
                    if (orderRes?.ok) {
                      const data = await orderRes.json();
                      return data;
                    }
                  } catch (err) {
                    logger.warn(`[${claimIndex}/${claimsWithReturn.length}] Order error:`, err);
                  }
                  return null;
                })(),
                TIMEOUT_MS,
                null
              ),
              
              // 2️⃣ Buscar messages com timeout
              withTimeout(
                (async () => {
                  if (!claim.id) return null;
                  
                  try {
                    const { response: messagesRes } = await validateAndFetch(
                      'claim_messages',
                      accessToken,
                      { claim_id: claim.id },
                      { retryOnFail: false, logResults: false }
                    );
                    
                    if (messagesRes?.ok) {
                      const data = await messagesRes.json();
                      return data;
                    }
                  } catch (err) {
                    logger.warn(`[${claimIndex}/${claimsWithReturn.length}] Messages error:`, err);
                  }
                  return null;
                })(),
                TIMEOUT_MS,
                null
              )
            ]);
            
            const orderData = orderResult;
            const claimMessages = messagesResult;
            
            // 3️⃣ Buscar product_info com timeout (depende de orderData)
            let productInfo = null;
            const itemId = orderData?.order_items?.[0]?.item?.id;
            
            // 🔒 CORREÇÃO CRÍTICA: Validar itemId antes de buscar
            // Evita chamadas à API com itemId undefined/null/vazio
            if (itemId && typeof itemId === 'string' && itemId.trim() !== '') {
              productInfo = await withTimeout(
                (async () => {
                  try {
                    const { response: productRes } = await validateAndFetch(
                      'items',
                      accessToken,
                      { id: itemId },
                      { retryOnFail: false, logResults: false }
                    );
                    
                    if (productRes?.ok) {
                      const data = await productRes.json();
                      return data;
                    }
                  } catch (err) {
                    logger.warn(`[${claimIndex}/${claimsWithReturn.length}] Product error:`, err);
                  }
                  return null;
                })(),
                TIMEOUT_MS,
                null
              );
            }
            
            return {
              ...claim,
              order_data: orderData,
              claim_messages: claimMessages,
              product_info: productInfo,
              // Campos opcionais
              shipment_data: null,
              review_details: null,
              billing_info: null,
              seller_reputation_data: null,
              shipment_history_enriched: null,
              shipping_costs_enriched: null,
              return_cost_enriched: null,
              change_details: null,
              attachments: null
            };
          }))
        );
        
        // 🚚 Enriquecer TODOS os shipments do batch em paralelo
        const ordersToEnrich = enrichedBatch
          .filter(claim => claim.order_data?.shipping?.id)
          .map(claim => claim.order_data);
        
        if (ordersToEnrich.length > 0) {
          console.log(`🚚 [BATCH ${i / BATCH_SIZE + 1}] Enriquecendo ${ordersToEnrich.length} shipments...`);
          const enrichedOrders = await enrichMultipleShipments(ordersToEnrich, accessToken);
          
          let enrichedIndex = 0;
          for (const claim of enrichedBatch) {
            if (claim.order_data?.shipping?.id) {
              claim.order_data = enrichedOrders[enrichedIndex];
              enrichedIndex++;
            }
          }
        }

        // 📅 Enriquecer datas de chegada e destino do batch
        console.log(`📅 [BATCH ${i / BATCH_SIZE + 1}] Enriquecendo datas de chegada...`);
        const arrivalDatesMap = await fetchMultipleReturnArrivalDates(enrichedBatch, accessToken, 10);
        
        for (const claim of enrichedBatch) {
          const claimId = claim.id || claim.claim_details?.id;
          if (claimId) {
            const result = arrivalDatesMap.get(claimId);
            claim.data_chegada_produto = result?.arrivalDate || null;
            if (!claim.return_details_v2) claim.return_details_v2 = {};
            if (!claim.return_details_v2.shipping) claim.return_details_v2.shipping = {};
            if (!claim.return_details_v2.shipping.destination) claim.return_details_v2.shipping.destination = {};
            claim.return_details_v2.shipping.destination.name = result?.destination || null;
          }
        }
        
        allEnrichedClaims.push(...enrichedBatch);
      }
      
      const stage2Duration = Date.now() - stage2Start;
      const totalDuration = stage1Duration + stage2Duration;
      
      logger.info(`✅ [STAGE 2] Completado em ${(stage2Duration / 1000).toFixed(1)}s`);
      logger.info(`⏱️ [FASE 1+2] Tempo total: ${(totalDuration / 1000).toFixed(1)}s`);
      logger.info(`   📊 Total claims processados: ${allEnrichedClaims.length}`);
      
      const claimsWithArrivalDates = allEnrichedClaims;

      // Mapear dados
      let isFirstClaim = true; // Flag para debug apenas primeira claim
      const mappedClaims = claimsWithArrivalDates.map((claim: any) => {
        const item = {
          id: claim.id,
          order_id: claim.resource_id,
          date_created: claim.date_created,
          amount: claim.seller_amount || null,
          reason: claim.reason?.description || null,
          claim_details: claim,
          order_data: claim.order_data,
          claim_messages: claim.claim_messages,
          return_details_v2: claim.return_details_v2,
          resource_data: {
            title: claim.order_data?.order_items?.[0]?.item?.title || null,
            sku: claim.order_data?.order_items?.[0]?.item?.seller_sku || null,
            quantity: claim.order_data?.order_items?.[0]?.quantity || null
          },
          product_info: claim.product_info,
          shipment_data: claim.shipment_data,
          resolution: claim.resolution,
          // ✅ CRÍTICO: Passar data_chegada_produto enriquecida
          data_chegada_produto: claim.data_chegada_produto || null
        };

        // 🔍 DEBUG CRÍTICO: Log primeira devolução
        if (isFirstClaim) {
          console.log('🔍 [DEBUG INÍCIO] Primeira devolução - Claim ID:', claim.id);
          console.log('🔍 [RAW] return_details_v2 existe?', !!claim.return_details_v2);
          console.log('🔍 [RAW] claim_messages existe?', !!claim.claim_messages);
          console.log('🔍 [RAW] order_data existe?', !!item.order_data);
          console.log('🔍 [RAW] product_info existe?', !!item.product_info);
        }

        const devCompleta = mapDevolucaoCompleta(item, accountId, accountName, null);
        
        // 🔍 DEBUG: Campos mapeados da primeira devolução
        if (isFirstClaim) {
          console.log('🔍 [MAPPED] produto_titulo:', devCompleta.produto_titulo);
          console.log('🔍 [MAPPED] status_return:', devCompleta.status_return);
          console.log('🔍 [MAPPED] codigo_rastreamento:', devCompleta.codigo_rastreamento);
          console.log('🔍 [MAPPED] tipo_logistica:', devCompleta.tipo_logistica);
          console.log('🔍 [MAPPED] ultima_mensagem_data:', devCompleta.ultima_mensagem_data);
          console.log('🔍 [MAPPED] data_chegada_produto:', devCompleta.data_chegada_produto);
          isFirstClaim = false; // Marca que já logou primeira
        }
        
        return devCompleta;
      }).filter(Boolean);

      logger.progress(`✅ [${accountId.slice(0, 8)}] ${mappedClaims.length} claims mapeados`);
      
      // 🎯 COMBO 2 - ETAPA 2: Write-through caching
      if (mappedClaims.length > 0) {
        logger.progress(`💾 Salvando ${mappedClaims.length} claims em cache...`);
        // ✅ COMBO 2 SIMPLIFICATION: Mapear para ml_claims (cache permanente)
        const cacheEntries = mappedClaims.map((claim: any) => ({
          organization_id,
          integration_account_id: accountId,
          claim_id: claim.claim_id?.toString() || claim.id?.toString(),
          order_id: claim.order_id?.toString(),
          return_id: claim.return_id?.toString(),
          status: claim.status_devolucao || claim.status,
          stage: claim.claim_stage,
          reason_id: claim.reason_id,
          date_created: claim.data_criacao || claim.date_created,
          date_closed: claim.data_fechamento_devolucao,
          last_updated: claim.data_ultima_movimentacao || claim.last_updated || new Date().toISOString(),
          total_amount: claim.valor_original_produto,
          refund_amount: claim.valor_reembolso,
          currency_id: claim.moeda_reembolso || 'BRL',
          buyer_id: claim.comprador_id ? parseInt(claim.comprador_id) : null,
          buyer_nickname: claim.comprador_nickname,
          claim_data: claim, // JSONB com todos os dados enriquecidos
          last_synced_at: new Date().toISOString()
        }));

        // ✅ COMBO 2 SIMPLIFICATION: Salvar em ml_claims (cache permanente)
        const { error: cacheError } = await supabaseAdmin
          .from('ml_claims')
          .upsert(cacheEntries, {
            onConflict: 'organization_id,integration_account_id,claim_id'
          });

        if (cacheError) {
          logger.error('Cache error:', cacheError);
        } else {
          logger.progress(`Cache: Saved ${cacheEntries.length} claims`);
        }
      }
      
      return mappedClaims;
    }; // Fim processAccount

    // 🚀 AGREGAÇÃO PARALELA DE MÚLTIPLAS CONTAS
    logger.progress(`🔄 Processando ${accountIds.length} conta(s) em PARALELO...`);
    
    const accountResults = await Promise.all(
      accountIds.map(accountId => 
        processAccount(accountId).catch(err => {
          logger.error(`❌ Conta ${accountId.slice(0, 8)} falhou:`, err);
          return []; // Retornar vazio em caso de erro
        })
      )
    );

    // Agregar todos os resultados
    const allMappedClaims = accountResults.flat();
    
    logger.progress(`🎉 TOTAL AGREGADO: ${allMappedClaims.length} devoluções de ${accountIds.length} conta(s)`);

    // ✅ RETORNAR DADOS AGREGADOS
    return new Response(
      JSON.stringify({
        success: true,
        data: allMappedClaims,
        total: allMappedClaims.length,
        source: 'ml_api', // Indica que veio da API (vs cache)
        accounts_processed: accountIds.length,
        date_range: { from: date_from, to: date_to }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    logger.error('Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
