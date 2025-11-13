/**
 * 💬 ML CLAIMS MESSAGES - Busca Mensagens de um Claim
 * FASE 4.1: Busca e salva mensagens de claims específicos
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { claimId, accountId } = await req.json() as {
      claimId: string;
      accountId: string;
    };

    console.log('[ml-claims-messages] Buscando mensagens', { claimId, accountId });

    // Buscar token ML
    const INTERNAL_TOKEN = Deno.env.get('INTERNAL_SHARED_TOKEN');
    if (!INTERNAL_TOKEN) {
      throw new Error('CRITICAL: INTERNAL_SHARED_TOKEN must be configured in Supabase Edge Function secrets');
    }
    
    const tokenUrl = `${supabaseUrl}/functions/v1/integrations-get-secret`;
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'x-internal-call': 'true',
        'x-internal-token': INTERNAL_TOKEN
      },
      body: JSON.stringify({
        integration_account_id: accountId,
        provider: 'mercadolivre'
      })
    });

    if (!tokenRes.ok) {
      throw new Error('Token ML indisponível');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.secret?.access_token;

    if (!accessToken) {
      throw new Error('Access token não encontrado');
    }

    // Buscar mensagens da API ML
    const messagesUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}/messages`;
    
    console.log('[ml-claims-messages] Chamando API ML', { url: messagesUrl });

    const messagesRes = await fetch(messagesUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!messagesRes.ok) {
      const errorText = await messagesRes.text();
      console.error('[ml-claims-messages] Erro ML API', { status: messagesRes.status, error: errorText });
      throw new Error(`ML API error: ${messagesRes.status}`);
    }

    const messagesData = await messagesRes.json();
    const messages = messagesData.data || [];

    console.log(`[ml-claims-messages] ${messages.length} mensagens encontradas`);

    // Preparar mensagens para salvar no banco
    const messagesToUpsert = messages.map((msg: any) => ({
      id: msg.id,
      claim_id: claimId,
      sender_id: msg.sender?.id || null,
      sender_role: msg.sender?.role || null,
      receiver_id: msg.receiver?.id || null,
      receiver_role: msg.receiver?.role || null,
      message: msg.message,
      attachments: msg.attachments || [],
      date_created: msg.date_created,
      status: msg.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Salvar mensagens no banco
    if (messagesToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('reclamacoes_mensagens')
        .upsert(messagesToUpsert, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('[ml-claims-messages] Erro ao salvar mensagens', upsertError);
        throw upsertError;
      }

      console.log(`[ml-claims-messages] ${messagesToUpsert.length} mensagens salvas no banco`);
    }

    // Atualizar contador de mensagens no claim
    await supabase
      .from('reclamacoes')
      .update({
        total_mensagens: messages.length,
        tem_mensagens: messages.length > 0,
        updated_at: new Date().toISOString()
      })
      .eq('claim_id', claimId);

    return new Response(
      JSON.stringify({
        success: true,
        count: messages.length,
        messages: messagesToUpsert
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[ml-claims-messages] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
