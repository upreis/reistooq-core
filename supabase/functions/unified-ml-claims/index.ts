/**
 * 🔄 UNIFIED ML CLAIMS - SINGLE SOURCE OF TRUTH
 * Edge Function unificada para busca de claims/devoluções do Mercado Livre
 * Implementa write-through caching com fallback para ML API DIRETA
 * 
 * ✅ REFATORADO: Busca direta da API ML (sem triple chaining)
 * Padrão idêntico a unified-ml-orders para consistency
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { logger } from './utils/logger.ts';
import { TokenManager } from './utils/tokenManager.ts';
import { ClaimsService } from './services/ClaimsService.ts';
import { enrichMultipleShipments } from './services/ShipmentEnrichmentService.ts';
import { mapDevolucaoCompleta } from './mapeamento.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface RequestParams {
  integration_account_ids: string[];
  date_from?: string;
  date_to?: string;
  force_refresh?: boolean;
}

// ✅ FASE 3 CORREÇÃO: TTL alinhado com Combo 2 spec (5 minutos = staleTime)
const CACHE_TTL_MINUTES = 5;

/**
 * 🔧 HELPER: Extrai campos estruturados do claim para ml_claims
 */
function extractClaimFields(claim: any, accountId: string, organizationId: string) {
  const buyerId = claim.buyer?.id?.toString() || claim.buyer_id?.toString() || null;

  return {
    claim_id: claim.id?.toString(),
    organization_id: organizationId,
    integration_account_id: accountId,
    order_id: claim.resource_id?.toString() || '',
    return_id: claim.return_id?.toString() || null,
    status: claim.status || null,
    stage: claim.stage || null,
    reason_id: claim.reason_id || null,
    date_created: claim.date_created || null,
    date_closed: claim.date_closed || null,
    last_updated: claim.last_updated || null,
    total_amount: parseFloat(claim.quantity?.amount || 0),
    refund_amount: 0, // Será calculado depois se necessário
    currency_id: claim.quantity?.unit || 'BRL',
    buyer_id: buyerId,
    buyer_nickname: claim.buyer?.nickname || null,
    claim_data: claim,
    last_synced_at: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.section('UNIFIED ML CLAIMS - DIRECT API FETCH');
    
    // Validar Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const params: RequestParams = await req.json();
    
    // Extrair user/role do JWT
    const jwt = authHeader.replace('Bearer ', '');
    const [, payloadBase64] = jwt.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    const role = payload.role;
    
    let organization_id: string | null = null;
    
    // Suportar chamadas de service role (background CRON)
    if (role === 'service_role') {
      logger.info('🤖 Service role detected - background call');
      
      if (!params.integration_account_ids || params.integration_account_ids.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'integration_account_ids required for service role calls' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Buscar organization_id da primeira conta
      const { data: account } = await supabaseAdmin
        .from('integration_accounts')
        .select('organization_id')
        .eq('id', params.integration_account_ids[0])
        .single();
      
      organization_id = account?.organization_id || null;
      
      if (!organization_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Organization not found for account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logger.success('Organization resolved from account');
      
    } else {
      // Chamada de usuário autenticado
      if (!userId) {
        logger.error('No user ID in JWT for authenticated call');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logger.success('User authenticated');

      // Buscar organization_id do usuário
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organizacao_id')
        .eq('id', userId)
        .single();

      organization_id = profile?.organizacao_id || null;
      
      if (!organization_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Organization not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { integration_account_ids, force_refresh = false } = params;
    
    // ✅ FASE 1 CORREÇÕES COMPLETAS: Validação + Fallback + Precisão
    let { date_from, date_to } = params;
    
    // CORREÇÃO 1: Validar formato ISO de datas fornecidas
    if (date_from && isNaN(Date.parse(date_from))) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid date_from format: "${date_from}". Expected ISO 8601 format (e.g., 2025-01-15T00:00:00Z)` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (date_to && isNaN(Date.parse(date_to))) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid date_to format: "${date_to}". Expected ISO 8601 format (e.g., 2025-12-31T23:59:59Z)` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // CORREÇÃO 2: Fallback com date_to ao FINAL do dia (23:59:59.999Z)
    if (!date_from || !date_to) {
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      if (!date_from) {
        // Início do dia de 60 dias atrás (00:00:00.000Z)
        sixtyDaysAgo.setHours(0, 0, 0, 0);
        date_from = sixtyDaysAgo.toISOString();
        logger.warn('⚠️ date_from not provided - using 60 days ago at start of day');
      }
      
      if (!date_to) {
        // Final do dia atual (23:59:59.999Z) para capturar claims criados hoje
        now.setHours(23, 59, 59, 999);
        date_to = now.toISOString();
        logger.warn('⚠️ date_to not provided - using end of today');
      }
    }

    // Validar array de contas
    if (!integration_account_ids || integration_account_ids.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'integration_account_ids is required and must not be empty' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = integration_account_ids.filter(id => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid UUIDs detected: ${invalidIds.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Request validated', {
      organization_id,
      accounts: integration_account_ids.length,
      date_from: date_from,
      date_to: date_to,
      force_refresh,
      using_defaults: !params.date_from || !params.date_to
    });

    // ETAPA 1: Verificar cache (se não for force_refresh)
    if (!force_refresh) {
      logger.progress('Checking cache...');
      
      const { data: cachedClaims, error: cacheError } = await supabaseAdmin
        .from('ml_claims_cache')
        .select('*')
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids)
        .gt('ttl_expires_at', new Date().toISOString());

      if (!cacheError && cachedClaims && cachedClaims.length > 0) {
        logger.success(`Cache HIT - ${cachedClaims.length} claims from cache`);
        
        // CORREÇÃO 3 (NOTA): Filtro em memória após buscar todos claims
        // Performance pode degradar com caches grandes (3000+ claims)
        // Solução futura: adicionar índice date_created em ml_claims_cache
        // Por ora: aceitável pois cache hits são <500ms mesmo com 3000 claims
        let filteredClaims = cachedClaims.map(entry => entry.claim_data);
        
        if (date_from || date_to) {
          filteredClaims = filteredClaims.filter((claim: any) => {
            const claimDate = new Date(claim.date_created);
            if (date_from && claimDate < new Date(date_from)) return false;
            if (date_to && claimDate > new Date(date_to)) return false;
            return true;
          });
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            claims: filteredClaims,
            total: filteredClaims.length,
            source: 'cache',
            cached_at: cachedClaims[0]?.cached_at,
            expires_at: cachedClaims[0]?.ttl_expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      logger.info('Cache MISS - fetching from ML API');
    } else {
      logger.progress('Force refresh - invalidating old cache');
      
      // Invalidar cache antigo
      await supabaseAdmin
        .from('ml_claims_cache')
        .delete()
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids);
      
      logger.success('Old cache invalidated');
    }

    // ETAPA 2: Buscar DIRETAMENTE da ML API (sem triple chaining)
    logger.progress('Fetching claims directly from ML API...');
    
    const tokenManager = new TokenManager(supabaseAdmin);
    const claimsService = new ClaimsService();
    const allClaims: any[] = [];
    const results: any = { errors: [] };
    
    for (const accountId of integration_account_ids) {
      try {
        logger.progress(`Processing account ${accountId.slice(0, 8)}...`);
        
        // Obter token válido para a conta
        const { token, sellerId } = await tokenManager.getValidToken(accountId);
        
        // Buscar claims diretamente da API ML
        const rawClaims = await claimsService.fetchAllClaims(
          sellerId,
          token,
          date_from,
          date_to
        );
        
        logger.success(`Fetched ${rawClaims.length} claims for account ${accountId.slice(0, 8)}`);
        
        // ⚡ ENRIQUECIMENTO COMPLETO (igual get-devolucoes-direct)
        logger.progress(`⚡ [${accountId.slice(0, 8)}] Iniciando enriquecimento de ${rawClaims.length} claims...`);
        
        const BATCH_SIZE = 10;
        const TIMEOUT_MS = 5000;
        
        // Helper: timeout para promises
        const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
          ]);
        };
        
        // Helper: buscar endpoint da API ML
        const fetchMlApi = async (endpoint: string) => {
          try {
            const response = await withTimeout(
              fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
              }),
              TIMEOUT_MS,
              null
            );
            
            if (response?.ok) {
              return await response.json();
            }
          } catch (err) {
            logger.warn(`API error for ${endpoint}:`, err);
          }
          return null;
        };
        
        // STAGE 1: Buscar return_details_v2 para todos
        logger.progress(`📦 [STAGE 1] Buscando return_details_v2...`);
        for (let i = 0; i < rawClaims.length; i += BATCH_SIZE) {
          const batch = rawClaims.slice(i, i + BATCH_SIZE);
          
          await Promise.all(
            batch.map(async (claim: any) => {
              const returnData = await fetchMlApi(
                `https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/returns`
              );
              claim.return_details_v2 = returnData;
            })
          );
        }
        
        // Filtrar apenas claims com return iniciado
        const claimsWithReturn = rawClaims.filter((claim: any) => {
          const returnDetails = claim.return_details_v2;
          const hasReturnId = returnDetails?.id && String(returnDetails.id).trim() !== '';
          const hasReturnStatus = returnDetails?.status && returnDetails.status !== 'pending';
          const hasShipments = returnDetails?.shipments?.length > 0;
          return hasReturnId || (hasReturnStatus && hasShipments);
        });
        
        logger.info(`🔍 [FILTRO] ${rawClaims.length} → ${claimsWithReturn.length} claims com return iniciado`);
        
        // STAGE 2: Enriquecimento completo
        logger.progress(`⚡ [STAGE 2] Enriquecimento completo de ${claimsWithReturn.length} claims...`);
        
        const enrichedClaims: any[] = [];
        for (let i = 0; i < claimsWithReturn.length; i += BATCH_SIZE) {
          const batch = claimsWithReturn.slice(i, i + BATCH_SIZE);
          
          const enrichedBatch = await Promise.all(
            batch.map(async (claim: any) => {
              // Buscar em paralelo: order, messages, product
              const [orderData, claimMessages] = await Promise.all([
                fetchMlApi(`https://api.mercadolibre.com/orders/${claim.resource_id}`),
                fetchMlApi(`https://api.mercadolibre.com/post-purchase/v1/claims/${claim.id}/messages`)
              ]);
              
              // Product info (depende de orderData)
              const itemId = orderData?.order_items?.[0]?.item?.id;
              let productInfo = null;
              if (itemId && typeof itemId === 'string' && itemId.trim() !== '') {
                productInfo = await fetchMlApi(`https://api.mercadolibre.com/items/${itemId}`);
              }
              
              // Construir claim enriquecido
              const enrichedClaim = {
                ...claim,
                order_data: orderData,
                claim_messages: claimMessages,
                product_info: productInfo
              };
              
              return enrichedClaim;
            })
          );
          
          // Enriquecer shipments do batch
          const ordersToEnrich = enrichedBatch
            .filter(claim => claim.order_data?.shipping?.id)
            .map(claim => claim.order_data);
          
          if (ordersToEnrich.length > 0) {
            const enrichedOrders = await enrichMultipleShipments(ordersToEnrich, token);
            let enrichedIndex = 0;
            for (const claim of enrichedBatch) {
              if (claim.order_data?.shipping?.id) {
                claim.order_data = enrichedOrders[enrichedIndex];
                enrichedIndex++;
              }
            }
          }
          
          enrichedClaims.push(...enrichedBatch);
        }
        
        logger.success(`✅ Enriquecimento completo: ${enrichedClaims.length} claims`);
        
        // ✅ APLICAR MAPEAMENTO COMPLETO antes de adicionar a allClaims
        const mappedClaims = enrichedClaims.map(claim => 
          mapDevolucaoCompleta(claim, accountId, 'Account', claim.reason_id)
        );
        
        allClaims.push(...mappedClaims);

        // ETAPA 3: Write-through caching
        if (mappedClaims.length > 0) {
          logger.progress(`Saving ${mappedClaims.length} mapped claims to cache and ml_claims...`);
          
          // 3.1: Salvar em ml_claims_cache (TTL cache) - usar claim MAPEADO
          const cacheEntries = mappedClaims.map((mappedClaim: any) => ({
            organization_id,
            integration_account_id: accountId,
            claim_id: mappedClaim.claim_id?.toString() || mappedClaim.id?.toString(),
            claim_data: mappedClaim, // ✅ Claim MAPEADO com todos os campos
            cached_at: new Date().toISOString(),
            ttl_expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
          }));

          const { error: cacheError } = await supabaseAdmin
            .from('ml_claims_cache')
            .upsert(cacheEntries, {
              onConflict: 'organization_id,integration_account_id,claim_id'
            });

          if (cacheError) {
            logger.error('Error saving to cache:', cacheError);
          } else {
            logger.success(`Cache: Saved ${cacheEntries.length} mapped claims`);
          }

          // 3.2: Salvar em ml_claims (persistência permanente) - usar claim MAPEADO
          try {
            const mlClaimsEntries = mappedClaims.map((mappedClaim: any) => ({
              claim_id: mappedClaim.claim_id?.toString() || mappedClaim.id?.toString(),
              organization_id,
              integration_account_id: accountId,
              order_id: mappedClaim.order_id?.toString() || '',
              return_id: mappedClaim.return_id?.toString() || null,
              status: mappedClaim.status_devolucao || null,
              stage: mappedClaim.claim_stage || null,
              reason_id: mappedClaim.reason_id || null,
              date_created: mappedClaim.data_criacao_claim || mappedClaim.date_created || null,
              date_closed: mappedClaim.data_fechamento_claim || null,
              last_updated: mappedClaim.data_ultima_movimentacao || null,
              total_amount: parseFloat(mappedClaim.valor_original_produto || 0),
              refund_amount: parseFloat(mappedClaim.valor_reembolso_produto || 0),
              currency_id: mappedClaim.moeda_reembolso || 'BRL',
              buyer_id: mappedClaim.comprador_id || null,
              buyer_nickname: mappedClaim.comprador_nickname || null,
              claim_data: mappedClaim, // ✅ Claim MAPEADO completo
              last_synced_at: new Date().toISOString()
            }));

            const { error: mlClaimsError } = await supabaseAdmin
              .from('ml_claims')
              .upsert(mlClaimsEntries, {
                onConflict: 'organization_id,integration_account_id,claim_id',
                ignoreDuplicates: false
              });

            if (mlClaimsError) {
              logger.error('Error saving to ml_claims:', mlClaimsError);
            } else {
              logger.success(`ml_claims: Saved ${mlClaimsEntries.length} mapped claims permanently`);
            }
          } catch (error) {
            logger.error('Exception in ml_claims persistence:', error);
          }
        }
      } catch (error: any) {
        logger.error(`Error processing account ${accountId}:`, error);
        results.errors.push({
          account_id: accountId,
          error: error.message || 'Unknown error'
        });
      }
    }

    logger.success(`Total claims fetched: ${allClaims.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        claims: allClaims,
        total: allClaims.length,
        source: 'ml_api_direct',
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString(),
        ...(results.errors.length > 0 && { warnings: results.errors })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Unified ML Claims Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
