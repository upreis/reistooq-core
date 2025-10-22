/**
 * 🔄 RESET FAILED CLAIMS
 * Reseta claims falhados para pending e zera tentativas
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
    
    console.log('🔄 Resetando claims falhados...');
    
    // Resetar claims falhados para pending
    const { data, error } = await supabase
      .from('fila_processamento_claims')
      .update({ 
        status: 'pending',
        tentativas: 0,
        erro_mensagem: null
      })
      .eq('status', 'failed')
      .select('id');
    
    if (error) {
      console.error('❌ Erro ao resetar claims:', error);
      throw error;
    }
    
    const resetCount = data?.length || 0;
    console.log(`✅ ${resetCount} claims resetados para pending`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        resetCount,
        message: `${resetCount} claims resetados com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Erro ao resetar claims:', error);
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
