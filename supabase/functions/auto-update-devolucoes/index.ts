/**
 * 🤖 AUTO-UPDATE DEVOLUÇÕES - CRON JOB
 * Atualiza automaticamente as devoluções de todas as contas ML ativas
 * Executa a cada 4 horas (8h, 12h, 16h, 20h)
 */

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
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
    console.log('🤖 Cron Job: Iniciando atualização automática de devoluções...');
    
    // Buscar todas as contas ativas do Mercado Livre
    const { data: contas, error } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('provider', 'mercadolivre')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Erro ao buscar contas:', error);
      throw error;
    }

    if (!contas || contas.length === 0) {
      console.log('ℹ️ Nenhuma conta ML ativa encontrada');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nenhuma conta ML ativa para atualizar',
          totalContas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 ${contas.length} contas ML ativas encontradas`);

    let totalAtualizadas = 0;
    let totalErros = 0;
    const resultados: any[] = [];

    // Processar cada conta sequencialmente
    for (const conta of contas) {
      try {
        console.log(`\n🔄 Processando conta: ${conta.name} (${conta.account_identifier})`);
        const startTime = Date.now();
        
        // Chamar ml-api-direct para buscar e salvar devoluções
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ml-api-direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
          },
          body: JSON.stringify({
            action: 'get_claims_and_returns',
            integration_account_id: conta.id,
            seller_id: conta.account_identifier,
            filters: {
              periodoDias: 0,  // ✅ Sem filtro de data - buscar tudo
              tipoData: 'date_created',
              statusClaim: '',
              claimType: '',
              stage: '',
              fulfilled: undefined,
              quantityType: '',
              reasonId: '',
              resource: ''
            },
            limit: 100,
            offset: 0
          })
        });

        const duration = Date.now() - startTime;

        if (response.ok) {
          const result = await response.json();
          const quantidade = result.data?.length || 0;
          
          console.log(`✅ Conta ${conta.name}: ${quantidade} devoluções atualizadas em ${duration}ms`);
          totalAtualizadas++;
          
          // Log de sucesso
          await supabase
            .from('logs_atualizacao')
            .insert({
              integration_account_id: conta.id,
              tipo: 'devolucoes_auto',
              quantidade: quantidade,
              status: 'sucesso',
              duracao_ms: duration,
              timestamp: new Date().toISOString()
            });

          resultados.push({
            conta: conta.name,
            status: 'sucesso',
            quantidade,
            duracao_ms: duration
          });
            
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro na conta ${conta.name}:`, errorMessage);
        totalErros++;
        
        // Log de erro
        await supabase
          .from('logs_atualizacao')
          .insert({
            integration_account_id: conta.id,
            tipo: 'devolucoes_auto',
            status: 'erro',
            erro: errorMessage,
            timestamp: new Date().toISOString()
          });

        resultados.push({
          conta: conta.name,
          status: 'erro',
          erro: errorMessage
        });
      }
      
      // ⏱️ Aguardar 1 minuto entre contas para evitar rate limit
      if (totalAtualizadas + totalErros < contas.length) {
        console.log('⏳ Aguardando 60s antes da próxima conta...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
    
    console.log(`\n🎯 Atualização concluída:`);
    console.log(`   ✅ Sucessos: ${totalAtualizadas}`);
    console.log(`   ❌ Erros: ${totalErros}`);
    console.log(`   📊 Total: ${contas.length}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        totalContas: contas.length,
        sucessos: totalAtualizadas,
        erros: totalErros,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro geral no cron job:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
