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
        
        // 🎯 ESTRUTURA MÍNIMA - APENAS COLUNAS QUE EXISTEM NA TABELA
        const claimRecord = {
          order_id: String(claimData.order_id || claimData.resource_id),
          claim_id: String(claimData.claim_details?.id || claimData.id),
          integration_account_id: queueItem.integration_account_id,
          account_name: accountName,
          marketplace_origem: 'ML_BRASIL',
          
          // Dados básicos
          data_criacao: claimData.date_created || claimData.claim_details?.date_created,
          status_devolucao: claimData.status || claimData.claim_details?.status,
          tipo_claim: claimData.claim_details?.type || claimData.type,
          subtipo_claim: claimData.claim_details?.stage || 'none',
          
          // Reason
          motivo_categoria: claimData.claim_details?.reason_id || claimData.reason_id,
          
          // Produto
          produto_titulo: claimData.resource_data?.title || claimData.order_data?.order_items?.[0]?.item?.title,
          sku: claimData.resource_data?.sku || claimData.order_data?.order_items?.[0]?.item?.seller_sku,
          quantidade: claimData.resource_data?.quantity || claimData.order_data?.order_items?.[0]?.quantity,
          
          // Valores
          valor_retido: claimData.amount || claimData.order_data?.total_amount,
          
          // Resolução
          metodo_resolucao: claimData.claim_details?.resolution?.reason,
          resultado_final: claimData.claim_details?.resolution?.reason,
          
          // Custos
          responsavel_custo: claimData.claim_details?.resolution?.benefited?.[0] || 'complainant',
          
          // Timestamps
          data_criacao_claim: claimData.claim_details?.date_created || claimData.date_created,
          data_fechamento_claim: claimData.claim_details?.resolution?.date_created,
          
          // Mediação
          em_mediacao: claimData.claim_details?.type === 'mediations',
          resultado_mediacao: claimData.claim_details?.resolution?.reason,
          
          // Review
          observacoes_review: claimData.claim_details?.resolution?.reason,
          
          // Metadata
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ultima_sincronizacao: new Date().toISOString(),
          fonte_dados_primaria: 'ml_api_queue',
          
          // Comunicação
          timeline_mensagens: claimData.claim_messages?.messages || [],
          ultima_mensagem_data: claimData.claim_messages?.messages?.[claimData.claim_messages?.messages?.length - 1]?.date_created,
          
          // Raw data (JSONB) - usar nomes corretos das colunas
          dados_order: claimData.order_data || {},
          dados_claim: claimData.claim_details || {},
          dados_mensagens: claimData.claim_messages || {},
          dados_return: claimData.return_details_v2 || claimData.return_details_v1 || {}
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
