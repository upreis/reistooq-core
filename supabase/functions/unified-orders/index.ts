// supabase/functions/unified-orders/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // service-role
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";

function ok(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(error: string, status = 400, extra?: unknown) {
  // log detalhado no Edge Runtime
  console.error("[unified-orders][fail]", status, error, extra ?? null);
  return new Response(JSON.stringify({ ok: false, error, detail: extra ?? null }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const reqHeaders = req.headers.get("Access-Control-Request-Headers") ?? "authorization, x-client-info, apikey, content-type";
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Access-Control-Allow-Headers": reqHeaders } });
  }
  if (req.method !== "POST") return fail("Method Not Allowed", 405);

  const correlationId = crypto.randomUUID();
  console.log(`[unified-orders:${correlationId}] start`);

  try {
    if (!ENC_KEY) return fail("APP_ENCRYPTION_KEY ausente no runtime da função. Publique a função após definir o secret.", 500);

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) return fail("Missing Authorization header", 401);

    const sb = makeClient(authHeader);

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return fail("Body inválido (JSON esperado)", 400, String(e));
    }

    const { integration_account_id, status, limit = 50, offset = 0 } = body || {};
    if (!integration_account_id) return fail("integration_account_id é obrigatório", 400);

    console.log(`[unified-orders:${correlationId}] account_id=${integration_account_id} status=${status ?? "-"} limit=${limit} offset=${offset}`);

    // 1) Conta
    const { data: account, error: accErr } = await sb
      .from("integration_accounts")
      .select("*")
      .eq("id", integration_account_id)
      .maybeSingle();

    if (accErr || !account) return fail("Integration account not found", 404, accErr);
    if (!account.is_active) return fail("Integration account is not active", 400);

    if (account.provider !== "mercadolivre") {
      return ok({ results: [], unified: [], paging: { total: 0, limit, offset }, count: 0 });
    }

    // 2) Segredos
    const { data: secrets, error: secErr } = await sb.rpc("decrypt_integration_secret", {
      p_account_id: integration_account_id,
      p_provider: account.provider,
      p_encryption_key: ENC_KEY,
    });

    if (secErr || !secrets) return fail("Failed to retrieve integration secrets", 500, secErr);

    // 3) Expiração (refresh se faltarem <= 5 min)
    let accessToken: string | null = secrets.access_token ?? null;
    const expiresAt = secrets.expires_at ? new Date(secrets.expires_at) : null;
    const nearExpiry = expiresAt ? expiresAt.getTime() - Date.now() <= 5 * 60 * 1000 : false;

    if (!accessToken || nearExpiry) {
      console.log(`[unified-orders:${correlationId}] token ausente/expirando → refresh`);
      const { data: refData, error: refErr } = await sb.functions.invoke("mercadolibre-token-refresh", {
        body: { integration_account_id },
      });
      if (refErr || !refData?.success) return fail("Failed to refresh token", 401, refErr ?? refData);
      accessToken = refData.access_token;
    }

    // 4) Orders API
    const sellerId = String(account.account_identifier || secrets?.payload?.user_id || "");
    if (!sellerId) return fail("Seller ID não encontrado (account_identifier/payload.user_id)", 400);

    const mlUrl = new URL("https://api.mercadolibre.com/orders/search");
    mlUrl.searchParams.set("seller", sellerId);
    if (status) mlUrl.searchParams.set("order.status", status);
    mlUrl.searchParams.set("limit", String(limit));
    mlUrl.searchParams.set("offset", String(offset));

    console.log(`[unified-orders:${correlationId}] ML GET ${mlUrl.toString()}`);

    const mlResp = await fetch(mlUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });

    const mlRaw = await mlResp.text();
    if (!mlResp.ok) {
      // erros frequentes
      if (mlResp.status === 403 && mlRaw.includes("invalid_operator_user_id")) {
        return fail("invalid_operator_user_id - reconecte usando a conta ADMIN do seller no Mercado Livre", 403, mlRaw);
      }
      if (mlResp.status === 401) {
        // 1 retry com refresh
        const { data: ref2 } = await sb.functions.invoke("mercadolibre-token-refresh", { body: { integration_account_id } });
        if (ref2?.success) {
          const retry = await fetch(mlUrl.toString(), {
            headers: { Authorization: `Bearer ${ref2.access_token}`, "Content-Type": "application/json" },
          });
          const retryRaw = await retry.text();
          if (retry.ok) {
            const retryJson = JSON.parse(retryRaw);
            return ok({
              results: retryJson.results ?? [],
              unified: transformMLOrders(retryJson.results ?? [], integration_account_id),
              paging: retryJson.paging,
              count: retryJson.paging?.total ?? 0,
            });
          }
          return fail(`Mercado Livre API error (retry): ${retry.status}`, retry.status, retryRaw);
        }
      }
      return fail(`Mercado Livre API error: ${mlResp.status}`, mlResp.status, mlRaw);
    }

    const mlJson = JSON.parse(mlRaw || "{}");
    console.log(`[unified-orders:${correlationId}] ML OK items=${mlJson?.results?.length ?? 0} total=${mlJson?.paging?.total ?? 0}`);

    return ok({
      results: mlJson.results ?? [],
      unified: transformMLOrders(mlJson.results ?? [], integration_account_id),
      paging: mlJson.paging,
      count: mlJson.paging?.total ?? 0,
    });
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    console.error(`[unified-orders:${correlationId}] unhandled`, msg, err);
    return fail(msg || "Internal server error", 500);
  }
});

// helpers
function transformMLOrders(mlOrders: any[], integrationAccountId: string) {
  return (mlOrders ?? []).map((order) => ({
    id: String(order.id),
    numero: String(order.id),
    nome_cliente: order.buyer?.nickname || order.buyer?.first_name || null,
    cpf_cnpj: null,
    data_pedido: order.date_created?.split("T")[0] || null,
    data_prevista: order.estimated_delivery?.date || null,
    situacao: mapMLStatus(order.status),
    valor_total: order.total_amount || 0,
    valor_frete: order.shipping?.cost || 0,
    valor_desconto: 0,
    numero_ecommerce: String(order.id),
    numero_venda: null,
    empresa: "MercadoLivre",
    cidade: order.shipping?.receiver_address?.city || null,
    uf: order.shipping?.receiver_address?.state?.name || null,
    codigo_rastreamento: order.shipping?.tracking_number || null,
    url_rastreamento: null,
    obs: null,
    obs_interna: null,
    integration_account_id: integrationAccountId,
    created_at: order.date_created,
    updated_at: order.last_updated || order.date_created,
  }));
}

function mapMLStatus(s: string) {
  const m: Record<string, string> = {
    confirmed: "Confirmado",
    payment_required: "Aguardando Pagamento",
    payment_in_process: "Processando Pagamento",
    partially_paid: "Parcialmente Pago",
    paid: "Pago",
    cancelled: "Cancelado",
    invalid: "Inválido",
    shipped: "Enviado",
    delivered: "Entregue",
  };
  return m[s] ?? s;
}