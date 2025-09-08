// supabase/functions/unified-orders/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-call",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";

function serviceClient(authHeader?: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

function ok(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function fail(error: string, status = 400, detail?: unknown, cid?: string) {
  const payload: Record<string, unknown> = { ok: false, error, status };
  if (detail !== undefined) payload.detail = detail;
  if (cid) payload.correlation_id = cid;
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function getMlConfig() {
  const clientId = Deno.env.get("ML_CLIENT_ID");
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Missing ML_CLIENT_ID / ML_CLIENT_SECRET");
  return { clientId, clientSecret };
}

async function refreshIfNeeded(
  sb: ReturnType<typeof serviceClient>,
  secrets: any,
  cid: string,
  authHeader: string
) {
  const safetyMs = 5 * 60 * 1000; // 5min
  const now = Date.now();
  const exp = secrets?.expires_at ? new Date(secrets.expires_at).getTime() : 0;
  if (secrets?.access_token && exp > now + safetyMs) return secrets;

  console.log(`[unified-orders:${cid}] Access token expirado/expirando, fazendo refresh...`);
  const { clientId, clientSecret } = getMlConfig();
  if (!secrets?.refresh_token) throw new Error("Missing refresh_token");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: secrets.refresh_token,
  });

  const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: params.toString(),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    console.error(`[unified-orders:${cid}] Refresh ML falhou`, resp.status, raw);
    throw new Error(`ML refresh failed ${resp.status}: ${raw}`);
  }

  const data = JSON.parse(raw);
  const newExpiresAt = new Date(Date.now() + (data.expires_in ?? 0) * 1000).toISOString();

  const { data: upData, error: upErr } = await sb.functions.invoke('integrations-store-secret', {
    body: {
      integration_account_id: secrets.account_id,
      provider: 'mercadolivre',
      access_token: data.access_token,
      refresh_token: data.refresh_token || secrets.refresh_token,
      expires_at: newExpiresAt,
      payload: secrets.meta ?? {}
    },
    headers: { Authorization: authHeader, 'x-internal-call': ENC_KEY }
  });
  if (upErr || !upData?.ok) {
    console.error(`[unified-orders:${cid}] Falha ao salvar novos tokens`, upErr, upData);
    throw new Error("Failed to save refreshed tokens");
  }

  console.log(`[unified-orders:${cid}] Refresh OK`);
  return {
    ...secrets,
    access_token: data.access_token,
    refresh_token: data.refresh_token || secrets.refresh_token,
    expires_at: newExpiresAt,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const reqHeaders =
      req.headers.get("Access-Control-Request-Headers") ??
      "authorization, x-client-info, apikey, content-type";
    return new Response(null, {
      status: 200,
      headers: { ...corsHeaders, "Access-Control-Allow-Headers": reqHeaders },
    });
  }
  if (req.method !== "POST") return fail("Method Not Allowed", 405);

  const cid = crypto.randomUUID().slice(0, 8);
  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) return fail("Missing Authorization header", 401, null, cid);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const {
      integration_account_id,
      status,
      shipping_status,
      date_from,
      date_to,
      seller_id,
      q,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      limit: rawLimit = 50,
      offset = 0,
    } = body || {};

    console.log(`[unified-orders:${cid}] Filtros detalhados:`, {
      integration_account_id,
      filtros_geograficos: { cidade, uf },
      filtros_valor: { valorMin, valorMax },
      filtros_busca: { q, search },
      filtros_data: { date_from, date_to },
      filtros_status: { status, shipping_status },
    });

    const limit = Math.min(rawLimit, 50);
    if (rawLimit > 50) {
      console.warn(
        `[unified-orders:${cid}] Limit reduzido de ${rawLimit} para ${limit} (máximo permitido: 50)`
      );
    }

    console.log(`[unified-orders:${cid}] filters`, {
      integration_account_id,
      status,
      shipping_status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit,
      offset,
    });
    if (!integration_account_id)
      return fail("integration_account_id é obrigatório", 400, null, cid);

    const sb = serviceClient(authHeader);

    // 1) Conta
    const { data: account, error: accErr } = await sb
      .from("integration_accounts")
      .select("*")
      .eq("id", integration_account_id)
      .maybeSingle();

    if (accErr || !account) return fail("Integration account not found", 404, accErr, cid);
    if (!account.is_active) return fail("Integration account is not active", 400, null, cid);
    const provider = String(account.provider || '').toLowerCase();
    const mlProviders = new Set(['mercadolivre', 'mercado_livre', 'mercadolibre', 'ml']);
    if (!mlProviders.has(provider)) {
      return ok({ results: [], unified: [], paging: { total: 0, limit, offset }, count: 0 });
    }

    // 2) Segredos - leitura com fallback legado via edge integrations-get-secret
    const { data: secretRow, error: secErr } = await sb
      .from('integration_secrets')
      .select('access_token, refresh_token, expires_at, meta, secret_enc')
      .eq('integration_account_id', integration_account_id)
      .maybeSingle();

    let resolvedSecrets: any = null;
    let fallbackSecretEnc: any = account?.secret_enc ?? null;

    console.log(`[unified-orders:${cid}] Resultado busca secrets:`, { 
      hasRow: !!secretRow, 
      hasAccessToken: !!secretRow?.access_token, 
      hasSecretEnc: !!secretRow?.secret_enc 
    });

    if (secretRow?.access_token) {
      resolvedSecrets = {
        access_token: secretRow.access_token,
        refresh_token: secretRow.refresh_token,
        expires_at: secretRow.expires_at,
        meta: secretRow.meta || {},
      };
      console.log(`[unified-orders:${cid}] Usando tokens diretos da tabela`);
    }

    if (!resolvedSecrets?.access_token) {
      console.log(`[unified-orders:${cid}] Fallback → integrations-get-secret`);
      const { data: secData, error: getErr } = await sb.functions.invoke('integrations-get-secret', {
        body: { integration_account_id, provider: 'mercadolivre' },
        headers: { Authorization: authHeader!, 'x-internal-call': ENC_KEY }
      });
      if (getErr) console.warn(`[unified-orders:${cid}] get-secret error`, getErr);
      const payload: any = secData?.secret ?? secData ?? null;
      if (payload?.secret_enc) fallbackSecretEnc = payload.secret_enc;
      if (payload?.access_token) {
        resolvedSecrets = {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token ?? secretRow?.refresh_token ?? null,
          expires_at: payload.expires_at ?? secretRow?.expires_at ?? null,
          meta: payload.payload ?? payload.meta ?? secretRow?.meta ?? {},
        };
        console.log(`[unified-orders:${cid}] Tokens obtidos via get-secret`);
      }
    }

    if (!resolvedSecrets?.access_token && (secretRow?.secret_enc || fallbackSecretEnc)) {
      // Último recurso: tentar decodificar JSON/base64 simples (legado)
      try {
        const enc: any = fallbackSecretEnc ?? secretRow?.secret_enc ?? account?.secret_enc;
        let obj: any = null;
        const tryParseJson = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
        if (typeof enc === 'string') {
          obj = tryParseJson(enc) || tryParseJson(atob(enc)) || null;
        } else if (typeof enc === 'object') {
          // Bytea -> Buffer-like
          if (Array.isArray((enc as any).data)) {
            try {
              const bytes = new Uint8Array((enc as any).data as number[]);
              const txt = new TextDecoder().decode(bytes);
              obj = tryParseJson(txt) || tryParseJson(atob(txt)) || null;
            } catch {}
          } else {
            obj = enc;
          }
        }
        const cands = [obj, obj?.mercadolivre, obj?.mercado_livre, obj?.ml, obj?.token, obj?.data].filter(Boolean);
        for (const c of cands) {
          if (c?.access_token) {
            resolvedSecrets = {
              access_token: c.access_token,
              refresh_token: c.refresh_token ?? secretRow?.refresh_token ?? null,
              expires_at: c.expires_at ?? secretRow?.expires_at ?? null,
              meta: c.meta ?? secretRow?.meta ?? {},
            };
            console.log(`[unified-orders:${cid}] Tokens obtidos de secret_enc (legado)`);
            break;
          }
        }
      } catch (e) {
        console.warn(`[unified-orders:${cid}] Falha ao interpretar secret_enc legado`, e);
      }
    }

    // Backfill: se tokens foram recuperados via get-secret/secret_enc e os campos em claro estão vazios, persistir
    try {
      if (resolvedSecrets?.access_token && (!secretRow?.access_token || !secretRow?.refresh_token)) {
        const { error: bfErr } = await sb
          .from('integration_secrets')
          .update({
            access_token: resolvedSecrets.access_token,
            refresh_token: resolvedSecrets.refresh_token ?? null,
            expires_at: resolvedSecrets.expires_at ?? null,
            updated_at: new Date().toISOString()
          })
          .eq('integration_account_id', integration_account_id)
          .eq('provider', 'mercadolivre');
        if (bfErr) console.warn(`[unified-orders:${cid}] Backfill tokens falhou`, bfErr);
        else console.log(`[unified-orders:${cid}] Backfill tokens OK`);
      }
    } catch (e) {
      console.warn(`[unified-orders:${cid}] Backfill tokens exception`, e);
    }

    if (!resolvedSecrets?.access_token) {
      console.error(`[unified-orders:${cid}] Token ausente mesmo após fallbacks`, { hasRow: !!secretRow });
      return fail('Segredos não encontrados para a conta - reconecte a integração', 404, null, cid);
    }

    const secretsWithAccountId = { ...resolvedSecrets, account_id: integration_account_id };
    // 3) Garantir token válido
    const validSecrets = await refreshIfNeeded(sb, secretsWithAccountId, cid, authHeader);
    const accessToken = validSecrets.access_token as string;

    // 4) Montar URL do ML
    const sellerFromAccount = account.account_identifier ? String(account.account_identifier) : "";
    const sellerFromSecrets = validSecrets.meta?.user_id
      ? String(validSecrets.meta?.user_id)
      : "";
    const effectiveSeller = seller_id
      ? String(seller_id)
      : sellerFromAccount || sellerFromSecrets;
    if (!effectiveSeller || !/^\d+$/.test(effectiveSeller)) {
      return fail(
        "Seller ID not found (account_identifier/payload)",
        400,
        { sellerFromAccount, sellerFromSecrets, seller_id },
        cid
      );
    }

    const tzOffset = Deno.env.get("ML_TZ_OFFSET") || "-03:00";
    const toOffsetDate = (d?: string, endOfDay = false) => {
      if (!d) return undefined;
      if (/T/.test(d)) return d;
      return `${d}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}${tzOffset}`;
    };
    let fromISO = toOffsetDate(String(date_from || ""));
    let toISO = toOffsetDate(String(date_to || ""), true);
    if (fromISO && toISO) {
      const fromTime = Date.parse(fromISO);
      const toTime = Date.parse(toISO);
      if (!isNaN(fromTime) && !isNaN(toTime) && fromTime > toTime) {
        const tmp = fromISO;
        fromISO = toISO;
        toISO = tmp;
      }
    }

    console.log(
      `[unified-orders:${cid}] date filters normalized (offset ${tzOffset}):`,
      { date_from, date_to, fromISO, toISO }
    );

    const mlUrl = new URL("https://api.mercadolibre.com/orders/search");
    mlUrl.searchParams.set("seller", effectiveSeller);
    const allowedStatuses = new Set([
      "confirmed",
      "payment_required",
      "payment_in_process",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
      "invalid",
    ]);
    if (status && allowedStatuses.has(String(status))) {
      mlUrl.searchParams.set("order.status", String(status));
    }
    if (fromISO) mlUrl.searchParams.set("order.date_created.from", fromISO);
    if (toISO) mlUrl.searchParams.set("order.date_created.to", toISO);
    mlUrl.searchParams.set("limit", String(limit));
    mlUrl.searchParams.set("offset", String(offset));
    console.log(`[unified-orders:${cid}] url`, mlUrl.toString());

    const mlResp = await fetch(mlUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const mlRaw = await mlResp.text();
    if (!mlResp.ok) {
      if (mlResp.status === 403 && mlRaw.includes("invalid_operator_user_id")) {
        return fail(
          "invalid_operator_user_id - reconecte com a conta ADMIN da loja no ML",
          403,
          mlRaw,
          cid
        );
      }
      return fail(`Mercado Livre API error: ${mlResp.status}`, mlResp.status, mlRaw, cid);
    }

    const json = JSON.parse(mlRaw);
    const enrichedOrders = await enrichOrdersWithShipping(json.results ?? [], accessToken, cid);

    // Filtro shipping_status
    let filteredOrders = enrichedOrders;
    if (shipping_status) {
      const targetStatuses = Array.isArray(shipping_status) ? shipping_status : [shipping_status];
      filteredOrders = enrichedOrders.filter((order: any) => {
        const s = order.shipping?.status || "";
        return targetStatuses.some((t) => s.toLowerCase() === String(t).toLowerCase());
      });
      console.log(
        `[unified-orders:${cid}] Filtered by shipping_status: ${enrichedOrders.length} -> ${filteredOrders.length}`
      );
    }

    // Busca textual
    if (search || q) {
      const searchTerm = (search || q || "").toLowerCase();
      filteredOrders = filteredOrders.filter((order: any) => {
        const searchable = [
          order.id,
          order.buyer?.first_name,
          order.buyer?.last_name,
          order.buyer?.nickname,
          order.buyer?.identification?.number,
          (order.order_items || []).map((it: any) => it.item?.title).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(searchTerm);
      });
      console.log(
        `[unified-orders:${cid}] Filtered by search "${searchTerm}": ${filteredOrders.length} orders`
      );
    }

    // Valor
    if (valorMin !== undefined || valorMax !== undefined) {
      filteredOrders = filteredOrders.filter((order: any) => {
        const v = Number(order.total_amount || 0);
        if (valorMin !== undefined && v < valorMin) return false;
        if (valorMax !== undefined && v > valorMax) return false;
        return true;
      });
      console.log(
        `[unified-orders:${cid}] Filtered by value range [${valorMin}, ${valorMax}]: ${filteredOrders.length} orders`
      );
    }

    // Localização
    if (cidade || uf) {
      filteredOrders = filteredOrders.filter((order: any) => {
        const destCity = order.shipping?.destination?.shipping_address?.city?.name || "";
        const destState = order.shipping?.destination?.shipping_address?.state?.name || "";
        if (cidade && !destCity.toLowerCase().includes(String(cidade).toLowerCase())) return false;
        if (uf && destState !== uf) return false;
        return true;
      });
      console.log(
        `[unified-orders:${cid}] Filtered by location (cidade: ${cidade}, uf: ${uf}): ${filteredOrders.length} orders`
      );
    }

    const serverTotal = Number(json?.paging?.total ?? json?.paging?.count ?? filteredOrders.length);
    return ok({
      results: filteredOrders,
      unified: transformMLOrders(filteredOrders, integration_account_id),
      paging: { ...json.paging, total: serverTotal, limit, offset },
      total: serverTotal,
      count: filteredOrders.length,
      has_more: offset + limit < serverTotal,
      correlation_id: cid,
      server_filtering_applied: Boolean(shipping_status),
    });
  } catch (err: any) {
    console.error(`[unified-orders:${cid}]`, err);
    return fail(err?.message ?? "Internal server error", 500, String(err), cid);
  }
});

// Helpers
async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  const out: any[] = [];
  for (const order of orders) {
    try {
      const enriched: any = { ...order };
      const shipId = order?.shipping?.id;
      if (shipId) {
        const url = `https://api.mercadolibre.com/shipments/${shipId}`;
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (resp.ok) {
          const ship = await resp.json();
          enriched.shipping = {
            ...order.shipping,
            status: ship.status,
            substatus: ship.substatus,
            destination: ship.destination,
          };
        }
      }
      out.push(enriched);
    } catch (e) {
      console.warn(`[unified-orders:${cid}] enrich shipping failed`, e);
      out.push(order);
    }
  }
  return out;
}

function transformMLOrders(orders: any[], integration_account_id: string) {
  return orders.map((o: any) => ({
    id: String(o.id),
    numero: String(o.id),
    nome_cliente: o?.buyer?.first_name || null,
    cpf_cnpj: o?.buyer?.identification?.number || null,
    data_pedido: o?.date_created || null,
    data_prevista: null,
    situacao: o?.status || null,
    valor_total: Number(o?.total_amount ?? 0),
    valor_frete: null,
    valor_desconto: null,
    numero_ecommerce: String(o.id),
    numero_venda: null,
    empresa: 'Mercado Livre',
    cidade: o?.shipping?.destination?.shipping_address?.city?.name || null,
    uf: o?.shipping?.destination?.shipping_address?.state?.name || null,
    codigo_rastreamento: o?.shipping?.tracking_number || null,
    url_rastreamento: null,
    obs: null,
    obs_interna: null,
    integration_account_id,
    created_at: o?.date_created || null,
    updated_at: o?.last_updated || null,
  }));
}
