/**
 * 🚀 ML VENDAS UNIFIED
 * Edge Function unificada para Vendas Canceladas do Mercado Livre
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EdgeFunctionRequest {
  action: 'fetch_orders' | 'fetch_pack' | 'update_shipping' | 'create_note' | 'create_feedback';
  params: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params }: EdgeFunctionRequest = await req.json();
    
    console.log(`[ml-vendas-unified] Action: ${action}`, params);
    
    // Router de ações - passar req para todas as funções
    switch (action) {
      case 'fetch_orders':
        return await fetchOrders(params, req);
      
      case 'fetch_pack':
        return await fetchPack(params, req);
      
      case 'update_shipping':
        return await updateShipping(params, req);
      
      case 'create_note':
        return await createNote(params, req);
      
      case 'create_feedback':
        return await createFeedback(params, req);
      
      default:
        return new Response(
          JSON.stringify({ error: `Action inválida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[ml-vendas-unified] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar requisição'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Buscar orders do Mercado Livre
 */
async function fetchOrders(params: Record<string, any>, req: Request) {
  const { 
    integrationAccountId,
    search = '',
    status = [],
    dateFrom = null,
    dateTo = null,
    offset = 0,
    limit = 50
  } = params;
  
  if (!integrationAccountId) {
    return new Response(
      JSON.stringify({ error: 'integration_account_id obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[fetch_orders] Buscando orders para account ${integrationAccountId}`);
  
  try {
    // 1️⃣ Obter access token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        persistSession: false
      }
    });
    
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-ml-token', {
      headers: {
        Authorization: authHeader
      },
      body: {
        integration_account_id: integrationAccountId,
        provider: 'mercadolivre'
      }
    });
    
    if (tokenError || !tokenData?.access_token) {
      console.error('[fetch_orders] Erro ao obter token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Falha ao obter token de acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = tokenData.access_token;
    console.log('[fetch_orders] ✅ Token obtido');
    
    // 2️⃣ Construir URL da API ML
    const mlApiUrl = new URL('https://api.mercadolibre.com/orders/search');
    mlApiUrl.searchParams.set('seller', tokenData.account_identifier || '');
    mlApiUrl.searchParams.set('offset', offset.toString());
    mlApiUrl.searchParams.set('limit', limit.toString());
    mlApiUrl.searchParams.set('sort', 'date_desc');
    
    // Aplicar filtros
    if (search) {
      mlApiUrl.searchParams.set('q', search);
    }
    
    if (status && status.length > 0) {
      mlApiUrl.searchParams.set('order.status', status.join(','));
    }
    
    if (dateFrom) {
      mlApiUrl.searchParams.set('order.date_created.from', new Date(dateFrom).toISOString());
    }
    
    if (dateTo) {
      mlApiUrl.searchParams.set('order.date_created.to', new Date(dateTo).toISOString());
    }
    
    console.log('[fetch_orders] URL ML:', mlApiUrl.toString());
    
    // 3️⃣ Fazer request para ML API
    const mlResponse = await fetch(mlApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('[fetch_orders] Erro ML API:', mlResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erro na API ML: ${mlResponse.status}` }),
        { status: mlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const mlData = await mlResponse.json();
    console.log(`[fetch_orders] ✅ ${mlData.results?.length || 0} orders recebidas`);
    
    // 4️⃣ Enriquecer com packs e shippings
    const orders = mlData.results || [];
    const packs: Record<string, any> = {};
    const shippings: Record<string, any> = {};
    
    // Agrupar orders por pack_id
    for (const order of orders) {
      if (order.pack_id && !packs[order.pack_id]) {
        packs[order.pack_id] = {
          id: order.pack_id,
          orders: []
        };
      }
      
      if (order.pack_id) {
        packs[order.pack_id].orders.push(order.id);
      }
      
      // Adicionar shipping info
      if (order.shipping?.id && !shippings[order.shipping.id]) {
        shippings[order.shipping.id] = order.shipping;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        orders,
        total: mlData.paging?.total || 0,
        packs,
        shippings
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[fetch_orders] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar orders',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Buscar detalhes de um pack
 */
async function fetchPack(params: Record<string, any>, req: Request) {
  const { packId, integrationAccountId } = params;
  
  if (!packId || !integrationAccountId) {
    return new Response(
      JSON.stringify({ error: 'packId e integrationAccountId obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[fetch_pack] Buscando pack ${packId}`);
  
  try {
    // 1️⃣ Obter access token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        persistSession: false
      }
    });
    
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-ml-token', {
      headers: {
        Authorization: authHeader
      },
      body: {
        integration_account_id: integrationAccountId,
        provider: 'mercadolivre'
      }
    });
    
    if (tokenError || !tokenData?.access_token) {
      console.error('[fetch_pack] Erro ao obter token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Falha ao obter token de acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = tokenData.access_token;
    
    // 2️⃣ Buscar pack via ML API
    const mlApiUrl = `https://api.mercadolibre.com/packs/${packId}`;
    
    const mlResponse = await fetch(mlApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('[fetch_pack] Erro ML API:', mlResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erro na API ML: ${mlResponse.status}` }),
        { status: mlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const pack = await mlResponse.json();
    console.log('[fetch_pack] ✅ Pack recebido');
    
    return new Response(
      JSON.stringify({ pack }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[fetch_pack] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar pack',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Atualizar status de envio
 */
async function updateShipping(params: Record<string, any>, req: Request) {
  const { shippingId, integrationAccountId, newStatus } = params;
  
  if (!shippingId || !integrationAccountId) {
    return new Response(
      JSON.stringify({ error: 'shippingId e integrationAccountId obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[update_shipping] Atualizando shipping ${shippingId} para ${newStatus}`);
  
  try {
    // 1️⃣ Obter access token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        persistSession: false
      }
    });
    
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-ml-token', {
      headers: {
        Authorization: authHeader
      },
      body: {
        integration_account_id: integrationAccountId,
        provider: 'mercadolivre'
      }
    });
    
    if (tokenError || !tokenData?.access_token) {
      console.error('[update_shipping] Erro ao obter token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Falha ao obter token de acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = tokenData.access_token;
    
    // 2️⃣ Atualizar shipping via ML API
    const mlApiUrl = `https://api.mercadolibre.com/shipments/${shippingId}`;
    
    const mlResponse = await fetch(mlApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('[update_shipping] Erro ML API:', mlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro na API ML: ${mlResponse.status}`,
          details: errorText
        }),
        { status: mlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await mlResponse.json();
    console.log('[update_shipping] ✅ Shipping atualizado');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[update_shipping] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro ao atualizar shipping',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Criar nota informativa no pack
 */
async function createNote(params: Record<string, any>, req: Request) {
  const { packId, integrationAccountId, note } = params;
  
  if (!packId || !integrationAccountId || !note) {
    return new Response(
      JSON.stringify({ error: 'packId, integrationAccountId e note obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (note.length > 300) {
    return new Response(
      JSON.stringify({ error: 'Nota não pode ter mais de 300 caracteres' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[create_note] Criando nota no pack ${packId}`);
  
  try {
    // 1️⃣ Obter access token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        persistSession: false
      }
    });
    
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-ml-token', {
      headers: {
        Authorization: authHeader
      },
      body: {
        integration_account_id: integrationAccountId,
        provider: 'mercadolivre'
      }
    });
    
    if (tokenError || !tokenData?.access_token) {
      console.error('[create_note] Erro ao obter token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Falha ao obter token de acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = tokenData.access_token;
    
    // 2️⃣ Criar nota via ML API
    const mlApiUrl = `https://api.mercadolibre.com/packs/${packId}/sellers_note`;
    
    const mlResponse = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ note })
    });
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('[create_note] Erro ML API:', mlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro na API ML: ${mlResponse.status}`,
          details: errorText
        }),
        { status: mlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await mlResponse.json();
    console.log('[create_note] ✅ Nota criada com sucesso');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[create_note] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro ao criar nota',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Criar feedback para uma venda
 */
async function createFeedback(params: Record<string, any>, req: Request) {
  const { orderId, integrationAccountId, fulfilled, rating, message } = params;
  
  if (!orderId || !integrationAccountId || typeof fulfilled !== 'boolean' || !rating) {
    return new Response(
      JSON.stringify({ error: 'orderId, integrationAccountId, fulfilled e rating obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (!['positive', 'negative', 'neutral'].includes(rating)) {
    return new Response(
      JSON.stringify({ error: 'rating deve ser positive, negative ou neutral' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[create_feedback] Criando feedback para order ${orderId}`);
  
  try {
    // 1️⃣ Obter access token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        persistSession: false
      }
    });
    
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-ml-token', {
      headers: {
        Authorization: authHeader
      },
      body: {
        integration_account_id: integrationAccountId,
        provider: 'mercadolivre'
      }
    });
    
    if (tokenError || !tokenData?.access_token) {
      console.error('[create_feedback] Erro ao obter token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Falha ao obter token de acesso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const accessToken = tokenData.access_token;
    
    // 2️⃣ Criar feedback via ML API
    const mlApiUrl = `https://api.mercadolibre.com/orders/${orderId}/feedback`;
    
    const feedbackBody: Record<string, any> = {
      fulfilled,
      rating
    };
    
    if (message && message.trim()) {
      feedbackBody.message = message.trim();
    }
    
    const mlResponse = await fetch(mlApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackBody)
    });
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('[create_feedback] Erro ML API:', mlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro na API ML: ${mlResponse.status}`,
          details: errorText
        }),
        { status: mlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await mlResponse.json();
    console.log('[create_feedback] ✅ Feedback criado com sucesso');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[create_feedback] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro ao criar feedback',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
