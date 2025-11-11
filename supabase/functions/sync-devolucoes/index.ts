/**
 * 🔄 SYNC-DEVOLUCOES - FASE 1 REFATORAÇÃO COMPLETA
 * 
 * ✅ NOVA ARQUITETURA (Padrão unified-orders):
 * 1. Busca tokens DIRETO do banco (serviceClient)
 * 2. Descriptografia INLINE (sem get-ml-token)
 * 3. Chama API ML /post-purchase/v2/claims DIRETAMENTE
 * 4. Enriquece com /reviews INLINE (enriquecimento automático)
 * 5. Chama ml-api-direct VIA HTTP apenas para MAPEAMENTO
 * 6. Salva dados completos em devolucoes_avancadas (JSONB)
 * 7. Processa PRIMEIRO BATCH (300 claims) rapidamente
 * 
 * ❌ ELIMINADO: enrich-devolucoes (enriquecimento agora é inline)
 * ✅ MANTIDO: ml-api-direct como serviço de mapeamento (via HTTP)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY, SUPABASE_URL, SERVICE_KEY } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 📊 Logger
const logger = {
  info: (msg: string, data?: any) => console.log(`ℹ️  ${msg}`, data || ''),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string, data?: any) => console.warn(`⚠️  ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`❌ ${msg}`, error || ''),
  debug: (msg: string, data?: any) => console.log(`🔍 ${msg}`, data || ''),
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, batch_size = 100 } = await req.json();

    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'integration_account_id é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info(`🚀 Iniciando sincronização para conta: ${integration_account_id}`);
    
    const startTime = Date.now();
    const integrationAccountId = integration_account_id;
    const batchSize = Math.min(batch_size, 100);
    
    // ✅ 1. CRIAR SERVICE CLIENT (padrão unified-orders)
    const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // ✅ 2. BUSCAR ACCOUNT DATA
    const { data: account, error: accountError } = await serviceClient
      .from('integration_accounts')
      .select('account_identifier, organization_id')
      .eq('id', integrationAccountId)
      .single();

    if (accountError || !account) {
      throw new Error('Conta de integração não encontrada');
    }

    // ✅ 3. CRIAR REGISTRO DE SYNC EM devolucoes_sync_status
    const { data: syncRecord, error: syncInsertError } = await serviceClient
      .from('devolucoes_sync_status')
      .upsert({
        integration_account_id: integrationAccountId,
        sync_type: 'full',
        last_sync_status: 'in_progress',
        last_sync_at: new Date().toISOString(),
        items_synced: 0,
        items_total: 0,
        items_failed: 0
      }, {
        // ✅ SINTAXE CORRETA: Usar nomes de COLUNAS, não nome da constraint
        onConflict: 'integration_account_id,sync_type'
      })
      .select()
      .single();

    if (syncInsertError || !syncRecord) {
      throw new Error(`Erro ao criar registro de sync: ${syncInsertError?.message}`);
    }

    const syncId = syncRecord.id;
    logger.success(`Sync iniciado: ${syncId}`);

    // ✅ 4. BUSCAR TOKEN DIRETO DO BANCO (padrão unified-orders)
    const { data: secretRow, error: secretError } = await serviceClient
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at')
      .eq('integration_account_id', integrationAccountId)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (!secretRow) {
      throw new Error('Token ML não encontrado. Reconecte a integração.');
    }

    let mlAccessToken = '';

    // ✅ 5. DESCRIPTOGRAFAR TOKEN INLINE (padrão unified-orders)
    // Primeiro: tentar simple_tokens (nova estrutura)
    if (secretRow.use_simple && secretRow.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          mlAccessToken = tokensData.access_token || '';
          
          logger.success('Token obtido via simple_tokens');
        }
      } catch (err) {
        logger.error('Erro descriptografia simple_tokens:', err);
      }
    }

    // Fallback: tentar secret_enc (estrutura antiga)
    if (!mlAccessToken && secretRow.secret_enc) {
      try {
        const decrypted = await decryptAESGCM(secretRow.secret_enc as string);
        const tokensData = JSON.parse(decrypted);
        mlAccessToken = tokensData.access_token || '';
        
        logger.success('Token obtido via secret_enc');
      } catch (err) {
        logger.error('Erro descriptografia secret_enc:', err);
      }
    }

    if (!mlAccessToken) {
      throw new Error('Token ML não disponível. Reconecte a integração.');
    }

    // ✅ 6. CHAMAR API ML DIRETAMENTE (SEM ml-api-direct)
    logger.info(`🚀 Buscando claims DIRETAMENTE da API ML - Seller: ${account.account_identifier}`);
    
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    let offset = 0;
    let hasMore = true;
    let totalProcessed = 0;
    let totalCreated = 0;

    // ✅ 7. PROCESSAR APENAS PRIMEIRO BATCH (300 claims)
    const MAX_CLAIMS_PER_BATCH = 300;
    const BATCH_SIZE = 50; // Buscar 50 de cada vez
    
    while (hasMore && totalProcessed < MAX_CLAIMS_PER_BATCH) {
      logger.info(`📦 Buscando claims da API ML: offset=${offset}, limit=${BATCH_SIZE}`);

      // 🔥 CHAMADA DIRETA À API ML /post-purchase/v2/claims
      const claimsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims?seller_id=${account.account_identifier}&offset=${offset}&limit=${BATCH_SIZE}&sort=date_created&order=desc`;
      
      const claimsResponse = await fetch(claimsUrl, {
        headers: {
          'Authorization': `Bearer ${mlAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!claimsResponse.ok) {
        throw new Error(`API ML erro (${claimsResponse.status}): ${await claimsResponse.text()}`);
      }

      const claimsData = await claimsResponse.json();
      const claims = claimsData.data || [];
      const total = claimsData.paging?.total || 0;
      
      logger.info(`✅ Recebidos ${claims.length} claims da API ML (total disponível: ${total})`);
      
      // 🔥 PROCESSAR CADA CLAIM: Buscar Order + Reviews + Mapear
      const processedClaims = await Promise.all(
        claims.map(async (claim: any) => {
          try {
            const claimId = claim.id;
            const orderId = claim.resource_id;
            
            if (!claimId) {
              logger.warn(`⚠️ Claim sem ID, pulando...`);
              return null;
            }
            
            // 1️⃣ Buscar detalhes do pedido
            let orderData = null;
            if (orderId) {
              try {
                const orderResp = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
                  headers: { 'Authorization': `Bearer ${mlAccessToken}` }
                });
                if (orderResp.ok) {
                  orderData = await orderResp.json();
                }
              } catch (err) {
                logger.warn(`⚠️ Erro ao buscar order ${orderId}:`, err);
              }
            }
            
            // 2️⃣ Buscar reviews (ENRIQUECIMENTO INLINE)
            let reviewsData = null;
            try {
              const reviewsResp = await fetch(
                `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/reviews`,
                { headers: { 'Authorization': `Bearer ${mlAccessToken}` } }
              );
              if (reviewsResp.ok) {
                reviewsData = await reviewsResp.json();
              }
            } catch (err) {
              logger.warn(`⚠️ Erro ao buscar reviews do claim ${claimId}:`, err);
            }
            
            // 3️⃣ CHAMAR ml-api-direct VIA HTTP para mapeamento complexo
            const mapResponse = await fetch(`${SUPABASE_URL}/functions/v1/ml-api-direct`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
              },
              body: JSON.stringify({
                action: 'mapear_claim',
                claim_data: claim,
                order_data: orderData,
                reviews_data: reviewsData,
                integration_account_id: integrationAccountId
              }),
            });
            
            if (!mapResponse.ok) {
              logger.warn(`⚠️ Erro ao mapear claim ${claimId}: ${mapResponse.status}`);
              return null;
            }
            
            const mapResult = await mapResponse.json();
            return mapResult.data;
            
          } catch (err) {
            logger.warn(`⚠️ Erro ao processar claim:`, err);
            return null;
          }
        })
      );
      
      const validClaims = processedClaims.filter(Boolean);
      const hasMoreFromApi = offset + BATCH_SIZE < total;
      
      // 🔥 SALVAR CLAIMS MAPEADOS DIRETAMENTE (já vêm estruturados)
      if (validClaims && validClaims.length > 0) {
        logger.info(`💾 Salvando ${validClaims.length} claims mapeados em devolucoes_avancadas...`);
        
        // Adicionar organization_id em cada claim
        const claimsWithOrg = validClaims.map((claim: any) => ({
          ...claim,
          organization_id: account.organization_id,
          integration_account_id: integrationAccountId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        
        const { error: upsertError } = await serviceClient
          .from('devolucoes_avancadas')
          .upsert(claimsWithOrg, {
            onConflict: 'claim_id',
            ignoreDuplicates: false
          });
        
        if (upsertError) {
          logger.error(`❌ Erro ao salvar claims: ${upsertError.message}`, upsertError);
          throw upsertError;
        }
        
        totalCreated += validClaims.length;
        logger.success(`✅ ${validClaims.length} claims salvos com sucesso`);
      }
      
      totalProcessed += claims.length;
      offset += BATCH_SIZE;
      hasMore = hasMoreFromApi && totalProcessed < MAX_CLAIMS_PER_BATCH;
      
      // Atualizar progresso
      await serviceClient
        .from('devolucoes_sync_status')
        .update({
          items_synced: totalProcessed,
          items_total: Math.min(total, MAX_CLAIMS_PER_BATCH)
        })
        .eq('id', syncId);
      
      logger.info(`📊 Progresso: ${totalProcessed}/${Math.min(total, MAX_CLAIMS_PER_BATCH)}`);
    }


    // ✅ 8. MARCAR SYNC COMO CONCLUÍDO
    const durationMs = Date.now() - startTime;
    
    await serviceClient
      .from('devolucoes_sync_status')
      .update({
        last_sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        items_synced: totalProcessed,
        items_total: totalProcessed,
        items_failed: 0,
        duration_ms: durationMs
      })
      .eq('id', syncId);

    logger.success(`🎉 Sincronização concluída: ${totalProcessed} claims em ${durationMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed,
        totalCreated,
        durationMs,
        syncId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Erro fatal na sincronização:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido na sincronização'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
