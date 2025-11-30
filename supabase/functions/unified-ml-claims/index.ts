/**
 * 🔄 UNIFIED ML CLAIMS - SINGLE SOURCE OF TRUTH
 * Edge Function unificada para busca de claims/devoluções do Mercado Livre
 * Implementa write-through caching com fallback para ML API
 * 
 * COMBO 2 - FASE B para /devolucoesdevenda
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

const CACHE_TTL_MINUTES = 15;

/**
 * 🔧 HELPER: Extrai campos estruturados do claim_data para ml_claims
 */
function extractClaimFields(claim: any, accountId: string, organizationId: string) {
  // ✅ CORREÇÃO 2: buyer_id como string (ML IDs podem exceder Number.MAX_SAFE_INTEGER)
  const buyerId = claim.comprador_id?.toString() || null;

  return {
    claim_id: claim.claim_id?.toString() || claim.id?.toString(),
    organization_id: organizationId,
    integration_account_id: accountId,
    order_id: claim.order_id?.toString() || '',
    return_id: claim.return_id?.toString() || null,
    status: claim.status_devolucao || claim.status || null,
    stage: claim.claim_stage || null,
    reason_id: claim.reason_id || null,
    date_created: claim.data_criacao || claim.date_created || null,
    date_closed: claim.data_fechamento_devolucao || claim.date_closed || null,
    last_updated: claim.ultima_atualizacao_real || claim.last_updated || null,
    total_amount: parseFloat(claim.valor_original_produto || 0),
    refund_amount: parseFloat(claim.valor_reembolso || 0),
    currency_id: claim.moeda_reembolso || 'BRL',
    buyer_id: buyerId,
    buyer_nickname: claim.comprador_nickname || null,
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
    // ✅ CRITICAL: Como verify_jwt = true, Supabase já validou o JWT
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
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

    // Extrair user do JWT
    const jwt = authHeader.replace('Bearer ', '');
    const [, payloadBase64] = jwt.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    
    if (!userId) {
      console.error('❌ No user ID in JWT');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ User authenticated:', userId);

    // Buscar organization_id do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organizacao_id')
      .eq('id', userId)
      .single();

    const organization_id = profile?.organizacao_id;
    if (!organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const params: RequestParams = await req.json();
    const { integration_account_ids, date_from, date_to, force_refresh = false } = params;

    // ✅ CORREÇÃO 3: Validar array vazio E UUIDs válidos
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

    console.log('📥 Unified ML Claims - Request:', {
      organization_id,
      accounts: integration_account_ids.length,
      date_from,
      date_to,
      force_refresh
    });

    // ETAPA 1: Verificar cache no Supabase (se não for force_refresh)
    if (!force_refresh) {
      console.log('🔍 Checking cache...');
      
      const { data: cachedClaims, error: cacheError } = await supabaseAdmin
        .from('ml_claims_cache')
        .select('*')
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids)
        .gt('ttl_expires_at', new Date().toISOString());

      if (!cacheError && cachedClaims && cachedClaims.length > 0) {
        console.log(`✅ Cache HIT - ${cachedClaims.length} claims from cache`);
        
        // Filtrar por data range se especificado
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
            claims: filteredClaims,
            total: filteredClaims.length,
            source: 'cache',
            cached_at: cachedClaims[0]?.cached_at,
            expires_at: cachedClaims[0]?.ttl_expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('❌ Cache MISS - fetching from ML API');
    } else {
      console.log('🔄 Force refresh - bypassing cache and invalidating old cache');
      
      // Invalidar cache antigo
      const { error: deleteError } = await supabaseAdmin
        .from('ml_claims_cache')
        .delete()
        .eq('organization_id', organization_id)
        .in('integration_account_id', integration_account_ids);
      
      if (deleteError) {
        console.error('⚠️ Error invalidating old cache:', deleteError);
      } else {
        console.log('✅ Old cache invalidated for accounts:', integration_account_ids);
      }
    }

    // ETAPA 2: Buscar da ML API (cache miss ou force refresh)
    // ✅ CORREÇÃO 4: Chamar get-devolucoes-direct (mantém enriquecimento específico)
    // ⚠️ PROBLEMA CRÍTICO 3 (EDGE FUNCTION CHAINING): 
    //    Arquitetura atual: ml-claims-auto-sync → unified-ml-claims → get-devolucoes-direct → ML API
    //    Impacto: 3-4x latência + custos + timeout risk
    //    TODO URGENTE: Migrar para chamada direta ML API ou implementar background tasks
    const allClaims: any[] = [];
    
    // ✅ CORREÇÃO: Declarar results ANTES do loop
    const results: any = {
      errors: []
    };
    
    for (const accountId of integration_account_ids) {
      console.log(`📡 Fetching claims for account ${accountId}...`);
      
      const claimsResponse = await supabaseAdmin.functions.invoke('get-devolucoes-direct', {
        body: {
          integration_account_id: accountId,
          date_from,
          date_to
        }
      });

      if (claimsResponse.error) {
        console.error(`❌ Error fetching account ${accountId}:`, claimsResponse.error);
        results.errors.push({
          account_id: accountId,
          error: claimsResponse.error.message || 'Unknown error'
        });
        continue;
      }

      const accountClaims = claimsResponse.data?.devolucoes || [];
      console.log(`✅ Fetched ${accountClaims.length} claims for account ${accountId}`);
      
      allClaims.push(...accountClaims);

      // ETAPA 3: Write-through caching - salvar no cache E na tabela permanente
      if (accountClaims.length > 0) {
        console.log(`💾 Saving ${accountClaims.length} claims to cache and ml_claims...`);
        
        // 3.1: Salvar em ml_claims_cache (TTL cache temporário)
        const cacheEntries = accountClaims.map((claim: any) => ({
          organization_id,
          integration_account_id: accountId,
          claim_id: claim.claim_id?.toString() || claim.id?.toString(),
          claim_data: claim,
          cached_at: new Date().toISOString(),
          ttl_expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
        }));

        const { error: cacheError } = await supabaseAdmin
          .from('ml_claims_cache')
          .upsert(cacheEntries, {
            onConflict: 'organization_id,integration_account_id,claim_id'
          });

        if (cacheError) {
          console.error('❌ Error saving to cache:', cacheError);
        } else {
          console.log(`✅ Cache: Saved ${cacheEntries.length} claims`);
        }

        // 3.2: Salvar em ml_claims (persistência permanente com campos estruturados)
        // ✅ CORREÇÃO 5: Logar detalhes de erro para debug
        try {
          const mlClaimsEntries = accountClaims.map((claim: any) => 
            extractClaimFields(claim, accountId, organization_id)
          );

          const { error: mlClaimsError } = await supabaseAdmin
            .from('ml_claims')
            .upsert(mlClaimsEntries, {
              onConflict: 'organization_id,integration_account_id,claim_id',
              ignoreDuplicates: false
            });

          if (mlClaimsError) {
            console.error('❌ Error saving to ml_claims:', mlClaimsError);
            console.error('📋 Error details:', {
              code: mlClaimsError.code,
              message: mlClaimsError.message,
              details: mlClaimsError.details,
              hint: mlClaimsError.hint
            });
          } else {
            console.log(`✅ ml_claims: Saved ${mlClaimsEntries.length} claims permanently`);
          }
        } catch (error) {
          console.error('❌ Exception in ml_claims persistence:', error);
          console.error('📋 Exception details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
    }

    console.log(`✅ Total claims fetched: ${allClaims.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        claims: allClaims,
        total: allClaims.length,
        source: 'ml_api',
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString(),
        ...(results.errors.length > 0 && { warnings: results.errors })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unified ML Claims Error:', error);
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
