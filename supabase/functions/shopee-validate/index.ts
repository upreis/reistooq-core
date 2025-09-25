import { makeServiceClient, corsHeaders, ok, fail } from "../_shared/client.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  const cid = crypto.randomUUID().slice(0, 8);

  try {
    const { partner_id, partner_key, shop_id } = await req.json();

    if (!partner_id || !partner_key) {
      return fail('partner_id and partner_key are required', 400);
    }

    console.log(`[shopee-validate:${cid}] 🛒 MOCK: Validando credenciais Shopee`);
    
    // TODO: Implementar validação real da API Shopee
    // Por enquanto simula validação para não quebrar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockValidation = {
      valid: partner_id.length > 5 && partner_key.length > 10, // Mock simples
      shop_info: partner_id.length > 5 ? {
        shop_name: `Loja Teste ${partner_id.slice(-4)}`,
        shop_id: shop_id || partner_id
      } : null,
      error: partner_id.length <= 5 ? 'Invalid partner_id format' : null
    };
    
    console.log(`[shopee-validate:${cid}] 🛒 MOCK resultado:`, {
      valid: mockValidation.valid,
      hasShopInfo: !!mockValidation.shop_info
    });
    
    return ok(mockValidation);

  } catch (error) {
    console.error(`[shopee-validate:${cid}] Error:`, error);
    return fail(error instanceof Error ? error.message : String(error), 500);
  }
});