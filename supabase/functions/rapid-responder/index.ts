import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, ENC_KEY, ok, fail, corsHeaders } from "../_shared/client.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return fail("Method Not Allowed", 405);
  }

  try {
    const supabase = makeClient(req.headers.get("Authorization"));
    const body = await req.json();
    const { 
      integration_account_id, 
      seller_id, 
      date_from, 
      date_to, 
      order_status, 
      limit = 50,
      offset = 0 
    } = body;

    if (!integration_account_id) {
      return fail("integration_account_id é obrigatório");
    }

    console.log('[ML Orders] Fetching orders for account:', integration_account_id);

    // Get current secrets
    const { data: secrets, error: secretsError } = await supabase.rpc('decrypt_integration_secret', {
      p_account_id: integration_account_id,
      p_provider: 'mercadolivre',
      p_encryption_key: ENC_KEY,
    });

    if (secretsError || !secrets) {
      console.error('[ML Orders] Failed to get secrets:', secretsError);
      return fail("Segredos não encontrados", 404);
    }

    let accessToken = secrets.access_token;
    const expiresAt = new Date(secrets.expires_at);
    const now = new Date();

    // Check if token needs refresh (refresh if expires within 5 minutes)
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log('[ML Orders] Token expiring soon, refreshing...');
      
      // Call refresh function
      const refreshResponse = await supabase.functions.invoke('smart-responder', {
        body: { integration_account_id }
      });

      if (refreshResponse.error) {
        console.error('[ML Orders] Token refresh failed:', refreshResponse.error);
        return fail("Falha ao renovar token de acesso", 400);
      }

      accessToken = refreshResponse.data.access_token;
      console.log('[ML Orders] Token refreshed successfully');
    }

    // Determine seller_id - use provided or get from payload
    const finalSellerId = seller_id || secrets.payload?.user_id;
    if (!finalSellerId) {
      return fail("seller_id é obrigatório e não foi encontrado nos dados salvos", 400);
    }

    // Build ML API URL for orders search
    const mlApiUrl = new URL('https://api.mercadolibre.com/orders/search');
    mlApiUrl.searchParams.set('seller', finalSellerId.toString());
    mlApiUrl.searchParams.set('sort', 'date_desc');
    mlApiUrl.searchParams.set('limit', limit.toString());
    mlApiUrl.searchParams.set('offset', offset.toString());

    if (date_from) {
      mlApiUrl.searchParams.set('order.date_created.from', date_from);
    }
    if (date_to) {
      mlApiUrl.searchParams.set('order.date_created.to', date_to);
    }
    if (order_status) {
      mlApiUrl.searchParams.set('order.status', order_status);
    }

    console.log('[ML Orders] Calling ML API:', mlApiUrl.toString());

    // Call MercadoLibre API
    const mlResponse = await fetch(mlApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('[ML Orders] ML API call failed:', mlResponse.status, errorText);

      // Handle specific ML API errors
      if (mlResponse.status === 401) {
        return fail("Token de acesso inválido ou expirado", 401);
      } else if (mlResponse.status === 403) {
        return fail("Acesso negado - verifique as permissões da aplicação", 403);
      } else if (mlResponse.status === 429) {
        return fail("Limite de taxa excedido - tente novamente mais tarde", 429);
      }

      return fail(`Erro da API do MercadoLibre: ${mlResponse.status}`, mlResponse.status);
    }

    const mlData = await mlResponse.json();
    console.log('[ML Orders] Successfully fetched', mlData.results?.length || 0, 'orders');

    return ok({
      orders: mlData.results || [],
      paging: mlData.paging || {},
      sort: mlData.sort || {},
      available_sorts: mlData.available_sorts || [],
      filters: mlData.filters || [],
      seller_id: finalSellerId,
    });

  } catch (e) {
    console.error('[ML Orders] Unexpected error:', e);
    return fail(String(e?.message ?? e), 500);
  }
});