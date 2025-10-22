/**
 * 🔄 PROCESS CLAIMS QUEUE
 * Processa fila de claims do Mercado Livre em lotes
 * Copia lógica completa de processamento do ml-api-direct
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

// Função auxiliar de retry (copiada do ml-api-direct)
async function fetchMLWithRetry(url: string, accessToken: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok || response.status === 404) {
        return response;
      }
      
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⚠️ Retry ${attempt}/${maxRetries} - aguardando ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Falhou após ${maxRetries} tentativas`);
}

// Função para obter token ML
async function getMLToken(integrationAccountId: string, supabase: any): Promise<string> {
  const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const secretResponse = await fetch(`${SUPABASE_URL}/functions/v1/integrations-get-secret`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-internal-call': 'true',
      'x-internal-token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      integration_account_id: integrationAccountId,
      provider: 'mercadolivre'
    })
  });
  
  if (!secretResponse.ok) {
    throw new Error('Token ML não disponível');
  }
  
  const tokenData = await secretResponse.json();
  if (!tokenData?.found || !tokenData?.secret?.access_token) {
    throw new Error('Token ML não encontrado');
  }
  
  return tokenData.secret.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = makeServiceClient();
    const BATCH_SIZE = 10; // Processar 10 claims por execução
    
    console.log(`🔄 Iniciando processamento da fila de claims...`);
    
    // Buscar claims pendentes
    const { data: pendingClaims, error: fetchError } = await supabase
      .from('fila_processamento_claims')
      .select('*')
      .eq('status', 'pending')
      .lt('tentativas', 3)
      .order('criado_em', { ascending: true })
      .limit(BATCH_SIZE);
    
    if (fetchError) throw fetchError;
    
    if (!pendingClaims || pendingClaims.length === 0) {
      console.log('✅ Nenhum claim pendente na fila');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum claim pendente', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📦 Processando ${pendingClaims.length} claims da fila...`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const queueItem of pendingClaims) {
      try {
        // Marcar como processando
        await supabase
          .from('fila_processamento_claims')
          .update({ status: 'processing', tentativas: queueItem.tentativas + 1 })
          .eq('id', queueItem.id);
        
        console.log(`📦 Processando claim ${queueItem.claim_id}...`);
        
        // Obter token ML
        const accessToken = await getMLToken(queueItem.integration_account_id, supabase);
        
        // Processar claim (versão simplificada - apenas dados essenciais)
        const orderId = queueItem.order_id;
        const claimId = queueItem.claim_id;
        
        // Buscar order details
        const orderResponse = await fetchMLWithRetry(
          `https://api.mercadolibre.com/orders/${orderId}`,
          accessToken
        );
        
        if (!orderResponse.ok) {
          if (orderResponse.status === 404) {
            // Salvar claim como order_not_found
            await supabase.from('mercadolivre_orders_cancelled').upsert({
              claim_id: claimId,
              order_id: orderId,
              integration_account_id: queueItem.integration_account_id,
              status_devolucao: 'order_not_found',
              order_not_found: true,
              marketplace_origem: 'mercadolivre',
              date_created: new Date().toISOString()
            }, { onConflict: 'claim_id,integration_account_id' });
            
            // Marcar como completado
            await supabase
              .from('fila_processamento_claims')
              .update({ status: 'completed', processado_em: new Date().toISOString() })
              .eq('id', queueItem.id);
            
            successCount++;
            continue;
          }
          throw new Error(`HTTP ${orderResponse.status} ao buscar order`);
        }
        
        const orderDetail = await orderResponse.json();
        
        // Buscar claim details
        const [claimDetails, returnsV2] = await Promise.all([
          fetchMLWithRetry(
            `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}`,
            accessToken
          ).then(r => r.ok ? r.json() : null).catch(() => null),
          
          fetchMLWithRetry(
            `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`,
            accessToken
          ).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);
        
        // Criar registro simplificado
        const claimRecord = {
          claim_id: claimId,
          order_id: orderId,
          integration_account_id: queueItem.integration_account_id,
          status: claimDetails?.status || 'pending',
          date_created: claimDetails?.date_created || orderDetail?.date_created,
          date_closed: claimDetails?.date_closed,
          total_amount: orderDetail?.total_amount,
          item_id: orderDetail?.order_items?.[0]?.item?.id,
          item_title: orderDetail?.order_items?.[0]?.item?.title,
          quantity: orderDetail?.order_items?.[0]?.quantity,
          buyer_id: orderDetail?.buyer?.id,
          buyer_nickname: orderDetail?.buyer?.nickname,
          status_devolucao: claimDetails?.status,
          marketplace_origem: 'mercadolivre',
          reason_id: claimDetails?.reason_id,
          processed_in_background: true,
          // Dados brutos para processamento futuro se necessário
          raw: {
            order_data: orderDetail,
            claim_details: claimDetails,
            return_details_v2: returnsV2
          }
        };
        
        // Salvar no banco
        const { error: saveError } = await supabase
          .from('mercadolivre_orders_cancelled')
          .upsert(claimRecord, { 
            onConflict: 'claim_id,integration_account_id',
            ignoreDuplicates: false 
          });
        
        if (saveError) {
          console.error(`❌ Erro ao salvar claim ${claimId}:`, {
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint,
            code: saveError.code
          });
          throw saveError;
        }
        
        // Marcar como completado
        await supabase
          .from('fila_processamento_claims')
          .update({ status: 'completed', processado_em: new Date().toISOString() })
          .eq('id', queueItem.id);
        
        successCount++;
        console.log(`✅ Claim ${claimId} processado com sucesso`);
        
      } catch (error) {
        failedCount++;
        console.error(`❌ Erro ao processar claim ${queueItem.claim_id}:`, {
          message: error?.message || 'Erro desconhecido',
          name: error?.name,
          stack: error?.stack?.substring(0, 200)
        });
        
        // Marcar como falha ou voltar para pending
        if (queueItem.tentativas + 1 >= 3) {
          await supabase
            .from('fila_processamento_claims')
            .update({ status: 'failed', erro_mensagem: error?.message || 'Erro desconhecido' })
            .eq('id', queueItem.id);
        } else {
          await supabase
            .from('fila_processamento_claims')
            .update({ status: 'pending' })
            .eq('id', queueItem.id);
        }
      }
      
      // Delay entre claims
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`✅ Processamento concluído: ${successCount} sucesso, ${failedCount} falhas`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        processed: pendingClaims.length,
        successCount,
        failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Erro no processamento da fila:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
