// Supabase Edge Function: integrations-deactivate-ml
// Desativa todas as contas Mercado Livre (integration_accounts) da ORGANIZAÇÃO atual
// Usa RLS com o JWT do usuário (verify_jwt = true)
// - Atualiza is_active=false onde provider='mercadolivre' e organization_id=get_current_org_id()
// - Retorna quantidade de contas desativadas

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  });

  try {
    // Autenticação do usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'not_authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Obter organização atual via RPC segura
    const { data: orgId, error: orgError } = await supabase.rpc('get_current_org_id');
    if (orgError || !orgId) {
      return new Response(JSON.stringify({ ok: false, error: 'organization_not_found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Desativar todas as contas ML da organização atual
    const { data, error } = await supabase
      .from('integration_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .select('id');

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const count = Array.isArray(data) ? data.length : 0;

    return new Response(
      JSON.stringify({ ok: true, deactivated: count }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'internal_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
