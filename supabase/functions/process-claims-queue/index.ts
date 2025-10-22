/**
 * 🔄 PROCESS CLAIMS QUEUE
 * Processa fila de claims do Mercado Livre em lotes
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = makeServiceClient();
    const BATCH_SIZE = 20; // Processar 20 claims por execução
    
    console.log(`🔄 Iniciando processamento da fila de claims...`);
    
    // Buscar claims pendentes
    const { data: pendingClaims, error: fetchError } = await supabase
      .from('fila_processamento_claims')
      .select('*')
      .eq('status', 'pending')
      .lt('tentativas', 3) // Máximo 3 tentativas
      .order('criado_em', { ascending: true })
      .limit(BATCH_SIZE);
    
    if (fetchError) {
      console.error('Erro ao buscar claims pendentes:', fetchError);
      throw fetchError;
    }
    
    if (!pendingClaims || pendingClaims.length === 0) {
      console.log('✅ Nenhum claim pendente na fila');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum claim pendente',
          processed: 0 
        }),
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
          .update({ 
            status: 'processing',
            tentativas: queueItem.tentativas + 1 
          })
          .eq('id', queueItem.id);
        
        // Chamar ml-api-direct para processar este claim específico
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ml-api-direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'process_single_claim',
            integration_account_id: queueItem.integration_account_id,
            claim_id: queueItem.claim_id,
            order_id: queueItem.order_id,
            claim_data: queueItem.claim_data
          })
        });
        
        if (response.ok) {
          // Marcar como completado
          await supabase
            .from('fila_processamento_claims')
            .update({ 
              status: 'completed',
              processado_em: new Date().toISOString()
            })
            .eq('id', queueItem.id);
          
          successCount++;
          console.log(`✅ Claim ${queueItem.claim_id} processado com sucesso`);
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
      } catch (error) {
        failedCount++;
        console.error(`❌ Erro ao processar claim ${queueItem.claim_id}:`, error);
        
        // Marcar como falha se excedeu tentativas
        if (queueItem.tentativas + 1 >= 3) {
          await supabase
            .from('fila_processamento_claims')
            .update({ 
              status: 'failed',
              erro_mensagem: error.message
            })
            .eq('id', queueItem.id);
        } else {
          // Voltar para pending para tentar novamente
          await supabase
            .from('fila_processamento_claims')
            .update({ status: 'pending' })
            .eq('id', queueItem.id);
        }
      }
      
      // Delay entre requisições para evitar rate limit
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
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})
