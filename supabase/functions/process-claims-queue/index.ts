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
        
        console.log(`📦 Processando claim ${queueItem.claim_id} da fila...`);
        
        // ✅ USAR DADOS DO CLAIM_DATA DIRETAMENTE (já temos da API ML)
        const claimData = queueItem.claim_data;
        
        if (!claimData) {
          throw new Error('claim_data ausente na fila');
        }
        
        // Obter account_name
        const { data: accountData } = await supabase
          .from('integration_accounts')
          .select('account_name')
          .eq('id', queueItem.integration_account_id)
          .single();
        
        const accountName = accountData?.account_name || 'Unknown';
        
        // 🎯 USAR claim_data que já vem completo da API ML
        const claim = queueItem.claim_data;
        
        if (!claim) {
          console.error(`❌ claim_data ausente para claim ${queueItem.claim_id}`);
          throw new Error('claim_data ausente');
        }
        
        // Estrutura COMPLETA copiada do ml-api-direct
        const claimRecord = {
          order_id: String(claim.order_id || claim.resource_id),
          claim_id: String(claim.claim_details?.id || claim.id),
          integration_account_id: queueItem.integration_account_id,
          account_name: accountName,
          marketplace_origem: 'ML_BRASIL',
          
          // Dados básicos da listagem
          data_criacao: claim.date_created,
          status_devolucao: claim.status,
          tipo_claim: claim.type || claim.claim_details?.type,
          subtipo_claim: claim.claim_details?.stage || 'none',
          
          // Reason
          reason_id: claim.reason_id || claim.claim_details?.reason_id,
          motivo_categoria: claim.reason_id || claim.claim_details?.reason_id,
          
          // Produto
          produto_titulo: claim.resource_data?.title || claim.order_data?.order_items?.[0]?.item?.title,
          sku: claim.resource_data?.sku || claim.order_data?.order_items?.[0]?.item?.seller_sku,
          quantidade: claim.resource_data?.quantity || claim.order_data?.order_items?.[0]?.quantity,
          
          // Valores
          valor_retido: claim.amount || claim.order_data?.total_amount,
          valor_original_produto: claim.order_data?.total_amount,
          
          // Resolução
          metodo_resolucao: claim.claim_details?.resolution?.reason,
          resultado_final: claim.claim_details?.resolution?.reason,
          
          // Custos
          responsavel_custo: claim.claim_details?.resolution?.benefited?.[0] || 'complainant',
          
          // Timestamps
          data_criacao_claim: claim.claim_details?.date_created || claim.date_created,
          data_inicio_return: claim.return_details_v2?.date_created,
          data_fechamento_claim: claim.claim_details?.resolution?.date_created,
          
          // Mediação
          em_mediacao: claim.claim_details?.type === 'mediations',
          resultado_mediacao: claim.claim_details?.resolution?.reason,
          
          // Review
          review_status: claim.claim_details?.status,
          review_result: claim.claim_details?.resolution?.reason,
          observacoes_review: claim.claim_details?.resolution?.reason,
          
          // Comprador
          comprador_nome_completo: claim.buyer?.first_name && claim.buyer?.last_name 
            ? `${claim.buyer.first_name} ${claim.buyer.last_name}` 
            : null,
          comprador_nickname: claim.buyer?.nickname,
          
          // Pagamento
          metodo_pagamento: claim.order_data?.payments?.[0]?.payment_method_id,
          tipo_pagamento: claim.order_data?.payments?.[0]?.payment_type,
          parcelas: claim.order_data?.payments?.[0]?.installments,
          valor_parcela: claim.order_data?.payments?.[0]?.installment_amount,
          transaction_id: claim.order_data?.payments?.[0]?.id?.toString(),
          
          // Tags
          tags_pedido: claim.order_data?.tags || [],
          internal_tags: claim.order_data?.internal_tags || [],
          nota_fiscal_autorizada: claim.order_data?.internal_tags?.includes('invoice_authorized') || false,
          
          // Tracking
          shipment_id: claim.shipment_id,
          codigo_rastreamento: claim.codigo_rastreamento,
          transportadora: claim.transportadora,
          status_rastreamento: claim.status_rastreamento_pedido,
          tracking_history: claim.tracking_history || [],
          tracking_events: claim.tracking_events || [],
          
          // Comunicação
          timeline_mensagens: claim.claim_messages?.messages || [],
          ultima_mensagem_data: claim.claim_messages?.messages?.[claim.claim_messages?.messages?.length - 1]?.date_created,
          numero_interacoes: claim.claim_messages?.messages?.length || 0,
          
          // Metadata
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ultima_sincronizacao: new Date().toISOString(),
          fonte_dados_primaria: 'ml_api_queue',
          
          // Raw data (JSONB)
          dados_order: claim.order_data || {},
          dados_claim: claim.claim_details || {},
          dados_mensagens: claim.claim_messages || {},
          dados_return: claim.return_details_v2 || claim.return_details_v1 || {}
        };
        
        // Salvar no banco
        const { error: saveError } = await supabase
          .from('devolucoes_avancadas')
          .upsert(claimRecord, { 
            onConflict: 'order_id,integration_account_id',
            ignoreDuplicates: false 
          });
        
        if (saveError) {
          console.error(`❌ Erro ao salvar claim ${queueItem.claim_id}:`, {
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
        console.log(`✅ Claim ${queueItem.claim_id} salvo com sucesso`);
        
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
