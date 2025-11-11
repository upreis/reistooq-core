/**
 * 🔄 SYNC-DEVOLUCOES - FASE 3 COMPLETA
 * 
 * ✅ ARQUITETURA FINAL:
 * 1. Busca tokens DIRETO do banco (serviceClient)
 * 2. Descriptografia INLINE (sem get-ml-token)
 * 3. Chama API ML /post-purchase/v2/claims DIRETAMENTE
 * 4. Enriquece com /reviews INLINE (enriquecimento automático)
 * 5. Chama ml-api-direct VIA HTTP apenas para MAPEAMENTO
 * 6. Salva dados completos em devolucoes_avancadas (JSONB)
 * 7. Suporta sync_all: true para cron jobs (sincroniza todas as contas ativas)
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
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, batch_size = 100, sync_all = false } = await req.json();

    // ✅ Modo 1: Sincronizar conta específica
    if (integration_account_id) {
      const result = await syncAccount(integration_account_id, batch_size);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Modo 2: Sincronizar TODAS as contas ativas (cron job)
    if (sync_all) {
      const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // Buscar todas as contas ML ativas
      const { data: accounts, error: accountsError } = await serviceClient
        .from('integration_accounts')
        .select('id, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);

      if (accountsError) throw accountsError;
      
      if (!accounts || accounts.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Nenhuma conta ML ativa encontrada',
            synced: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      logger.info(`🔄 Sincronizando ${accounts.length} contas ML ativas...`);

      // Sincronizar cada conta
      const results = [];
      for (const account of accounts) {
        try {
          const result = await syncAccount(account.id, batch_size);
          results.push({ account_id: account.id, success: true, ...result });
          logger.success(`✅ Conta ${account.account_identifier} sincronizada`);
        } catch (error) {
          logger.error(`❌ Erro ao sincronizar ${account.account_identifier}:`, error);
          results.push({ 
            account_id: account.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          accounts: accounts.length,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ❌ Nenhum parâmetro fornecido
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Forneça integration_account_id OU sync_all: true' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.error('Erro fatal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 🔄 Sincronizar uma conta específica
async function syncAccount(integrationAccountId: string, batchSize: number) {
  logger.info(`🚀 Sincronizando conta: ${integrationAccountId}`);
  
  const startTime = Date.now();
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 1️⃣ Buscar dados da conta
  const { data: account, error: accountError } = await serviceClient
    .from('integration_accounts')
    .select('account_identifier, organization_id')
    .eq('id', integrationAccountId)
    .single();

  if (accountError || !account) {
    throw new Error('Conta de integração não encontrada');
  }

  // 2️⃣ Criar registro de sync
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
      onConflict: 'integration_account_id,sync_type'
    })
    .select()
    .single();

  if (syncInsertError || !syncRecord) {
    throw new Error(`Erro ao criar registro de sync: ${syncInsertError?.message}`);
  }

  const syncId = syncRecord.id;

  // 3️⃣ Buscar token
  const { data: secretRow, error: secretError } = await serviceClient
    .from('integration_secrets')
    .select('simple_tokens, use_simple, secret_enc')
    .eq('integration_account_id', integrationAccountId)
    .eq('provider', 'mercadolivre')
    .maybeSingle();

  if (!secretRow) {
    throw new Error('Token ML não encontrado');
  }

  let mlAccessToken = '';

  // 4️⃣ Descriptografar token
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
    throw new Error('Token ML não disponível');
  }

  // 5️⃣ Buscar claims da API ML
  logger.info(`📦 Buscando claims - Seller: ${account.account_identifier}`);
  
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  let offset = 0;
  let totalProcessed = 0;
  let totalCreated = 0;
  const MAX_CLAIMS = 300;
  const BATCH_SIZE = 50;
  let hasMore = true;

  while (hasMore && totalProcessed < MAX_CLAIMS) {
    // ✅ CORRIGIDO: A API ML exige pelo menos um filtro além de seller_id
    // Vamos buscar claims dos últimos 90 dias (máximo recomendado)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateFilter = ninetyDaysAgo.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const params = new URLSearchParams({
      seller_id: account.account_identifier,
      date_created: dateFilter, // ✅ Filtro obrigatório (data início)
      offset: offset.toString(),
      limit: BATCH_SIZE.toString(),
      sort: 'date_created',
      order: 'desc'
    });
    const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`;
    
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
    
    logger.info(`✅ ${claims.length} claims recebidos (total: ${total})`);
    
    // 6️⃣ Processar claims: Order + Reviews + Mapear
    const processedClaims = await Promise.all(
      claims.map(async (claim: any) => {
        try {
          const claimId = claim.id;
          const orderId = claim.resource_id;
          
          if (!claimId) return null;
          
          // Buscar order
          let orderData = null;
          if (orderId) {
            try {
              const orderResp = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${mlAccessToken}` }
              });
              if (orderResp.ok) orderData = await orderResp.json();
            } catch (err) {
              logger.warn(`⚠️ Erro ao buscar order ${orderId}`);
            }
          }
          
          // Buscar reviews (enriquecimento inline)
          let reviewsData = null;
          try {
            const reviewsResp = await fetch(
              `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/reviews`,
              { headers: { 'Authorization': `Bearer ${mlAccessToken}` } }
            );
            if (reviewsResp.ok) reviewsData = await reviewsResp.json();
          } catch (err) {
            // Reviews podem não existir, não é erro
          }
          
          // Mapear via ml-api-direct
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
            logger.warn(`⚠️ Erro ao mapear claim ${claimId}`);
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
    
    // 7️⃣ Salvar claims (filtrar campos válidos)
    if (validClaims.length > 0) {
      logger.info(`💾 Salvando ${validClaims.length} claims...`);
      
      // ✅ Campos válidos da tabela devolucoes_avancadas (ATUALIZADO PÓS-MIGRATION FASE 8)
      // ❌ REMOVIDOS: status_devolucao, subtipo_claim, tipo_claim (deletadas na migration)
      const validColumns = [
        'claim_id', 'order_id', 'return_id', 'integration_account_id',
        'data_criacao_claim', 'data_criacao_devolucao', 'data_atualizacao_devolucao',
        'claim_stage', 'motivo_categoria', 'reason_id', 'reason_name', 'reason_detail',
        'produto_titulo', 'sku', 'quantidade', 'valor_original_produto',
        'comprador_nickname', 'comprador_nome_completo', 'comprador_cpf',
        'dados_claim', 'dados_order', 'dados_return', 'dados_review',
        'dados_buyer_info', 'dados_product_info', 'dados_financial_info',
        'dados_tracking_info', 'dados_quantities', 'dados_available_actions',
        'created_at', 'updated_at'
      ];
      
      const claimsToSave = validClaims.map((claim: any) => {
        const filtered: any = {
          integration_account_id: integrationAccountId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Copiar apenas campos válidos
        validColumns.forEach(col => {
          if (claim[col] !== undefined) {
            filtered[col] = claim[col];
          }
        });
        
        return filtered;
      });
      
      const { error: upsertError } = await serviceClient
        .from('devolucoes_avancadas')
        .upsert(claimsToSave, {
          onConflict: 'claim_id',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        logger.error(`❌ Erro ao salvar: ${upsertError.message}`);
        throw upsertError;
      }
      
      totalCreated += validClaims.length;
      logger.success(`✅ ${validClaims.length} claims salvos`);
    }
    
    totalProcessed += claims.length;
    offset += BATCH_SIZE;
    hasMore = (offset < total) && (totalProcessed < MAX_CLAIMS);
    
    // Atualizar progresso
    await serviceClient
      .from('devolucoes_sync_status')
      .update({
        items_synced: totalProcessed,
        items_total: Math.min(total, MAX_CLAIMS)
      })
      .eq('id', syncId);
  }

  // 8️⃣ Finalizar sync
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

  logger.success(`🎉 Concluído: ${totalProcessed} claims em ${durationMs}ms`);

  return {
    success: true,
    totalProcessed,
    totalCreated,
    durationMs,
    syncId
  };
}
