// 📦 ML API DIRECT - Fase 8: Deadlines e Lead Time
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { mapReasonWithApiData } from './mappers/reason-mapper.ts'
import { extractBuyerData, extractPaymentData } from './utils/field-extractor.ts'
import { logger } from './utils/logger.ts'
import { extractMediationData } from './utils/mediation-extractor.ts'
import { analyzeInternalTags } from './utils/tags-analyzer.ts'
import { mapReviewsData, extractReviewsFields } from './mappers/reviews-mapper.ts'
import { mapShipmentCostsData, extractCostsFields } from './mappers/costs-mapper.ts'
import { mapDetailedReasonsData, extractDetailedReasonsFields } from './mappers/reasons-detailed-mapper.ts'
import { fetchMLWithRetry } from './utils/retryHandler.ts'
import { ReasonsService } from './services/reasonsService.ts'
import { calculateDeadlines } from './utils/deadlineCalculator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🔒 Cliente Supabase para buscar tokens de forma segura
function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

// 🔄 Buscar dados de Returns (devolução)

// 🔄 Buscar dados de Returns (devolução)
async function buscarReturns(claimId: string, accessToken: string, integrationAccountId: string) {
  const url = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`
  
  try {
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ℹ️  Claim ${claimId} não tem returns (404)`)
        return null
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`  ✅ Returns encontrado para claim ${claimId}`)
    return data
    
  } catch (error) {
    console.warn(`  ⚠️  Erro ao buscar returns do claim ${claimId}:`, error.message)
    return null
  }
}

// 📦 Buscar histórico de rastreamento do shipment
async function buscarShipmentHistory(shipmentId: number, accessToken: string, integrationAccountId: string) {
  const url = `https://api.mercadolibre.com/shipments/${shipmentId}/history`
  
  try {
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ℹ️  Shipment ${shipmentId} não tem histórico (404)`)
        return null
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`  ✅ Histórico encontrado para shipment ${shipmentId}`)
    return data
    
  } catch (error) {
    console.warn(`  ⚠️  Erro ao buscar histórico do shipment ${shipmentId}:`, error.message)
    return null
  }
}

serve(async (req) => {
  // Logo no início do serve(), antes de qualquer if
  console.error('🚨 [TESTE] EDGE FUNCTION INICIADA!', {
    method: req.method,
    hasBody: req.body !== null
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { action, integration_account_id, seller_id, filters } = requestBody

    // 🚨 LOG DE DIAGNÓSTICO COMPLETO
    console.error('🚨 [TESTE] EDGE FUNCTION EXECUTADA!', {
      method: req.method,
      action: requestBody?.action,
      integration_account_id: requestBody?.integration_account_id,
      filters_periodoDias: requestBody?.filters?.periodoDias,
      filters_completo: requestBody?.filters
    });

    logger.debug('ML API Direct Request', { action, integration_account_id, seller_id, filters })

    if (action === 'get_claims_and_returns') {
      console.error('🚨 [TESTE] ACTION get_claims_and_returns EXECUTADA!');
      // 📄 PAGINAÇÃO SIMPLES - Máximo 100 por chamada
      const limit = Math.min(requestBody.limit || 100, 100);
      const offset = requestBody.offset || 0;
      
      // 🔒 Obter token de forma segura usando integrations-get-secret
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      // Fazer chamada HTTP direta para a função usando fetch
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        const errorText = await secretResponse.text();
        console.error(`❌ Erro ao obter token ML (${secretResponse.status}):`, errorText)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.',
            details: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      const tokenData = await secretResponse.json();
      
      if (!tokenData?.found || !tokenData?.secret?.access_token) {
        console.error('❌ Token ML não encontrado na resposta:', tokenData)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      const access_token = tokenData.secret.access_token
      logger.success(`Token ML obtido para seller: ${seller_id} (limit: ${limit}, offset: ${offset})`)
      
      // Validação crítica: seller_id deve existir
      if (!seller_id) {
        console.error('❌ ERRO CRÍTICO: seller_id não foi fornecido')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'seller_id é obrigatório para buscar pedidos cancelados' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // ============ BUSCAR PEDIDOS CANCELADOS DA API MERCADO LIVRE ============
      
      // ⏱️ Timeout de 5 minutos para evitar erro de Network connection lost
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: A busca excedeu 5 minutos. Use filtros de data para reduzir os resultados.')), 300000)
      );
      
      // ✅ PAGINAÇÃO: buscar com limit/offset
      const result = await Promise.race([
        buscarPedidosCancelados(seller_id, access_token, filters, integration_account_id, limit, offset),
        timeoutPromise
      ]) as { data: any[]; total: number; hasMore: boolean };
      
      const cancelledOrders = result.data;
      logger.info(`Página retornou: ${cancelledOrders.length} de ${result.total} total (hasMore: ${result.hasMore})`)
      
      // ============ ❌ FASE 1: SALVAMENTO EM pedidos_cancelados_ml (DESABILITADO) ============
      // ⚠️ NOTA: Este código foi DESABILITADO porque agora usamos devolucoes_avancadas
      // A tabela pedidos_cancelados_ml é LEGADA do sistema antigo (pré-refatoração Fases 1-7)
      // Agora o fluxo correto é: ml-api-direct → sync-devolucoes → devolucoes_avancadas
      
      /* CÓDIGO COMENTADO - SISTEMA ANTIGO
      if (cancelledOrders.length > 0) {
        try {
          const supabaseAdmin = makeServiceClient()
          
          // Preparar dados para inserção em pedidos_cancelados_ml
          const recordsToInsert = cancelledOrders.map(devolucao => ({
            // ... código de mapeamento extenso ...
          }))
          
          // Deduplicação e upsert
          const { data, error } = await supabaseAdmin
            .from('pedidos_cancelados_ml')
            .upsert(deduplicatedRecords, {
              onConflict: 'order_id,claim_id,integration_account_id',
              ignoreDuplicates: false
            });
          
          // ... resto do código de salvamento ...
        } catch (error: any) {
          logger.error('❌ Erro ao salvar em pedidos_cancelados_ml:', error);
        }
      }
      FIM CÓDIGO COMENTADO */
      
      logger.info(`⚠️ Salvamento em pedidos_cancelados_ml DESABILITADO - usando devolucoes_avancadas via sync-devolucoes`);
      // ============ FIM FASE 1 (DESABILITADO) ============
      
      // ✅ PAGINAÇÃO: Retornar resposta com metadados
      return new Response(
        JSON.stringify({
          success: true,
          data: result.data,
          pagination: {
            limit: limit,
            offset: offset,
            total: result.total,
            returned: result.data.length,
            hasMore: result.hasMore
          },
          totals: {
            cancelled_orders: result.data.length,
            total: result.total
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'get_reason_detail') {
      console.error('🚨 [TESTE] ACTION get_reason_detail EXECUTADA!');
      const { reason_id } = requestBody;
      
      // 🔒 Obter token de forma segura
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const tokenData = await secretResponse.json();
      const access_token = tokenData?.secret?.access_token;
      
      if (!access_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Buscar reason da API ML
      const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reason_id}`;
      
      try {
        const reasonResponse = await fetchMLWithRetry(reasonUrl, access_token, integration_account_id);
        
        if (reasonResponse.ok) {
          const reasonData = await reasonResponse.json();
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: reasonData 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else {
          console.warn(`⚠️ Reason ${reason_id} não encontrado (${reasonResponse.status})`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Reason não encontrado (${reasonResponse.status})` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: reasonResponse.status }
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar reason ${reason_id}:`, error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============================================
    // 🆕 ENDPOINT 1: REVIEWS (PRIORIDADE ALTA)
    // ============================================
    if (action === 'get_return_reviews') {
      const { return_id, integration_account_id } = requestBody;
      
      if (!return_id || !integration_account_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'return_id e integration_account_id são obrigatórios' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Obter token de forma segura
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const tokenData = await secretResponse.json();
      const access_token = tokenData?.secret?.access_token;
      
      if (!access_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Buscar reviews da API ML
      const reviewsUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/${return_id}/reviews`;
      logger.info(`Buscando reviews para return ${return_id}`);
      
      try {
        const reviewsResponse = await fetchMLWithRetry(reviewsUrl, access_token, integration_account_id);
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          logger.success(`Reviews encontrados para return ${return_id}`);
          
          // 🎯 MAPEAR DADOS usando mapper
          const mappedReviews = mapReviewsData(reviewsData);
          const extractedFields = extractReviewsFields(reviewsData);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: reviewsData,
              mapped: mappedReviews,
              extracted_fields: extractedFields
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else if (reviewsResponse.status === 404) {
          logger.info(`Return ${return_id} não tem reviews (404)`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: null,
              message: 'Return não possui reviews'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else {
          console.warn(`⚠️ Reviews ${return_id} não encontrados (${reviewsResponse.status})`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Reviews não encontrados (${reviewsResponse.status})` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: reviewsResponse.status }
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar reviews ${return_id}:`, error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============================================
    // 🆕 ENDPOINT 2: CUSTOS DE ENVIO (PRIORIDADE ALTA)
    // ============================================
    if (action === 'get_shipment_costs') {
      const { shipment_id, integration_account_id } = requestBody;
      
      if (!shipment_id || !integration_account_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'shipment_id e integration_account_id são obrigatórios' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Obter token de forma segura
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const tokenData = await secretResponse.json();
      const access_token = tokenData?.secret?.access_token;
      
      if (!access_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Buscar custos da API ML
      const costsUrl = `https://api.mercadolibre.com/shipments/${shipment_id}/costs`;
      logger.info(`Buscando custos para shipment ${shipment_id}`);
      
      try {
        const costsResponse = await fetchMLWithRetry(costsUrl, access_token, integration_account_id);
        
        if (costsResponse.ok) {
          const costsData = await costsResponse.json();
          logger.success(`Custos encontrados para shipment ${shipment_id}`);
          
          // 💰 MAPEAR DADOS usando mapper
          const mappedCosts = mapShipmentCostsData(costsData);
          const extractedFields = extractCostsFields(costsData);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: costsData,
              mapped: mappedCosts,
              extracted_fields: extractedFields
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else if (costsResponse.status === 404) {
          logger.info(`Shipment ${shipment_id} não tem custos (404)`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: null,
              message: 'Shipment não possui custos'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else {
          console.warn(`⚠️ Custos ${shipment_id} não encontrados (${costsResponse.status})`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Custos não encontrados (${costsResponse.status})` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: costsResponse.status }
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar custos ${shipment_id}:`, error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============================================
    // 🆕 FASE 2: BUSCAR RETURNS DE UM CLAIM ESPECÍFICO
    // ============================================
    if (action === 'get_claim_returns') {
      console.log('🔄 [get_claim_returns] Iniciando busca de returns do claim');
      const { claim_id } = requestBody;
      
      if (!claim_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'claim_id é obrigatório' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Obter token de forma segura
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const tokenData = await secretResponse.json();
      const access_token = tokenData?.secret?.access_token;
      
      if (!access_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Buscar returns do claim específico
      const returnsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claim_id}/returns`;
      console.log(`📦 Buscando returns para claim ${claim_id}`);
      
      try {
        const response = await fetchMLWithRetry(returnsUrl, access_token, integration_account_id);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`ℹ️  Claim ${claim_id} não tem returns (404)`);
            return new Response(
              JSON.stringify({ 
                success: true, 
                data: null,
                message: 'Claim não possui returns associados' 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const returnsData = await response.json();
        console.log(`✅ Returns encontrado para claim ${claim_id}:`, returnsData);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: returnsData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error) {
        console.error(`❌ Erro ao buscar returns do claim ${claim_id}:`, error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============================================
    // 🆕 ENDPOINT 3: RAZÕES PARA REVISÃO (PRIORIDADE MÉDIA)
    // ============================================
    if (action === 'get_return_reasons') {
      const { claim_id, integration_account_id } = requestBody;
      
      if (!claim_id || !integration_account_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'claim_id e integration_account_id são obrigatórios' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Obter token de forma segura
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const tokenData = await secretResponse.json();
      const access_token = tokenData?.secret?.access_token;
      
      if (!access_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Buscar razões da API ML
      const reasonsUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/reasons?flow=seller_return_failed&claim_id=${claim_id}`;
      logger.info(`Buscando razões de devolução para claim ${claim_id}`);
      
      try {
        const reasonsResponse = await fetchMLWithRetry(reasonsUrl, access_token, integration_account_id);
        
        if (reasonsResponse.ok) {
          const reasonsData = await reasonsResponse.json();
          logger.success(`Razões encontradas para claim ${claim_id}`);
          
          // 📋 MAPEAR DADOS usando mapper
          const mappedReasons = mapDetailedReasonsData(reasonsData);
          const extractedFields = extractDetailedReasonsFields(reasonsData);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: reasonsData,
              mapped: mappedReasons,
              extracted_fields: extractedFields
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else if (reasonsResponse.status === 404) {
          logger.info(`Claim ${claim_id} não tem razões (404)`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: null,
              message: 'Claim não possui razões de devolução'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else {
          console.warn(`⚠️ Razões ${claim_id} não encontradas (${reasonsResponse.status})`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Razões não encontradas (${reasonsResponse.status})` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: reasonsResponse.status }
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar razões ${claim_id}:`, error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação não suportada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro na ml-api-direct:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('Timeout');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
        suggestion: isTimeout 
          ? 'A busca sem filtro de data está demorando muito. Tente usar um filtro de data para reduzir a quantidade de resultados.'
          : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isTimeout ? 504 : 500 
      }
    )
  }
})

// ============ FUNÇÃO AUXILIAR: REFRESH TOKEN ============
async function refreshMLToken(integrationAccountId: string): Promise<string | null> {
  try {
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/mercadolibre-token-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ integration_account_id: integrationAccountId })
    });
    
    if (!refreshResponse.ok) {
      console.error(`❌ Falha no refresh do token: ${refreshResponse.status}`)
      return null
    }
    
    const refreshData = await refreshResponse.json()
    return refreshData.access_token || null
  } catch (error) {
    console.error(`❌ Erro ao fazer refresh do token:`, error)
    return null
  }
}

// ============ FUNÇÃO AUXILIAR: FETCH COM RETRY E REFRESH ============
async function fetchMLWithRetry(url: string, accessToken: string, integrationAccountId: string, maxRetries = 1): Promise<Response> {
  let currentToken = accessToken
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    // Se sucesso, retornar
    if (response.ok) {
      return response
    }
    
    // Se 401 (token expirado) e ainda tem tentativas, fazer refresh
    if (response.status === 401 && attempt < maxRetries) {
      const newToken = await refreshMLToken(integrationAccountId)
      
      if (newToken) {
        currentToken = newToken
        continue
      } else {
        console.error(`❌ Não foi possível fazer refresh do token`)
        return response
      }
    }
    
    // Qualquer outro erro ou última tentativa, retornar resposta
    return response
  }
  
  // Fallback (nunca deve chegar aqui)
  throw new Error('Fetch com retry falhou inesperadamente')
}

// ============ 🔧 FUNÇÕES DE BUSCA DE REASONS DA API ML ============

/**
 * 🔍 Busca detalhes de um reason específico na API do ML
 */
async function fetchReasonDetails(
  reasonId: string,
  accessToken: string,
  integrationAccountId: string
): Promise<{
  id: string;
  name: string;
  detail: string;
  flow?: string;
  expected_resolutions?: string[];
} | null> {
  try {
    const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reasonId}`;
    
    const response = await fetchMLWithRetry(
      reasonUrl,
      accessToken,
      integrationAccountId
    );
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const status = response.status;
      const errorText = await response.text();
      console.error(`❌ Reason ${reasonId} falhou - HTTP ${status}: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Exceção ao buscar reason ${reasonId}:`, error);
    return null;
  }
}


// ✅ FUNÇÃO REMOVIDA: mapReasonWithApiData agora está importado de ./mappers/reason-mapper.ts
// Isso elimina ~100 linhas de código duplicado

// ============ FUNÇÃO PARA BUSCAR CLAIMS/DEVOLUÇÕES DIRETAMENTE DA API ML ============
// ✅ PAGINAÇÃO IMPLEMENTADA - retorna { data, total, hasMore }
async function buscarPedidosCancelados(
  sellerId: string, 
  accessToken: string, 
  filters: any, 
  integrationAccountId: string,
  requestLimit: number = 2000,
  requestOffset: number = 0
): Promise<{ data: any[]; total: number; hasMore: boolean }> {
  try {
    
    // 📅 CALCULAR DATAS BASEADO NO PERÍODO
    const periodoDias = filters?.periodoDias ?? filters?.periodo_dias ?? 0;
    
    logger.info(`📋 Filtros recebidos:`, {
      periodoDias_recebido: filters?.periodoDias,
      periodo_dias_recebido: filters?.periodo_dias,
      periodoDias_usado: periodoDias
    });
    
    const BATCH_SIZE = 100;
    const MAX_CLAIMS_SAFETY_LIMIT = 10000;
    const allClaims: any[] = [];
    let offset = requestOffset;
    let consecutiveEmptyBatches = 0;
    let claimsForaDoPeriodo = 0;
    
    // 📅 Calcular data limite APENAS UMA VEZ (usando timezone do Brasil GMT-3)
    let dataLimite: Date | null = null;
    if (periodoDias > 0) {
      // ✅ FIX: Usar timezone do Brasil explicitamente para evitar erros
      const agora = new Date();
      
      // Obter data atual no Brasil (GMT-3) - Deno.env pode estar em UTC
      const brasilOffset = -3 * 60; // GMT-3 em minutos
      const utcTime = agora.getTime() + (agora.getTimezoneOffset() * 60000);
      const brasilTime = new Date(utcTime + (brasilOffset * 60000));
      
      // Zerar horas para comparação apenas de data
      dataLimite = new Date(brasilTime.getFullYear(), brasilTime.getMonth(), brasilTime.getDate(), 0, 0, 0, 0);
      dataLimite.setDate(dataLimite.getDate() - periodoDias);
      
      const dataLimiteStr = `${dataLimite.getFullYear()}-${String(dataLimite.getMonth() + 1).padStart(2, '0')}-${String(dataLimite.getDate()).padStart(2, '0')}`;
      const dataAtualStr = `${brasilTime.getFullYear()}-${String(brasilTime.getMonth() + 1).padStart(2, '0')}-${String(brasilTime.getDate()).padStart(2, '0')}`;
      
      logger.info(`📅 Filtro de período: ${periodoDias} dias | De: ${dataLimiteStr} até ${dataAtualStr} (Brasil GMT-3)`);
    } else {
      logger.info(`ℹ️  SEM filtro de período - buscando todos os claims`);
    }
    
    // 🔍 DIAGNÓSTICO: Verificar configuração de paginação
    logger.info(`⚙️ CONFIGURAÇÃO DE PAGINAÇÃO:`, {
      BATCH_SIZE,
      MAX_CLAIMS_SAFETY_LIMIT,
      requestOffset,
      periodoDias,
      dataLimite: dataLimite?.toISOString().split('T')[0] || 'sem filtro'
    });
    
    logger.info(`🚀 Buscando claims para seller ${sellerId}`);
    
    // ✅ VALIDAÇÃO DOS FILTROS RECEBIDOS:
    logger.info(`📋 Filtros completos recebidos:`, {
      periodoDias,
      statusClaim: filters?.statusClaim || 'não definido',
      claimType: filters?.claimType || 'não definido',
      stage: filters?.stage || 'não definido',
      fulfilled: filters?.fulfilled !== undefined ? filters.fulfilled : 'não definido',
      quantityType: filters?.quantityType || 'não definido',
      reasonId: filters?.reasonId || 'não definido',
      resource: filters?.resource || 'não definido'
    });
    
    // ✅ FIX CRÍTICO: Buscar TODOS os claims disponíveis (sem limite do frontend)
    while (allClaims.length < MAX_CLAIMS_SAFETY_LIMIT && consecutiveEmptyBatches < 3) {
      
      // Montar parâmetros da API ML
      const params = new URLSearchParams();
      params.append('player_role', 'respondent');
      params.append('player_user_id', sellerId);
      params.append('limit', BATCH_SIZE.toString());
      params.append('offset', offset.toString());
      
      // 🔍 DIAGNÓSTICO: Log inicial da requisição
      logger.info(`🌐 Preparando requisição API ML:`, {
        batch: Math.floor(offset / BATCH_SIZE) + 1,
        offset,
        limit: BATCH_SIZE,
        sellerId
      });
      
      // ⚠️ API ML NÃO ACEITA date_created.from/to para claims
      // Filtro de data será aplicado CLIENT-SIDE após buscar os dados
      
      // ⚠️ ORDENAR POR DATA DO CLAIM
      params.append('sort', 'date_created:desc');
      
      // ============ FILTROS OPCIONAIS DA API ML ============
      
      if (filters?.claimType && filters.claimType.trim().length > 0) {
        params.append('type', filters.claimType);
        logger.info(`✅ Filtro tipo aplicado: ${filters.claimType}`);
      }

      if (filters?.stage && filters.stage.trim().length > 0) {
        params.append('stage', filters.stage);
        logger.info(`✅ Filtro stage aplicado: ${filters.stage}`);
      }

      if (filters?.fulfilled !== undefined && filters.fulfilled !== null && filters.fulfilled !== '') {
        const fulfilledValue = String(filters.fulfilled).toLowerCase();
        if (fulfilledValue === 'true' || fulfilledValue === 'false') {
          params.append('fulfilled', fulfilledValue);
          logger.info(`✅ Filtro fulfilled aplicado: ${filters.fulfilled}`);
        }
      }

      if (filters?.quantityType && filters.quantityType.trim().length > 0) {
        params.append('quantity_type', filters.quantityType);
        logger.info(`✅ Filtro quantity_type aplicado: ${filters.quantityType}`);
      }

      if (filters?.reasonId && filters.reasonId.trim().length > 0) {
        params.append('reason_id', filters.reasonId);
        logger.info(`✅ Filtro reason_id aplicado: ${filters.reasonId}`);
      }

      if (filters?.resource && filters.resource.trim().length > 0) {
        params.append('resource', filters.resource);
        logger.info(`✅ Filtro resource aplicado: ${filters.resource}`);
      }
      
      const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`;
      
      // 🔍 DIAGNÓSTICO: URL completa da requisição
      logger.info(`🔗 URL MONTADA:`, {
        urlCompleta: url,
        parametros: Object.fromEntries(params.entries())
      });
      
      logger.info(`📄 Lote ${Math.floor(offset/BATCH_SIZE) + 1}: offset=${offset}, limit=${BATCH_SIZE} (total: ${allClaims.length})`);
      
      try {
        const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Token inválido - reconecte a integração');
          }
          if (response.status === 403) {
            throw new Error('Sem permissão para acessar claims');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 🔍 DIAGNÓSTICO DETALHADO DA RESPOSTA DA API
        const pagingInfo = data.paging || {};
        logger.info(`🔍 RESPOSTA API ML DETALHADA:`, {
          batch: Math.floor(offset / BATCH_SIZE) + 1,
          solicitado: BATCH_SIZE,
          recebido: data.data?.length || 0,
          total_disponivel_api: pagingInfo.total,
          offset_atual: pagingInfo.offset,
          limit_usado: pagingInfo.limit,
          tem_mais: data.data?.length === BATCH_SIZE,
          applied_filters: data.applied_filters || 'nenhum informado pela API',
          filtros_enviados: {
            date_from: params.get('date_created.from') || params.get('last_updated.from'),
            date_to: params.get('date_created.to') || params.get('last_updated.to'),
            tipo_data: params.get('date_created.from') ? 'date_created' : 'last_updated'
          }
        });
        
        // 📊 HEADERS DA RESPOSTA (Rate Limiting)
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        const rateLimitReset = response.headers.get('x-ratelimit-reset');
        if (rateLimitRemaining || rateLimitReset) {
          logger.info(`📊 RATE LIMIT:`, {
            remaining: rateLimitRemaining,
            reset: rateLimitReset,
            contentLength: response.headers.get('content-length')
          });
        }
        
        if (!data.data || !Array.isArray(data.data)) {
          logger.warn('Resposta sem dados válidos');
          consecutiveEmptyBatches++;
          break;
        }
        
        if (data.data.length === 0) {
          consecutiveEmptyBatches++;
          logger.warn(`⚠️ Lote vazio (${consecutiveEmptyBatches}/3)`);
        } else {
          consecutiveEmptyBatches = 0;
          
          // ✅ FILTRAR CLAIMS POR DATA SE periodoDias > 0
          if (dataLimite) {
            let claimsNoPeriodo = 0;
            let claimsDescartados = 0;
            
            const claimsFiltrados = data.data.filter((claim: any) => {
              const claimDate = new Date(claim.date_created);
              const dentroDataLimite = claimDate >= dataLimite;
              
              if (dentroDataLimite) {
                claimsNoPeriodo++;
              } else {
                claimsDescartados++;
              }
              
              return dentroDataLimite;
            });
            
            allClaims.push(...claimsFiltrados);
            
            logger.success(`✅ Lote ${Math.floor(offset/BATCH_SIZE) + 1}: ${claimsNoPeriodo}/${data.data.length} claims no período | Total acumulado: ${allClaims.length}`);
            
            // 🛑 PARAR BUSCA se 80%+ dos claims estão fora do período (chegamos em claims muito antigos)
            const percentualDescartado = (claimsDescartados / data.data.length) * 100;
            if (percentualDescartado >= 80) {
              logger.info(`🏁 Parando busca: ${percentualDescartado.toFixed(0)}% dos claims do lote estão fora do período de ${periodoDias} dias`);
              logger.info(`📊 Total filtrado: ${allClaims.length} claims no período | ${claimsForaDoPeriodo + claimsDescartados} descartados`);
              break;
            }
            
            claimsForaDoPeriodo += claimsDescartados;
          } else {
            allClaims.push(...data.data);
            logger.success(`✅ Lote ${Math.floor(offset/BATCH_SIZE) + 1}: ${data.data.length} claims | Total: ${allClaims.length}`);
          }
        }
        
        offset += BATCH_SIZE;
        
        // ✅ PARADA CORRETA: Se retornou menos que o esperado
        if (data.data.length < BATCH_SIZE) {
          logger.info(`🏁 Fim dos dados: última página retornou ${data.data.length} claims`);
          break;
        }
        
        // ⚠️ VERIFICAR LIMITE DE SEGURANÇA
        if (allClaims.length >= MAX_CLAIMS_SAFETY_LIMIT) {
          logger.warn(`🛑 LIMITE DE SEGURANÇA ATINGIDO: ${allClaims.length} claims coletados`);
          logger.warn(`⚠️ Se precisar de mais claims, contate o suporte para aumentar o limite`);
          break;
        }
        
        
        // ✅ FIX CRÍTICO: SEMPRE aguardar 500ms para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        logger.info(`⏱️ Aguardando 500ms antes do próximo lote...`);
        
      } catch (error) {
        logger.error(`❌ Erro no lote offset=${offset}:`, error.message);
        consecutiveEmptyBatches++;
        
        if (consecutiveEmptyBatches >= 3) {
          logger.error('Muitos erros consecutivos, parando busca');
          break;
        }
      }
    }
    
    logger.success(`🎯 BUSCA COMPLETA: ${allClaims.length} claims encontrados na API`);
    
    // 🛡️ VERIFICAÇÃO CRÍTICA: Validar dados recebidos da API
    if (!allClaims || !Array.isArray(allClaims)) {
      console.error(`❌ API retornou dados inválidos:`, allClaims);
      throw new Error('API do Mercado Livre retornou dados inválidos');
    }
    
    const totalAvailable = allClaims.length;  // Guardar total coletado
    
    // ========================================
    // 🔍 BUSCAR REASONS DE TODOS OS CLAIMS (ANTES DA FILA)
    // ========================================
    
    // Coletar todos os reason_ids únicos de TODOS os claims
    const allUniqueReasonIds = new Set<string>();
    
    for (const claim of allClaims) {
      const reasonId = claim?.reason_id;
      
      if (reasonId && typeof reasonId === 'string') {
        allUniqueReasonIds.add(reasonId);
      }
    }
    
    // Log detalhado de extração
    console.log(`🔍 FASE 1: Extração de reasons`, {
      totalClaims: allClaims.length,
      uniqueReasonIds: allUniqueReasonIds.size,
      primeiros5: Array.from(allUniqueReasonIds).slice(0, 5),
      exemploClaim: {
        id: allClaims[0]?.id,
        reason_id: allClaims[0]?.reason_id,
        claim_details: allClaims[0]?.claim_details ? 'existe' : 'NÃO existe'
      }
    });
    
    // Buscar todos os reasons em paralelo da API ML
    let allReasonsMap = new Map<string, any>();
    
    if (allUniqueReasonIds.size > 0) {
      console.log(`📦 FASE 2: Buscando ${allUniqueReasonIds.size} reasons únicos em lote...`);
      try {
        const reasonsService = new ReasonsService();
        allReasonsMap = await reasonsService.fetchMultipleReasons(
          Array.from(allUniqueReasonIds),
          accessToken,
          integrationAccountId
        );
        
        console.log(`✅ FASE 2 COMPLETA: ${allReasonsMap.size}/${allUniqueReasonIds.size} reasons carregados`);
        
        // 🔍 LOG DETALHADO: Mostrar exemplo de reason
        if (allReasonsMap.size > 0) {
          const firstReasonEntry = Array.from(allReasonsMap.entries())[0];
          logger.debug(`📝 Exemplo de reason carregado:`, {
            id: firstReasonEntry[0],
            name: firstReasonEntry[1]?.reason_name,
            detail: firstReasonEntry[1]?.reason_detail,
            flow: firstReasonEntry[1]?.reason_flow
          });
        } else {
          logger.error(`❌ NENHUM reason foi carregado! Verificar ReasonsService`);
        }
        
      } catch (error) {
        logger.error(`❌ Erro ao buscar reasons:`, error);
        // Continuar mesmo se falhar
      }
    } else {
      console.warn(`⚠️ NENHUM reason_id encontrado! Verificar extração.`);
    }
    
    // ✅ ENRIQUECER TODOS OS CLAIMS COM DADOS_REASONS
    logger.info(`\n🔄 FASE 2: Enriquecendo ${allClaims.length} claims com dados de reasons...`);
    
    const enrichedClaims = allClaims.map(claim => {
      const reasonId = claim?.reason_id;
      const reasonData = allReasonsMap.get(reasonId || '');
      
      console.log(`📦 Enriquecendo claim ${claim.id}:`, {
        reasonId,
        temReasonData: !!reasonData,
        reasonDataKeys: reasonData ? Object.keys(reasonData) : []
      });
      
      // ✅ SEMPRE retornar com dados_reasons (MANTENDO estrutura com prefixo reason_*)
      if (reasonData) {
        return {
          ...claim,
          dados_reasons: reasonData  // ✅ Usar objeto completo do ReasonsService
        };
      }
      
      // ⚠️ IMPORTANTE: Se reason não encontrado, retornar com dados_reasons NULL
      return {
        ...claim,
        dados_reasons: null  // ✅ NULL = processamento posterior faz fallback
      };
    });
    
    // 📊 Estatísticas de enriquecimento
    const enrichedCount = enrichedClaims.filter(c => c.dados_reasons?.reason_detail).length;
    const claimsComReasons = enrichedClaims.filter(c => c.dados_reasons !== null);
    
    console.log(`✅ Enriquecimento completo:`, {
      total: enrichedClaims.length,
      comReasons: claimsComReasons.length,
      semReasons: enrichedClaims.length - claimsComReasons.length,
      exemplo: enrichedClaims[0]?.dados_reasons ? {
        id: enrichedClaims[0].id,
        reason_id: enrichedClaims[0].dados_reasons.reason_id,
        reason_name: enrichedClaims[0].dados_reasons.reason_name
      } : null
    });
    
    logger.success(`✅ FASE 2 COMPLETA: ${enrichedCount}/${allClaims.length} claims enriquecidos`);
    logger.info(`⚠️ Claims sem dados de reasons: ${allClaims.length - enrichedCount}`);
    
    // ✅ SISTEMA DE FILAS: Adicionar TODOS os claims na fila para processamento
    const supabaseAdmin = makeServiceClient();
    
    console.log(`\n📦 ADICIONANDO ${enrichedClaims.length} CLAIMS ENRIQUECIDOS NA FILA DE PROCESSAMENTO...`)
    
    const claimsForQueue = enrichedClaims.map(claim => ({
      integration_account_id: integrationAccountId,
      claim_id: claim.id,
      order_id: claim.resource_id || claim.order_id,
      claim_data: claim, // ✅ Agora contém dados_reasons
      status: 'pending'
    }));
    
    // Inserir na fila (ignora duplicatas)
    const { error: queueError } = await supabaseAdmin
      .from('fila_processamento_claims')
      .upsert(claimsForQueue, { 
        onConflict: 'claim_id,integration_account_id',
        ignoreDuplicates: true 
      });
    
    if (queueError) {
      logger.error('Erro ao adicionar claims na fila:', queueError);
    } else {
      logger.success(`✅ ${allClaims.length} claims adicionados à fila de processamento`);
    }
    
    // ✅ ESTRATÉGIA DE DUAS ETAPAS PARA EVITAR TIMEOUT:
    // 1. Processar claims imediatamente (até 300)
    // 2. Processar restante em background via fila + cron
    
    // ✅ LÓGICA OTIMIZADA: Processa até 300 imediatamente, resto em background
    const IMMEDIATE_LIMIT = (() => {
      // Se solicitou até 300 claims, processa todos imediatamente
      if (requestLimit <= 300) return Math.min(enrichedClaims.length, requestLimit);
      
      // Se solicitou mais de 300, processa 300 imediatamente
      return Math.min(enrichedClaims.length, 300);
    })();
    const claimsParaProcessar = enrichedClaims.slice(0, IMMEDIATE_LIMIT); // ✅ Usar enrichedClaims
    const remainingClaims = enrichedClaims.slice(IMMEDIATE_LIMIT); // Restante vai para fila
    
    console.log(`\n📊 PROCESSAMENTO ESTRATÉGICO:`)
    console.log(`   • Total coletado da API ML: ${enrichedClaims.length} claims`)
    console.log(`   • Processando AGORA: ${claimsParaProcessar.length} claims (resposta rápida)`)
    console.log(`   • Restante: ${remainingClaims.length} claims (fila + cron job)`)
    console.log(`   • A fila processará automaticamente a cada minuto\n`)
    
    if (claimsParaProcessar.length === 0) {
      return {
        data: [],
        total: 0,
        hasMore: false,
        queued: enrichedClaims.length
      }
    }

    // ========================================
    // 🔍 USAR REASONS JÁ CARREGADOS (não buscar novamente)
    // ========================================
    
    logger.info(`✅ Processando ${claimsParaProcessar.length} claims com reasons já enriquecidos`);
    
    // Criar map dos reasons para acesso rápido durante processamento
    const reasonsDetailsMap = allReasonsMap; // ✅ Usar os reasons já buscados anteriormente
    
    // Processar cada claim para obter detalhes completos
    const ordersCancelados = []
    
    for (const claim of claimsParaProcessar) {
      try {
        // Proteção contra claims inválidos
        if (!claim || !claim.id) {
          console.warn(`⚠️ Claim inválido encontrado:`, claim)
          continue
        }
        
        // Extrair order_id do claim
        const orderId = claim.resource_id || claim.order_id
        
        if (!orderId) {
          console.warn(`⚠️ Claim ${claim.id} sem order_id/resource_id`)
          continue
        }
        
        console.log(`📦 Processando claim ${claim.id} para order ${orderId}...`)
        
        // Buscar detalhes completos do pedido
        const orderDetailUrl = `https://api.mercadolibre.com/orders/${orderId}`
        console.log(`📞 Buscando detalhes do pedido: ${orderId}`)
          
          const orderDetailResponse = await fetchMLWithRetry(orderDetailUrl, accessToken, integrationAccountId)
          
          // ✅ 1.1 - CORREÇÃO: Tratamento específico para 404 em pedidos
          if (!orderDetailResponse.ok) {
            if (orderDetailResponse.status === 404) {
              logger.warn(`Pedido ${orderId} não encontrado (404)`)
              // Marcar claim como "pedido não encontrado" e continuar
              ordersCancelados.push({
                claim_id: claim.id,
                order_id: orderId,
                status_devolucao: 'order_not_found',
                order_not_found: true,
                claim_details: claim,
                date_created: claim.date_created || new Date().toISOString(),
                marketplace_origem: 'mercadolivre'
              })
              continue // Pular para próximo claim
            }
            throw new Error(`Erro HTTP ${orderDetailResponse.status} ao buscar pedido ${orderId}`)
          }
          
          const orderDetail = await orderDetailResponse.json()
            
            // Buscar dados completos do claim (já temos o ID do claim do search)
            let claimData = null
            const mediationId = claim.id
            const packId = orderDetail.pack_id
            const sellerId = orderDetail.seller?.id || claim.seller_id
            
            try {
              // Buscar todos os dados do claim em paralelo incluindo returns
              const claimPromises = []
              
              // 1. Buscar claim principal
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 2. Buscar mensagens DIRETO do claim (FONTE PRINCIPAL)
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/messages`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 3. Buscar mensagens via pack_id (FONTE BACKUP)
              if (packId) {
                claimPromises.push(
                  fetchMLWithRetry(
                    `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`,
                    accessToken,
                    integrationAccountId
                  ).then(r => r.ok ? r.json() : null).catch(() => null)
                )
              } else {
                claimPromises.push(Promise.resolve(null))
              }
              
              // ✅ 1.2 - CORREÇÃO: Só buscar mediação se claim tiver mediation_id ou stage = dispute
              const hasMediationId = claim.mediation_id || claim.stage === 'dispute' // ✅ CORRIGIDO: dispute (não mediation)
              if (hasMediationId) {
                claimPromises.push(
                  fetchMLWithRetry(
                    `https://api.mercadolibre.com/post-purchase/v1/mediations/${mediationId}`,
                    accessToken,
                    integrationAccountId
                  ).then(async r => {
                    if (r.ok) {
                      console.log(`✅ Mediação encontrada para claim ${mediationId}`)
                      return r.json();
                    }
                    if (r.status === 404) {
                      logger.debug(`Mediação não disponível para claim ${mediationId}`)
                    } else {
                      console.log(`⚠️  Mediation failed (${r.status}): ${mediationId}`)
                    }
                    return null;
                  }).catch(e => {
                    logger.debug(`Erro ao buscar mediação ${mediationId}: ${e.message}`)
                    return null;
                  })
                )
              } else {
                // Não tem mediação, adicionar null ao array de promises
                claimPromises.push(Promise.resolve({ has_mediation: false }))
              }

              // 5. Buscar returns v2 usando claim ID
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 6. Buscar returns v1 usando claim ID
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/returns`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 7. Buscar shipment history do pedido original E devolução (ENRIQUECIDO FASE 1)
              claimPromises.push(
                (async () => {
                  const historyResults = {
                    original: null,
                    return: null,
                    combined_events: []
                  }
                  
                  // Tentar buscar histórico do envio original primeiro
                  const originalShipmentId = orderDetail?.shipping?.id
                  if (originalShipmentId) {
                    try {
                      const response = await fetchMLWithRetry(
                        `https://api.mercadolibre.com/shipments/${originalShipmentId}/history`,
                        accessToken,
                        integrationAccountId
                      )
                      if (response.ok) {
                        const historyData = await response.json()
                        historyResults.original = historyData
                        console.log(`🚚 Histórico do envio original encontrado: ${originalShipmentId}`)
                        
                        // Extrair eventos do histórico original
                        if (Array.isArray(historyData)) {
                          historyResults.combined_events.push(...historyData.map(event => ({
                            ...event,
                            shipment_type: 'original',
                            shipment_id: originalShipmentId
                          })))
                        }
                      }
                    } catch (e) {
                      console.warn(`⚠️ Erro ao buscar histórico do envio original:`, e)
                    }
                  }
                  
                  // Buscar histórico do shipment de devolução
                  try {
                    const returnsResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                      accessToken,
                      integrationAccountId
                    )
                    if (returnsResponse.ok) {
                      const returnsData = await returnsResponse.json()
                      const shipmentId = returnsData?.results?.[0]?.shipments?.[0]?.id || 
                                        returnsData?.results?.[0]?.shipments?.[0]?.shipment_id
                      if (shipmentId) {
                        console.log(`🚚 Buscando histórico do return shipment ${shipmentId}...`)
                        const historyResponse = await fetchMLWithRetry(
                          `https://api.mercadolibre.com/shipments/${shipmentId}/history`,
                          accessToken,
                          integrationAccountId
                        )
                        if (historyResponse.ok) {
                          const returnHistory = await historyResponse.json()
                          historyResults.return = returnHistory
                          
                          // Extrair eventos do histórico de devolução
                          if (Array.isArray(returnHistory)) {
                            historyResults.combined_events.push(...returnHistory.map(event => ({
                              ...event,
                              shipment_type: 'return',
                              shipment_id: shipmentId
                            })))
                          }
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar histórico de devolução:`, e)
                  }
                  
                  // Ordenar eventos combinados por data (mais recente primeiro)
                  historyResults.combined_events.sort((a, b) => 
                    new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
                  )
                  
                  return historyResults.combined_events.length > 0 ? historyResults : null
                })()
              )

              // 8. Buscar change details se for troca
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/changes`,
                  accessToken,
                  integrationAccountId
                ).then(async (r) => {
                  if (!r.ok) return null
                  const data = await r.json()
                  if (data?.results?.length > 0) {
                    const changeId = data.results[0].id
                    console.log(`🔄 Buscando detalhes da troca ${changeId}...`)
                    const changeResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v1/changes/${changeId}`,
                      accessToken,
                      integrationAccountId
                    )
                    return changeResponse.ok ? await changeResponse.json() : null
                  }
                  return null
                }).catch(() => null)
              )

              // 🆕 9. BUSCAR SHIPMENT COSTS (PRIORIDADE ALTA - FASE 1)
              claimPromises.push(
                (async () => {
                  const costsResults = {
                    original_costs: null,
                    return_costs: null
                  }
                  
                  // Tentar buscar custos do envio original
                  const originalShipmentId = orderDetail?.shipping?.id
                  if (originalShipmentId) {
                    try {
                      const response = await fetchMLWithRetry(
                        `https://api.mercadolibre.com/shipments/${originalShipmentId}/costs`,
                        accessToken,
                        integrationAccountId
                      )
                      if (response.ok) {
                        const costsData = await response.json()
                        costsResults.original_costs = costsData
                        console.log(`💰 Custos do envio original encontrados: ${originalShipmentId}`)
                      }
                    } catch (e) {
                      console.warn(`⚠️ Erro ao buscar custos do envio original:`, e)
                    }
                  }
                  
                  // Buscar custos do shipment de devolução
                  try {
                    const returnsResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                      accessToken,
                      integrationAccountId
                    )
                    if (returnsResponse.ok) {
                      const returnsData = await returnsResponse.json()
                      const shipmentId = returnsData?.results?.[0]?.shipments?.[0]?.id || 
                                        returnsData?.results?.[0]?.shipments?.[0]?.shipment_id
                      if (shipmentId) {
                        console.log(`💰 Buscando custos do return shipment ${shipmentId}...`)
                        const costsResponse = await fetchMLWithRetry(
                          `https://api.mercadolibre.com/shipments/${shipmentId}/costs`,
                          accessToken,
                          integrationAccountId
                        )
                        if (costsResponse.ok) {
                          const returnCosts = await costsResponse.json()
                          costsResults.return_costs = returnCosts
                          console.log(`💰 Custos de devolução encontrados`)
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar custos de devolução:`, e)
                  }
                  
                  return (costsResults.original_costs || costsResults.return_costs) ? costsResults : null
                })()
              )

              // 🆕 10. BUSCAR TRACKING NUMBER DO SHIPMENT (NOVO)
              claimPromises.push(
                (async () => {
                  const trackingResults = {
                    original_tracking: null,
                    return_tracking: null
                  }
                  
                  // Buscar tracking do envio original
                  const originalShipmentId = orderDetail?.shipping?.id
                  if (originalShipmentId) {
                    try {
                      const response = await fetchMLWithRetry(
                        `https://api.mercadolibre.com/shipments/${originalShipmentId}`,
                        accessToken,
                        integrationAccountId,
                        { 'x-format-new': 'true' }  // ✅ Header customizado
                      )
                      if (response.ok) {
                          const shipmentData = await response.json()
                        trackingResults.original_tracking = {
                          tracking_number: shipmentData.tracking_number,
                          tracking_method: shipmentData.tracking_method,
                          status: shipmentData.status,
                          substatus: shipmentData.substatus || null // ✅ FASE 9: Capturar substatus
                        }
                        console.log(`📦 Tracking do envio original: ${shipmentData.tracking_number || 'N/A'} (substatus: ${shipmentData.substatus || 'N/A'})`)
                      }
                    } catch (e) {
                      console.warn(`⚠️ Erro ao buscar tracking do envio original:`, e)
                    }
                  }
                  
                  // Buscar tracking do shipment de devolução
                  try {
                    const returnsResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                      accessToken,
                      integrationAccountId
                    )
                    if (returnsResponse.ok) {
                      const returnsData = await returnsResponse.json()
                      const shipmentId = returnsData?.results?.[0]?.shipments?.[0]?.id || 
                                        returnsData?.results?.[0]?.shipments?.[0]?.shipment_id
                      if (shipmentId) {
                        console.log(`📦 Buscando tracking do return shipment ${shipmentId}...`)
                        const trackingResponse = await fetchMLWithRetry(
                          `https://api.mercadolibre.com/shipments/${shipmentId}`,
                          accessToken,
                          integrationAccountId,
                          { 'x-format-new': 'true' }  // ✅ Header customizado
                        )
                        if (trackingResponse.ok) {
                          const returnShipment = await trackingResponse.json()
                          trackingResults.return_tracking = {
                            tracking_number: returnShipment.tracking_number,
                            tracking_method: returnShipment.tracking_method,
                            status: returnShipment.status,
                            substatus: returnShipment.substatus || null // ✅ FASE 9: Capturar substatus
                          }
                          console.log(`📦 Tracking de devolução: ${returnShipment.tracking_number || 'N/A'} (substatus: ${returnShipment.substatus || 'N/A'})`)
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar tracking de devolução:`, e)
                  }
                  
                  return (trackingResults.original_tracking || trackingResults.return_tracking) ? trackingResults : null
                })()
              )
              
              // 🆕 11. BUSCAR LEAD TIME E CLAIM PARA DEADLINES (FASE 8)
              claimPromises.push(
                (async () => {
                  let leadTime = null
                  let claimData = null
                  
                  // Buscar lead_time do shipment de devolução
                  try {
                    const returnsResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                      accessToken,
                      integrationAccountId
                    )
                    if (returnsResponse.ok) {
                      const returnsData = await returnsResponse.json()
                      const shipmentId = returnsData?.results?.[0]?.shipments?.[0]?.id || 
                                        returnsData?.results?.[0]?.shipments?.[0]?.shipment_id
                      if (shipmentId) {
                        console.log(`⏰ Buscando lead_time do shipment ${shipmentId}...`)
                        const leadTimeResponse = await fetchMLWithRetry(
                          `https://api.mercadolibre.com/shipments/${shipmentId}/lead_time`,
                          accessToken,
                          integrationAccountId,
                          { 'x-format-new': 'true' }
                        )
                        if (leadTimeResponse.ok) {
                          leadTime = await leadTimeResponse.json()
                          console.log(`⏰ Lead time encontrado`)
                        } else if (leadTimeResponse.status === 404) {
                          console.log(`ℹ️  Lead time não disponível (404)`)
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar lead_time:`, e)
                  }
                  
                  // Buscar claim completo para pegar available_actions e deadlines
                  try {
                    const claimResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`,
                      accessToken,
                      integrationAccountId
                    )
                    if (claimResponse.ok) {
                      claimData = await claimResponse.json()
                      console.log(`⏰ Claim completo encontrado para deadlines`)
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar claim para deadlines:`, e)
                  }
                  
                  return { leadTime, claimData }
                })()
              )
              
              const [claimDetails, claimMessagesDirect, claimMessagesPack, mediationDetails, returnsV2, returnsV1, shipmentHistory, changeDetails, shipmentCosts, shipmentTracking, deadlineData] = await Promise.all(claimPromises)
                
                // Consolidar mensagens de ambas as fontes
                const allMessages = [
                  ...(claimMessagesDirect?.messages || []),
                  ...(claimMessagesPack?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                
                // Remover duplicatas por ID
                const uniqueMessages = allMessages.filter((msg, index, self) => 
                  index === self.findIndex((m) => m.id === msg.id)
                )
                
                const consolidatedMessages = {
                  messages: uniqueMessages,
                  unread_messages: (claimMessagesDirect?.unread_messages || 0) + (claimMessagesPack?.unread_messages || 0)
                }
                
                // ✅ CORREÇÃO: Extrair anexos das mensagens usando sender_role (documentação ML)
                const extractedAttachments = []
                consolidatedMessages.messages.forEach(msg => {
                  if (msg.attachments && Array.isArray(msg.attachments)) {
                    // sender_role pode ser: 'complainant' (comprador), 'respondent' (vendedor), 'mediator' (ML)
                    const senderRole = msg.sender_role || msg.from?.role || 'unknown'
                    
                    extractedAttachments.push(...msg.attachments.map(att => ({
                      ...att,
                      sender_role: senderRole, // ✅ Usar sender_role conforme documentação
                      source: senderRole === 'complainant' ? 'buyer' : 
                              senderRole === 'respondent' ? 'seller' : 
                              senderRole === 'mediator' ? 'meli' : 'unknown',
                      message_id: msg.id,
                      date_created: msg.date_created
                    })))
                  }
                })
                
                console.log(`📋 Dados obtidos para mediação ${mediationId}:`, {
                  claimDetails: !!claimDetails,
                  messagesCount: consolidatedMessages.messages.length,
                  attachmentsCount: extractedAttachments.length,
                  mediationDetails: !!mediationDetails,
                  returnsV2: !!returnsV2,
                  returnsV1: !!returnsV1,
                  shipmentHistory: !!shipmentHistory,
                  changeDetails: !!changeDetails,
                  shipmentCosts: !!shipmentCosts // 🆕 FASE 1
                })
                
                // 🆕 FASE 1: MAPEAR COSTS usando mapper correto
                const mappedCosts = shipmentCosts ? {
                  original: shipmentCosts.original_costs ? mapShipmentCostsData(shipmentCosts.original_costs) : null,
                  return: shipmentCosts.return_costs ? mapShipmentCostsData(shipmentCosts.return_costs) : null
                } : null
                
                // 🆕 FASE 1: MAPEAR REVIEWS usando mapper CORRETO
                let mappedReviews = null;
                let extractedReviewsFields = {};
                
                // ✅ FASE 10: Buscar reviews detalhados dos returns se existirem
                let returnReviews = []
                let reviewReasons = [] // Razões de falha disponíveis
                
                if (returnsV2?.results?.length > 0) {
                  const reviewPromises = returnsV2.results.map(async (returnItem: any) => {
                    try {
                      // Buscar review do return
                      const response = await fetch(`https://api.mercadolibre.com/post-purchase/v1/returns/${returnItem.id}/reviews`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      })
                      
                      if (!response.ok) {
                        if (response.status === 400) {
                          console.log(`ℹ️ Review não encontrada (400) para return ${returnItem.id}`)
                        }
                        return null
                      }
                      
                      const reviewData = await response.json()
                      
                      // ✅ FASE 10: Se houver intermediate_check, buscar razões de falha disponíveis
                      if (returnItem.intermediate_check) {
                        try {
                          const reasonsUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/reasons?flow=seller_return_failed&claim_id=${mediationId}`
                          const reasonsResponse = await fetch(reasonsUrl, {
                            headers: { 'Authorization': `Bearer ${accessToken}` }
                          })
                          
                          if (reasonsResponse.ok) {
                            const reasonsData = await reasonsResponse.json()
                            if (reasonsData?.reasons && Array.isArray(reasonsData.reasons)) {
                              reviewReasons = reasonsData.reasons
                              console.log(`✅ ${reviewReasons.length} razões de falha encontradas para claim ${mediationId}`)
                            }
                          }
                        } catch (e) {
                          console.warn(`⚠️ Erro ao buscar razões de falha:`, e)
                        }
                      }
                      
                      return reviewData
                    } catch (error) {
                      console.warn(`⚠️ Erro ao buscar review do return ${returnItem.id}:`, error)
                      return null
                    }
                  })
                  
                  try {
                    returnReviews = (await Promise.all(reviewPromises)).filter(review => review !== null)
                    
                    console.log(`🔍 [DEBUG REVIEWS] Total reviews recebidos: ${returnReviews.length}`);
                    
                    // 🆕 APLICAR MAPPER CORRETO aos reviews
                    if (returnReviews.length > 0) {
                      const reviewData = returnReviews[0];
                      
                      // ✅ DEBUG: Mostrar estrutura REAL recebida da API
                      console.log(`🔍 [DEBUG REVIEWS] Estrutura recebida:`, {
                        hasReviews: !!reviewData?.reviews,
                        reviewsLength: reviewData?.reviews?.length || 0,
                        firstReview: reviewData?.reviews?.[0] ? {
                          resource: reviewData.reviews[0].resource,
                          method: reviewData.reviews[0].method,
                          hasResourceReviews: !!reviewData.reviews[0].resource_reviews
                        } : 'sem reviews'
                      });
                      
                      // Aplicar mappers com razões de falha
                      mappedReviews = mapReviewsData(reviewData, reviewReasons);
                      extractedReviewsFields = extractReviewsFields(reviewData);
                      
                      console.log(`✅ Reviews mapeados com sucesso:`, {
                        hasReviews: !!mappedReviews,
                        reviewStatus: mappedReviews?.stage,
                        scoreQualidade: extractedReviewsFields.score_qualidade
                      });
                    } else {
                      console.log(`ℹ️ [DEBUG REVIEWS] Nenhum review disponível para este return`);
                    }
                  } catch (error) {
                    console.error(`❌ [ERRO REVIEWS] Erro ao mapear reviews:`, error)
                  }
                }
                
                // ============================================
                // 📋 FASE 2: ENRIQUECIMENTO DE REVIEW DATA
                // ============================================
                const enrichedReviewData = (() => {
                  if (!returnReviews || returnReviews.length === 0) {
                    return {
                      warehouseReviewStatus: null,
                      sellerReviewStatus: null,
                      reviewResult: null,
                      reviewProblems: [],
                      reviewRequiredActions: [],
                      reviewStartDate: null,
                      reviewQualityScore: null,
                      reviewNeedsManualAction: false
                    }
                  }
                  
                  const firstReview = returnReviews[0]
                  const warehouseReview = firstReview?.warehouse_review
                  const sellerReview = firstReview?.seller_review
                  
                  // Calcular problemas encontrados
                  const problems = []
                  if (warehouseReview?.issues) {
                    problems.push(...warehouseReview.issues.map((i: any) => i.type || i.description))
                  }
                  if (sellerReview?.issues) {
                    problems.push(...sellerReview.issues.map((i: any) => i.type || i.description))
                  }
                  
                  // Calcular ações necessárias
                  const actions = []
                  if (warehouseReview?.required_actions) {
                    actions.push(...warehouseReview.required_actions)
                  }
                  if (sellerReview?.required_actions) {
                    actions.push(...sellerReview.required_actions)
                  }
                  
                  // Calcular score de qualidade (0-100)
                  let qualityScore = 70 // Score padrão
                  if (warehouseReview?.result === 'approved' || sellerReview?.result === 'approved') {
                    qualityScore = 90
                  } else if (problems.length > 0) {
                    qualityScore = Math.max(30, 70 - (problems.length * 10))
                  }
                  
                  const needsManualAction = 
                    warehouseReview?.status === 'pending_review' || 
                    sellerReview?.status === 'pending_review' ||
                    actions.length > 0 ||
                    problems.length > 3
                  
                  return {
                    warehouseReviewStatus: warehouseReview?.status,
                    sellerReviewStatus: sellerReview?.status,
                    reviewResult: warehouseReview?.result || sellerReview?.result,
                    reviewProblems: problems,
                    reviewRequiredActions: actions,
                    reviewStartDate: firstReview?.date_created,
                    reviewQualityScore: qualityScore,
                    reviewNeedsManualAction: needsManualAction
                  }
                })()
                
                claimData = {
                  claim_details: claimDetails,
                  claim_messages: consolidatedMessages,
                  mediation_details: mediationDetails,
                  claim_attachments: extractedAttachments,
                  return_details_v2: returnsV2,
                  return_details_v1: returnsV1,
                  return_reviews: returnReviews,
                  shipment_history: shipmentHistory,
                  change_details: changeDetails,
                  shipment_costs: mappedCosts, // 🆕 FASE 1: Custos de envio mapeados
                  shipment_tracking: shipmentTracking, // 🆕 NOVO: Tracking numbers
                  
                  // ✅ FASE 1: Related Entities (para detectar returns associados)
                  related_entities: claimDetails?.related_entities || [],
                  has_related_return: (claimDetails?.related_entities || []).includes('return'),
                  
                  // 📋 LOG DE AUDITORIA: Devoluções encontradas
                  ...((() => {
                    const hasReturn = (claimDetails?.related_entities || []).includes('return');
                    if (hasReturn) {
                      const returnStatus = returnsV2?.results?.[0]?.status || returnsV1?.results?.[0]?.status;
                      const moneyStatus = returnsV2?.results?.[0]?.status_money || returnsV1?.results?.[0]?.status_money;
                      const returnSubtype = returnsV2?.results?.[0]?.subtype || returnsV1?.results?.[0]?.subtype;
                      const refundAt = returnsV2?.results?.[0]?.refund_at || returnsV1?.results?.[0]?.refund_at;
                      
                      logger.info(`📦 DEVOLUÇÃO ENCONTRADA - Claim ${mediationId}:`, {
                        return_status: returnStatus,
                        money_status: moneyStatus,
                        subtype: returnSubtype,
                        refund_at: refundAt,
                        has_v2: !!returnsV2?.results?.length,
                        has_v1: !!returnsV1?.results?.length
                      });
                    }
                    return {};
                  })()),
                  
                  // ============================================
                  // 📋 FASE 1: DADOS DE REVIEW CORRIGIDOS (USAR MAPPER)
                  // ============================================
                  // ✅ CORRIGIDO: Usar extractedReviewsFields extraído do mapper
                  review_id: extractedReviewsFields.review_id || null,
                  review_status: extractedReviewsFields.review_status || null,
                  review_result: extractedReviewsFields.review_result || null,
                  score_qualidade: extractedReviewsFields.score_qualidade || null,
                  necessita_acao_manual: extractedReviewsFields.necessita_acao_manual || false,
                  revisor_responsavel: extractedReviewsFields.revisor_responsavel || null,
                  observacoes_review: extractedReviewsFields.observacoes_review || null,
                  categoria_problema: extractedReviewsFields.categoria_problema || null,
                  
                  // 🆕 JSONB COMPLETO (dados mapeados)
                  dados_reviews: mappedReviews,
                  
                // ============================================
                // ⏱️ FASE 3: DADOS BRUTOS DA API (SEM CÁLCULOS)
                // ============================================
                // Dados de SLA virão diretamente da API sem processamento
                sla_data_raw: {
                  date_created: orderDetail?.date_created || null,
                  date_closed: claimDetails?.date_closed || null,
                  messages: consolidatedMessages?.messages || [],
                  mediation_date: mediationDetails?.date_created || null
                },
                  
                  // ============================================
                  // 💰 FASE 4: DADOS FINANCEIROS BRUTOS DA API
                  // ============================================
                  // Dados financeiros sem cálculos - direto da API
                  financial_data_raw: {
                    total_amount: orderDetail?.total_amount || null,
                    transaction_amount_refunded: orderDetail?.payments?.[0]?.transaction_amount_refunded || null,
                    shipping_cost: orderDetail?.payments?.[0]?.shipping_cost || null,
                    marketplace_fee: orderDetail?.payments?.[0]?.marketplace_fee || null,
                    currency_id: orderDetail?.payments?.[0]?.currency_id || null,
                    payment_method: orderDetail?.payments?.[0]?.payment_method_id || null,
                    installments: orderDetail?.payments?.[0]?.installments || null
                  },
                  
                  // Campos enriquecidos conforme estratégia do PDF
                  claim_status: claimDetails?.status || null,
                  return_status: returnsV2?.results?.[0]?.status || null,
                  return_tracking: returnsV2?.results?.[0]?.tracking_number || null,
                  resolution_date: claimDetails?.date_closed || claimDetails?.resolution?.date || null,
                  resolution_reason: claimDetails?.resolution?.reason || null,
                  messages_count: consolidatedMessages.messages.length,
                  review_score: returnReviews?.[0]?.score || enrichedReviewData.reviewQualityScore,
                  // Dados de shipment history
                  tracking_events: shipmentHistory?.history || [],
                  last_tracking_update: shipmentHistory?.history?.[0]?.date || null,
                  tracking_status_detail: shipmentHistory?.history?.[0]?.status || null,
                  // Dados de troca
                  is_exchange: changeDetails !== null,
                  exchange_product_id: changeDetails?.substitute_product?.id || null,
                  exchange_product_title: changeDetails?.substitute_product?.title || null,
                  exchange_status: changeDetails?.status || null,
                  exchange_expected_date: changeDetails?.estimated_delivery_date || null,
                  dados_completos: true
                }
                
              // ✅ SLA agora vem como dados brutos da API (sem cálculos)
            } catch (claimError) {
              console.error(`❌ Erro crítico ao buscar dados do claim ${mediationId}:`, claimError)
              // Definir claimData como null em caso de erro crítico
              claimData = null
            }
            
            // Processar como devolução/cancelamento com DADOS ENRIQUECIDOS COMPLETOS
            // Proteção contra dados nulos
            const safeClaimData = claimData || {}
            const safeOrderDetail = orderDetail || {}
            const safeShipmentData = claimData?.shipment_history || null
            
            // 📋 LOG DE DEBUG: Verificar dados_reasons antes do mapeamento
            console.log(`📋 Mapeando claim ${claim.id}:`, {
              temDadosReasons: !!claim?.dados_reasons,
              dadosReasonsKeys: claim?.dados_reasons ? Object.keys(claim.dados_reasons) : [],
              reasonId: claim?.reason_id
            });
            
            const devolucao = {
              type: 'cancellation',
              order_id: safeOrderDetail.id || 'N/A',
              date_created: safeOrderDetail.date_created || new Date().toISOString(),
              status: safeOrderDetail.status || 'unknown',
              reason: safeOrderDetail.cancel_detail?.description || 'Pedido cancelado',
              amount: safeOrderDetail.total_amount || 0,
              resource_data: {
                title: safeOrderDetail.order_items?.[0]?.item?.title || 'Produto não identificado',
                sku: safeOrderDetail.order_items?.[0]?.item?.seller_sku || '',
                quantity: safeOrderDetail.order_items?.[0]?.quantity || 1
              },
              order_data: safeOrderDetail,
              buyer: safeOrderDetail.buyer || {},
              cancel_detail: safeOrderDetail.cancel_detail || {},
              
              // DADOS DE CLAIM ESTRUTURADOS
              claim_details: safeClaimData?.claim_details || null,
              claim_messages: safeClaimData?.claim_messages || null,
              mediation_details: safeClaimData?.mediation_details || null,
              claim_attachments: safeClaimData?.claim_attachments || null,
              return_details_v2: safeClaimData?.return_details_v2 || null,
              return_details_v1: safeClaimData?.return_details_v1 || null,
              return_reviews: safeClaimData?.return_reviews || null,
              shipment_history: safeClaimData?.shipment_history || null,
              change_details: safeClaimData?.change_details || null,
              
              // ✅ MÉTRICAS DE SLA CALCULADAS
              sla_metrics: safeClaimData?.sla_metrics || null,
              
              // CAMPOS ENRIQUECIDOS EXTRAÍDOS
              claim_status: safeClaimData?.claim_status || null,
              return_status: safeClaimData?.return_status || null,
              return_tracking: safeClaimData?.return_tracking || null,
              resolution_date: safeClaimData?.resolution_date || null,
              resolution_reason: safeClaimData?.resolution_reason || null,
              messages_count: safeClaimData?.messages_count || 0,
              review_score: safeClaimData?.review_score || null,
              
              // DADOS DE COMUNICAÇÃO - MÚLTIPLAS FONTES DE MENSAGENS
              timeline_mensagens: safeClaimData?.claim_messages?.messages || 
                                  safeClaimData?.mediation_details?.messages || [],
              numero_interacoes: (safeClaimData?.claim_messages?.messages?.length || 0) + 
                                (safeClaimData?.mediation_details?.messages?.length || 0),
              
              // ÚLTIMA MENSAGEM - EXTRAIR DE TODAS AS FONTES
              ultima_mensagem_data: (() => {
                const allMessages = [
                  ...(safeClaimData?.claim_messages?.messages || []),
                  ...(safeClaimData?.mediation_details?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                return allMessages.length > 0 ? allMessages[0].date_created : null
              })(),
              
              ultima_mensagem_remetente: (() => {
                const allMessages = [
                  ...(safeClaimData?.claim_messages?.messages || []),
                  ...(safeClaimData?.mediation_details?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                return allMessages.length > 0 ? allMessages[0]?.from?.role : null
              })(),
              
              // ============================================
              // 📋 17 NOVAS COLUNAS DE STATUS DE DEVOLUÇÃO
              // ============================================
              
              // 🔄 STATUS DA DEVOLUÇÃO
              status_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.status || 
                               safeClaimData?.return_details_v1?.results?.[0]?.status || null,
              
              // 💰 STATUS DO DINHEIRO (✅ CORRIGIDO - campo 1 da auditoria)
              status_dinheiro: safeClaimData?.return_details_v2?.results?.[0]?.status_money || 
                              safeClaimData?.return_details_v1?.results?.[0]?.status_money || null,
              
              // 📑 SUBTIPO DA DEVOLUÇÃO
              subtipo_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.subtype || 
                                safeClaimData?.return_details_v1?.results?.[0]?.subtype || null,
              
              // 📅 DATA CRIAÇÃO DA DEVOLUÇÃO
              data_criacao_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.date_created || 
                                     safeClaimData?.return_details_v1?.results?.[0]?.date_created || null,
              
              // 📅 DATA ATUALIZAÇÃO DA DEVOLUÇÃO  
              data_atualizacao_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.last_updated || 
                                         safeClaimData?.return_details_v1?.results?.[0]?.last_updated || null,
              
              // 📅 DATA FECHAMENTO DA DEVOLUÇÃO
              data_fechamento_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.date_closed || 
                                        safeClaimData?.return_details_v1?.results?.[0]?.date_closed || null,
              
              // 💵 QUANDO SERÁ REEMBOLSADO (✅ CORRIGIDO - campo 7 da auditoria: refund_at)
              reembolso_quando: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.refund_at || 
                               safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.refund_at ||
                               safeClaimData?.return_details_v2?.results?.[0]?.refund_at || 
                               safeClaimData?.return_details_v1?.results?.[0]?.refund_at || null,

              // 📦 ID DO SHIPMENT DE DEVOLUÇÃO
              shipment_id_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                    safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                    safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                    safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id || null,
              
              // 📊 STATUS DO ENVIO DA DEVOLUÇÃO
              status_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.status || 
                                     safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.status || null,
              
              // 📦 CÓDIGO DE RASTREAMENTO DA DEVOLUÇÃO
              codigo_rastreamento_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.tracking_number || 
                                            safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.tracking_number || null,
              
              // 🚚 TIPO DE ENVIO DA DEVOLUÇÃO (✅ CORRIGIDO - campo 4 da auditoria: shipment_type)
              tipo_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.type || 
                                   safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.type || null,
              
              // 📍 DESTINO DA DEVOLUÇÃO (✅ CORRIGIDO - campo 5 da auditoria: shipment_destination)
              destino_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.destination?.name || 
                                safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.destination?.name || null,
              
              // 🏠 ENDEREÇO COMPLETO DO DESTINO
              endereco_destino_devolucao: (() => {
                const shipment = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0] || 
                                safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]
                if (shipment?.destination?.shipping_address) {
                  return JSON.stringify(shipment.destination.shipping_address)
                }
                return null
              })(),

              // 📜 TIMELINE COMPLETO DE RASTREAMENTO (JSON)
              timeline_rastreamento: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                // Buscar no shipment_history os eventos deste shipment específico de devolução
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? JSON.stringify(returnEvents) : null
              })(),
              
              // 📊 STATUS DE RASTREAMENTO DA DEVOLUÇÃO
              status_rastreamento_devolucao: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? returnEvents[0]?.status : null
              })(),
              
              // 📅 DATA DO ÚLTIMO STATUS
              data_ultimo_status: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? returnEvents[0]?.date_created : null
              })(),
              
              // 📝 DESCRIÇÃO DO ÚLTIMO STATUS
              descricao_ultimo_status: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? (returnEvents[0]?.tracking?.description || returnEvents[0]?.tracking?.checkpoint) : null
              })(),
              
              // DADOS DE RETORNO/TROCA - ENRIQUECIDO COM CHANGE DETAILS
              eh_troca: safeClaimData?.is_exchange || 
                       (safeClaimData?.return_details_v2?.results?.[0]?.subtype || 
                        safeClaimData?.return_details_v1?.results?.[0]?.subtype || 
                        safeClaimData?.claim_details?.type || '').toLowerCase().includes('change'),
              
              produto_troca_id: safeClaimData?.exchange_product_id || null,
              produto_troca_titulo: safeClaimData?.exchange_product_title || null,
              
              // ✅ Dados de troca já incluídos acima (produto_troca_id, produto_troca_titulo)
              
              // ==================== RASTREAMENTO ENRIQUECIDO - FASE 1 ====================
              
              // 🚚 SHIPMENT ID - Extrair de múltiplas fontes
              shipment_id: safeOrderDetail?.shipping?.id || 
                          safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id ||
                          safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id || null,
              
              // 📦 CÓDIGO DE RASTREAMENTO
              // ✅ PRIORIZAR tracking_number buscado do endpoint /shipments/{id}
              codigo_rastreamento: safeClaimData?.shipment_tracking?.original_tracking?.tracking_number || 
                                  safeClaimData?.shipment_tracking?.return_tracking?.tracking_number ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.tracking_number ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.tracking_number || null,
              
              // ============================================
              // 🆕 5 NOVOS CAMPOS - DADOS PERDIDOS RECUPERADOS
              // ============================================
              
              // 🔄 Estágio do Claim (ex: claim_closing, claim_input, dispute)
              claim_stage: safeClaimData?.claim_details?.stage || 
                          safeClaimData?.mediation_details?.stage || null,
              
              // 📦 Tipo de quantidade do claim (ex: unit, pack)
              claim_quantity_type: safeClaimData?.claim_details?.quantity_type || 
                                  safeClaimData?.mediation_details?.quantity_type || null,
              
              // ✅ Se o claim foi cumprido/resolvido
              claim_fulfilled: safeClaimData?.claim_details?.fulfilled || 
                              safeClaimData?.mediation_details?.fulfilled || false,
              
              // 🔍 Verificação intermediária do return (dados completos em JSON)
              return_intermediate_check: safeClaimData?.return_details_v2?.results?.[0]?.intermediate_check || 
                                        safeClaimData?.return_details_v1?.results?.[0]?.intermediate_check || null,
              
              // 📋 Tipo de recurso do return (ex: return_to_seller, return_to_buyer)
              return_resource_type: safeClaimData?.return_details_v2?.results?.[0]?.resource_type || 
                                   safeClaimData?.return_details_v1?.results?.[0]?.resource_type || null,
              
              // 🚚 TRANSPORTADORA
              transportadora: safeClaimData?.return_details_v2?.results?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.carrier ||
                             safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.carrier || null,
              
              // 📊 STATUS DE RASTREAMENTO DO PEDIDO
              status_rastreamento_pedido: (() => {
                // Priorizar dados do shipment history
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  return safeClaimData.shipment_history.combined_events[0].status
                }
                // Fallback para outros campos
                return safeClaimData?.tracking_status_detail || 
                       safeClaimData?.return_details_v2?.results?.[0]?.status || 
                       safeClaimData?.return_details_v1?.results?.[0]?.status ||
                       safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.status || 
                       safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.status || null
              })(),
              
              // 📍 LOCALIZAÇÃO ATUAL
              localizacao_atual: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  const lastEvent = safeClaimData.shipment_history.combined_events[0]
                  return lastEvent.tracking?.checkpoint || lastEvent.tracking?.location || null
                }
                return null
              })(),
              
              // 🔄 SUBSTATUS DE TRANSPORTE
              status_transporte_atual: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  return safeClaimData.shipment_history.combined_events[0].substatus
                }
                return null
              })(),
              
              // 📋 HISTÓRICO COMPLETO DE TRACKING (FASE 1 - ENRIQUECIDO)
              tracking_history: safeClaimData?.shipment_history?.combined_events || [],
              
              // 📊 EVENTOS DE TRACKING PROCESSADOS
              tracking_events: (() => {
                if (!safeClaimData?.shipment_history?.combined_events?.length) return []
                
                return safeClaimData.shipment_history.combined_events.map((event: any) => ({
                  date: event.date_created,
                  status: event.status,
                  substatus: event.substatus,
                  checkpoint: event.tracking?.checkpoint || event.tracking?.description,
                  location: event.tracking?.location,
                  shipment_type: event.shipment_type, // 'original' ou 'return'
                  shipment_id: event.shipment_id
                }))
              })(),
              
              // 🕐 DATA DA ÚLTIMA MOVIMENTAÇÃO
              data_ultima_movimentacao: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  return safeClaimData.shipment_history.combined_events[0].date_created
                }
                return safeClaimData?.last_tracking_update || null
              })(),
              
              // 💰 CUSTOS DE SHIPMENT (🆕 FASE 1: Dados REAIS do endpoint /costs)
              // ✅ CORRIGIDO: Usar mappedCosts ao invés de dados incorretos do return_details
              ...(() => {
                if (!safeClaimData?.shipment_costs) {
                  return {
                    shipment_costs: null,
                    custo_envio_ida: null,
                    custo_envio_retorno: null,
                    custo_total_logistica: null,
                    moeda_custo: null,
                    dados_costs: null
                  };
                }
                
                // Usar custo de ida (original) ou de retorno conforme disponibilidade
                const costData = safeClaimData.shipment_costs.return || safeClaimData.shipment_costs.original;
                
                return {
                  // Objeto simplificado para compatibilidade
                  shipment_costs: {
                    shipping_cost: costData?.forward_shipping?.amount || null,
                    handling_cost: costData?.return_shipping?.amount || null,
                    total_cost: costData?.total_costs?.amount || null
                  },
                  
                  // 🆕 CAMPOS INDIVIDUAIS (extraídos do mapper)
                  custo_envio_ida: safeClaimData.shipment_costs.original?.forward_shipping?.amount || null,
                  custo_envio_retorno: safeClaimData.shipment_costs.return?.return_shipping?.amount || 
                                       safeClaimData.shipment_costs.original?.return_shipping?.amount || null,
                  custo_total_logistica: costData?.total_costs?.amount || null,
                  moeda_custo: costData?.total_costs?.currency || 'BRL',
                  
                  // 🆕 JSONB COMPLETO (dados mapeados)
                  dados_costs: safeClaimData.shipment_costs
                };
              })(),
              
              // ✅ Dados de anexos removidos - endpoint retorna 405
              // ✅ Dados financeiros brutos já incluídos nos campos de pagamento/reembolso
              
              // ✅ CORRIGIDO: benefited é STRING simples ('complainant' | 'respondent'), não array
              responsavel_custo: safeClaimData?.claim_details?.resolution?.benefited || 
                                safeClaimData?.mediation_details?.resolution?.benefited ||
                                safeClaimData?.claim_details?.resolution?.responsible || null,
              
              // ✅ FASE 1: Related Entities (salvar no banco)
              related_entities: safeClaimData?.related_entities || [],
              has_related_return: safeClaimData?.has_related_return || false,
              
              // CLASSIFICAÇÃO
              tipo_claim: safeClaimData?.claim_details?.type || safeOrderDetail.status,
              subtipo_claim: safeClaimData?.claim_details?.stage || safeClaimData?.claim_details?.subtype || null,
              
              // ========================================
              // 🔍 REASONS - Usar dados já enriquecidos (Fase 1+2)
              // ========================================
              reason_id: claim?.dados_reasons?.reason_id || safeClaimData?.claim_details?.reason_id || claim?.reason_id || null,
              reason_name: claim?.dados_reasons?.reason_name || null,
              reason_detail: claim?.dados_reasons?.reason_detail || null,
              reason_flow: claim?.dados_reasons?.reason_flow || null,
              reason_category: claim?.dados_reasons?.reason_category || null,
              reason_position: claim?.dados_reasons?.reason_position || null,
              reason_settings: claim?.dados_reasons?.reason_settings || null,
              dados_reasons: claim?.dados_reasons || null,
              motivo_categoria: safeClaimData?.claim_details?.reason_id || claim?.reason_id || null,
              
              em_mediacao: safeClaimData?.claim_details?.type === 'meditations' || safeClaimData?.mediation_details !== null, // ✅ CORRIGIDO: meditations (com T)
              nivel_prioridade: safeClaimData?.claim_details?.type === 'meditations' ? 'high' : 'medium', // ✅ CORRIGIDO: meditations (com T)
              
              // ✅ Dados de ação removidos - calculados anteriormente
              
              // ============================================
              // 🟡 FASE 2: CAMPOS ESSENCIAIS ADICIONAIS
              // ============================================
              
              // DADOS COMPLETOS DO COMPRADOR
              comprador_cpf_cnpj: safeOrderDetail?.buyer?.billing_info?.doc_number || null,
              comprador_nome_completo: `${safeOrderDetail?.buyer?.first_name || ''} ${safeOrderDetail?.buyer?.last_name || ''}`.trim() || null,
              
              // DADOS DE PAGAMENTO DETALHADOS
              metodo_pagamento: safeOrderDetail?.payments?.[0]?.payment_method_id || null,
              tipo_pagamento: safeOrderDetail?.payments?.[0]?.payment_type || null,
              numero_parcelas: safeOrderDetail?.payments?.[0]?.installments || null,
              valor_parcela: safeOrderDetail?.payments?.[0]?.installment_amount || null,
              transaction_id: safeOrderDetail?.payments?.[0]?.transaction_id || null,
              
              // ✅ Percentual reembolsado removido - era cálculo
              
              // TAGS DO PEDIDO - Para filtros avançados
              tags_pedido: safeOrderDetail?.tags || [],
              
              // ============================================
              // 🟢 FASE 3: CAMPOS AVANÇADOS
              // ============================================
              
              // ✅ Custos, tags e flags removidos - eram cálculos ou duplicados
              
              nota_fiscal_autorizada: (() => {
                return safeOrderDetail?.tags?.includes('authorized_invoice') || false
              })(),
              
              // 3. DADOS DE PRODUTO
              produto_warranty: (() => {
                const item = safeOrderDetail?.order_items?.[0]?.item
                return item?.warranty || null
              })(),
              
              produto_categoria: (() => {
                const item = safeOrderDetail?.order_items?.[0]?.item
                return item?.category_id || null
              })(),
              
              produto_thumbnail: (() => {
                const item = safeOrderDetail?.order_items?.[0]?.item
                return item?.thumbnail || item?.picture_url || null
              })(),
              
              // ============================================
              // ⏰ FASE 8: PRAZOS E DEADLINES
              // ============================================
              
              // 🆕 Calcular todos os deadlines usando dados de lead_time e claim
              ...((() => {
                // Pegar dados básicos do return
                const returnBasicData = {
                  id: returnsV2?.results?.[0]?.id || returnsV1?.results?.[0]?.id,
                  date_created: returnsV2?.results?.[0]?.date_created || returnsV1?.results?.[0]?.date_created,
                  intermediate_check: returnsV2?.results?.[0]?.intermediate_check || returnsV1?.results?.[0]?.intermediate_check,
                  expiration_date: returnsV2?.results?.[0]?.expiration_date || returnsV1?.results?.[0]?.expiration_date || null
                }
                
                // Calcular deadlines
                const deadlines = calculateDeadlines(
                  returnBasicData,
                  deadlineData?.leadTime || null,
                  deadlineData?.claimData || null
                )
                
                return {
                  // Deadlines
                  prazo_envio_comprador: deadlines.shipment_deadline,
                  prazo_recebimento_vendedor: deadlines.seller_receive_deadline,
                  prazo_avaliacao_vendedor: deadlines.seller_review_deadline,
                  prazo_decisao_meli: deadlines.meli_decision_deadline,
                  data_expiracao: deadlines.expiration_date,
                  
                  // Horas restantes
                  horas_restantes_envio: deadlines.shipment_deadline_hours_left,
                  horas_restantes_avaliacao: deadlines.seller_review_deadline_hours_left,
                  
                  // Flags de urgência
                  prazo_envio_critico: deadlines.is_shipment_deadline_critical,
                  prazo_avaliacao_critico: deadlines.is_review_deadline_critical,
                  
                  // Dados completos do lead_time (JSON)
                  dados_lead_time: deadlineData?.leadTime ? JSON.stringify(deadlineData.leadTime) : null,
                  
                  // Dados de deadlines (JSON para frontend)
                  dados_deadlines: JSON.stringify(deadlines)
                }
              })()),
              
              // 4. ANÁLISE E QUALIDADE - Agora via utilitário
              ...analyzeInternalTags(safeClaimData, safeOrderDetail, safeShipmentData),
              
              // ============================================
              // FIM FASE 3
              // ============================================
              
              // MARCADORES DE QUALIDADE
              dados_completos: safeClaimData?.dados_completos || false,
              marketplace_origem: 'ML_BRASIL'
            }
            
            ordersCancelados.push(devolucao)
            
          } catch (orderError) {
            const orderId = claim.resource_id || claim.order_id || 'unknown'
            console.error(`❌ Erro ao processar pedido ${orderId}:`, orderError)
          }
      }
    
    logger.success(`🎉 Total de claims processados: ${ordersCancelados.length}`)
    
    // 📅 DEBUG: Mostrar datas encontradas nos claims
    if (ordersCancelados.length > 0) {
      const datas = ordersCancelados
        .map(c => c.date_created)
        .filter(d => d)
        .sort()
      
      console.log(`\n📅 ========== ANÁLISE DE DATAS DOS CLAIMS ==========`)
      console.log(`📅 CLAIM MAIS ANTIGO: ${datas[0]}`)
      console.log(`📅 CLAIM MAIS RECENTE: ${datas[datas.length - 1]}`)
      console.log(`📅 TOTAL DE CLAIMS COM DATA: ${datas.length}`)
      console.log(`\n📅 PRIMEIROS 10 CLAIMS (por data de criação):`)
      ordersCancelados.slice(0, 10).forEach((c, i) => {
        console.log(`   ${i + 1}. Order ${c.order_id} - Data: ${c.date_created} - Claim: ${c.claim_details?.id || 'N/A'}`)
      })
      console.log(`📅 ================================================\n`)
    }
    
    // ✅ NÃO APLICAR PAGINAÇÃO AQUI - O FRONTEND FAZ ISSO
    // A edge function deve retornar TODOS os claims processados
    // O frontend faz múltiplas chamadas com offset/limit
    
    logger.success(`📊 RESULTADO FINAL: ${ordersCancelados.length} claims processados | Total disponível na API: ${totalAvailable}`);
    
    return {
      data: ordersCancelados, // ✅ RETORNAR TODOS OS PROCESSADOS
      total: totalAvailable, // ✅ TOTAL REAL DA API ML
      hasMore: totalAvailable > (requestOffset + ordersCancelados.length) // ✅ Há mais na API?
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar claims:', error)
    throw error
  }
}