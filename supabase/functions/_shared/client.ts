/**
 * 🔧 SHARED CLIENT UTILITIES
 * Utilitários compartilhados para edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export function makeServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export function ok(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

export function fail(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }, 
      status 
    }
  );
}

export async function getMlConfig(supabase: any, accountId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('get-ml-token', {
      body: {
        integration_account_id: accountId,
        provider: 'mercadolivre'
      }
    });

    if (error || !data?.access_token) {
      console.error('❌ Erro ao obter token ML:', error);
      return null;
    }

    return {
      access_token: data.access_token,
      account_identifier: data.account_identifier
    };
  } catch (error) {
    console.error('❌ Erro ao buscar config ML:', error);
    return null;
  }
}