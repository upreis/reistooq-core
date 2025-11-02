/**
 * 🚀 ML VENDAS UNIFIED
 * Edge Function unificada para Vendas Online do Mercado Livre
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    
    // Router de ações
    switch (action) {
      case 'fetch_orders':
        return await fetchOrders(params);
      
      case 'fetch_pack':
        return await fetchPack(params);
      
      case 'update_shipping':
        return await updateShipping(params);
      
      case 'create_note':
        return await createNote(params);
      
      case 'create_feedback':
        return await createFeedback(params);
      
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
async function fetchOrders(params: Record<string, any>) {
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
  
  // TODO: Implementar na FASE 2
  // 1. Buscar token ML via TokenManager
  // 2. Fazer request para ML API /orders/search
  // 3. Enriquecer com dados de packs
  // 4. Aplicar cache
  
  return new Response(
    JSON.stringify({ 
      orders: [],
      total: 0,
      packs: {},
      shippings: {},
      message: 'FASE 1: Base estrutural OK. FASE 2: Integração ML API'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Buscar detalhes de um pack
 */
async function fetchPack(params: Record<string, any>) {
  const { packId, integrationAccountId } = params;
  
  if (!packId || !integrationAccountId) {
    return new Response(
      JSON.stringify({ error: 'packId e integrationAccountId obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[fetch_pack] Buscando pack ${packId}`);
  
  // TODO: FASE 3
  return new Response(
    JSON.stringify({ pack: null }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Atualizar status de envio
 */
async function updateShipping(params: Record<string, any>) {
  const { shippingId, integrationAccountId, newStatus } = params;
  
  if (!shippingId || !integrationAccountId) {
    return new Response(
      JSON.stringify({ error: 'shippingId e integrationAccountId obrigatórios' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[update_shipping] Atualizando shipping ${shippingId} para ${newStatus}`);
  
  // TODO: FASE 3
  return new Response(
    JSON.stringify({ success: false, message: 'FASE 3: Não implementado' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Criar nota informativa no pack
 */
async function createNote(params: Record<string, any>) {
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
  
  // TODO: FASE 4
  return new Response(
    JSON.stringify({ success: false, message: 'FASE 4: Não implementado' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Criar feedback para uma venda
 */
async function createFeedback(params: Record<string, any>) {
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
  
  // TODO: FASE 4
  return new Response(
    JSON.stringify({ success: false, message: 'FASE 4: Não implementado' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
