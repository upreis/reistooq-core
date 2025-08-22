// supabase/functions/unified-orders/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY") || "";

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // sem Authorization
  return createClient(url, key);
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

async function refreshIfNeeded(sb: ReturnType<typeof serviceClient>, secrets: any, cid: string) {
  const safetyMs = 5 * 60 * 1000; // 5min de margem
  const now = Date.now();
  const exp = secrets?.expires_at ? new Date(secrets.expires_at).getTime() : 0;
  if (secrets?.access_token && exp > now + safetyMs) return secrets; // ainda válido

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

  // persiste de volta
  const { error: upErr } = await sb.from('integration_secrets').upsert({
    integration_account_id: secrets.account_id,
    provider: 'mercadolivre',
    access_token: data.access_token,
    refresh_token: data.refresh_token || secrets.refresh_token,
    expires_at: newExpiresAt,
    meta: secrets.meta ?? {},
    updated_at: new Date().toISOString()
  }, { onConflict: 'integration_account_id,provider' });
  if (upErr) {
    console.error(`[unified-orders:${cid}] Falha ao salvar novos tokens`, upErr);
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
    const reqHeaders = req.headers.get("Access-Control-Request-Headers") ?? "authorization, x-client-info, apikey, content-type";
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Access-Control-Allow-Headers": reqHeaders } });
  }
  if (req.method !== "POST") return fail("Method Not Allowed", 405);

  const cid = crypto.randomUUID().slice(0, 8);
  try {
    if (!ENC_KEY) return fail("Encryption key not configured (APP_ENCRYPTION_KEY)", 500, null, cid);

    // opcional: ainda exigimos Authorization do usuário para disciplina de uso,
    // mas NÃO vamos usá-lo nos acessos ao banco (service role cuidará disso).
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) return fail("Missing Authorization header", 401, null, cid);

    const body = await req.json();
    const { integration_account_id, status, limit = 50, offset = 0 } = body || {};
    if (!integration_account_id) return fail("integration_account_id é obrigatório", 400, null, cid);

    const sb = serviceClient();

    // 1) Conta
    const { data: account, error: accErr } = await sb
      .from("integration_accounts")
      .select("*")
      .eq("id", integration_account_id)
      .maybeSingle();

    if (accErr || !account) return fail("Integration account not found", 404, accErr, cid);
    if (!account.is_active) return fail("Integration account is not active", 400, null, cid);
    if (account.provider !== "mercadolivre") {
      return ok({ results: [], unified: [], paging: { total: 0, limit, offset }, count: 0 });
    }

    // 2) Segredos
    const { data: secrets, error: secErr } = await sb
      .from('integration_secrets')
      .select('access_token, refresh_token, expires_at, meta')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secErr || !secrets?.access_token) return fail("Segredos não encontrados", 404, secErr, cid);

    // anexa account_id para o refresh salvar
    const secretsWithAccountId = { ...secrets, account_id: integration_account_id };

    // 3) Garantir token válido
    const validSecrets = await refreshIfNeeded(sb, secretsWithAccountId, cid);
    const accessToken = validSecrets.access_token as string;

    // 4) Chamada ML Orders
    const sellerId = String(account.account_identifier || validSecrets.meta?.user_id);
    if (!sellerId) return fail("Seller ID not found (account_identifier/payload)", 400, null, cid);

    const mlUrl = new URL("https://api.mercadolibre.com/orders/search");
    mlUrl.searchParams.set("seller", sellerId);
    if (status) mlUrl.searchParams.set("order.status", status);
    mlUrl.searchParams.set("limit", String(limit));
    mlUrl.searchParams.set("offset", String(offset));

    const mlResp = await fetch(mlUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });

    const mlRaw = await mlResp.text();
    if (!mlResp.ok) {
      if (mlResp.status === 403 && mlRaw.includes("invalid_operator_user_id")) {
        return fail("invalid_operator_user_id - reconecte com a conta ADMIN da loja no ML", 403, mlRaw, cid);
      }
      return fail(`Mercado Livre API error: ${mlResp.status}`, mlResp.status, mlRaw, cid);
    }

    const json = JSON.parse(mlRaw);
    
    // 5) Buscar detalhes de shipping para cada pedido
    const enrichedOrders = await enrichOrdersWithShipping(json.results ?? [], accessToken, cid);
    
    return ok({
      results: enrichedOrders,
      unified: transformMLOrders(enrichedOrders, integration_account_id),
      paging: json.paging,
      count: json.paging?.total ?? 0,
      correlation_id: cid,
    });
  } catch (err: any) {
    console.error(`[unified-orders:${cid}]`, err);
    return fail(err?.message ?? "Internal server error", 500, String(err), cid);
  }
});

// ------ helpers ------

// Função para buscar detalhes de shipping e informações adicionais dos pedidos
async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  const enrichedOrders = [];
  
  for (const order of orders) {
    try {
      let enrichedOrder = { ...order };
      
      // Buscar detalhes dos itens para obter títulos dos anúncios
      if (order.order_items && order.order_items.length > 0) {
        const itemDetails = [];
        for (const orderItem of order.order_items) {
          if (orderItem.item?.id) {
            try {
              const itemUrl = `https://api.mercadolibre.com/items/${orderItem.item.id}`;
              const itemResp = await fetch(itemUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              
              if (itemResp.ok) {
                const itemData = await itemResp.json();
                itemDetails.push({
                  ...orderItem,
                  item_details: {
                    title: itemData.title,
                    permalink: itemData.permalink,
                    pictures: itemData.pictures,
                    price: itemData.price,
                    available_quantity: itemData.available_quantity
                  }
                });
              } else {
                itemDetails.push(orderItem);
              }
            } catch (err) {
              console.log(`[unified-orders:${cid}] Error fetching item ${orderItem.item.id}:`, err);
              itemDetails.push(orderItem);
            }
          } else {
            itemDetails.push(orderItem);
          }
        }
        enrichedOrder.order_items = itemDetails;
      }
      
      // Se tem shipping ID, buscar detalhes completos
      if (order.shipping?.id) {
        const shippingUrl = `https://api.mercadolibre.com/shipments/${order.shipping.id}`;
        const shippingResp = await fetch(shippingUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (shippingResp.ok) {
          const shippingData = await shippingResp.json();
          
          // Enriquecer com dados completos de shipping
          enrichedOrder.shipping = {
            ...order.shipping,
            receiver_address: shippingData.receiver_address,
            tracking_number: shippingData.tracking_number,
            tracking_url: shippingData.tracking_url,
            status: shippingData.status,
            status_detail: shippingData.status_detail,
            substatus: shippingData.substatus,
            shipping_option: shippingData.shipping_option,
            date_shipped: shippingData.date_shipped,
            date_delivered: shippingData.date_delivered,
            estimated_delivery_time: shippingData.estimated_delivery_time,
            estimated_delivery_extended: shippingData.estimated_delivery_extended,
            estimated_handling_limit: shippingData.estimated_handling_limit,
            cost: shippingData.cost,
            logistic_type: shippingData.logistic_type
          };
          
          console.log(`[unified-orders:${cid}] Enriched shipping for order ${order.id}`);
        } else {
          console.log(`[unified-orders:${cid}] Failed to fetch shipping ${order.shipping.id}: ${shippingResp.status}`);
        }
      }
      
      // Buscar informações do comprador se necessário
      if (order.buyer?.id && !order.buyer.nickname) {
        try {
          const buyerUrl = `https://api.mercadolibre.com/users/${order.buyer.id}`;
          const buyerResp = await fetch(buyerUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (buyerResp.ok) {
            const buyerData = await buyerResp.json();
            enrichedOrder.buyer = {
              ...order.buyer,
              nickname: buyerData.nickname,
              first_name: buyerData.first_name,
              last_name: buyerData.last_name,
              email: buyerData.email,
              user_type: buyerData.user_type
            };
          }
        } catch (err) {
          console.log(`[unified-orders:${cid}] Error fetching buyer ${order.buyer.id}:`, err);
        }
      }
      
      enrichedOrders.push(enrichedOrder);
    } catch (err) {
      console.error(`[unified-orders:${cid}] Error enriching order ${order.id}:`, err);
      enrichedOrders.push(order); // Fallback para order original
    }
  }
  
  return enrichedOrders;
}

function transformMLOrders(mlOrders: any[], integrationAccountId: string) {
  return (mlOrders ?? []).map((order) => {
    // Calcular frete: primeiro tentar payments[].shipping_cost, depois shipping.cost
    const shippingCost = order.payments?.[0]?.shipping_cost || order.shipping?.cost || 0;
    
    // Extrair SKUs dos itens para observações
    const orderItems = order.order_items || [];
    const skuList = orderItems.map((item: any) => 
      item.item?.seller_sku || item.item?.seller_custom_field || item.item?.title?.substring(0, 30)
    ).filter(Boolean);
    
    // Calcular desconto: diferença entre full_unit_price e unit_price
    let valorDesconto = 0;
    orderItems.forEach((item: any) => {
      if (item.full_unit_price && item.unit_price) {
        valorDesconto += (item.full_unit_price - item.unit_price) * item.quantity;
      }
    });
    
    // Calcular quantidade total de itens comprados
    const quantidadeTotalItens = orderItems.reduce((total: number, item: any) => {
      return total + (item.quantity || 0);
    }, 0);
    
    // Extrair cidade e estado do endereço de entrega
    const cidade = order.shipping?.receiver_address?.city?.name || "";
    const uf = order.shipping?.receiver_address?.state?.name || "";
    const codigoRastreamento = order.shipping?.tracking_number || "";
    const urlRastreamento = order.shipping?.tracking_url || "";
    
    // Status detalhado do pedido combinando order status + shipping status + descrições específicas
    const statusDetalhado = mapDetailedStatus(order.status, order.shipping?.status, order.status_detail);
    const statusDescricao = getStatusDescription(order.shipping);
    
    // Extrair títulos dos anúncios
    const titulosAnuncios = orderItems.map((item: any) => 
      item.item_details?.title || item.item?.title || "Produto sem título"
    );
    
    // Calcular valores financeiros detalhados
    const receitaProdutos = orderItems.reduce((total: number, item: any) => {
      return total + (item.unit_price * item.quantity);
    }, 0);
    
    const tarifaVenda = orderItems.reduce((total: number, item: any) => {
      return total + (item.sale_fee || 0);
    }, 0);
    
    const receitaEnvio = order.shipping?.cost || 0;
    const tarifaEnvio = order.payments?.[0]?.shipping_cost || 0;
    const totalReceita = receitaProdutos + receitaEnvio - tarifaVenda - tarifaEnvio;
    
    // Forma de entrega
    const formaEntrega = order.shipping?.shipping_option?.name || order.shipping?.logistic_type || "Não informado";
    
    // Datas específicas
    const dataACaminho = order.shipping?.date_shipped || null;
    const dataEntrega = order.shipping?.date_delivered || null;
    
    return {
      id: `ml_${order.id}`,
      numero: `ML-${order.id}`,
      nome_cliente: order.buyer?.nickname || order.buyer?.first_name || `Cliente ML ${order.buyer?.id}`,
      cpf_cnpj: null, // Requer chamada para /users/{buyer.id}
      data_pedido: order.date_created?.split("T")[0] || null,
      data_prevista: order.date_closed?.split("T")[0] || null,
      situacao: statusDetalhado,
      valor_total: order.total_amount || 0,
      valor_frete: shippingCost,
      valor_desconto: Math.max(0, valorDesconto),
      numero_ecommerce: String(order.id),
      numero_venda: String(order.id),
      empresa: "mercadolivre",
      cidade,
      uf,
      codigo_rastreamento: codigoRastreamento,
      url_rastreamento: urlRastreamento,
      obs: skuList.length > 0 ? `SKUs: ${skuList.join(", ")}` : order.status_detail,
      obs_interna: `ML Order ID: ${order.id} | Buyer ID: ${order.buyer?.id} | ${order.currency_id} | Qtd Total: ${quantidadeTotalItens}`,
      integration_account_id: integrationAccountId,
      created_at: order.date_created,
      updated_at: order.last_updated || order.date_created,
      quantidade_itens: quantidadeTotalItens,
      status_original: order.status,
      status_shipping: order.shipping?.status || null,
      
      // Novos campos detalhados
      status_descricao: statusDescricao,
      titulos_anuncios: titulosAnuncios.join(" | "),
      receita_produtos: receitaProdutos,
      tarifa_venda: tarifaVenda,
      receita_envio: receitaEnvio,
      tarifa_envio: tarifaEnvio,
      total_receita: totalReceita,
      forma_entrega: formaEntrega,
      data_a_caminho: dataACaminho,
      data_entrega: dataEntrega,
      comprador_completo: `${order.buyer?.first_name || ''} ${order.buyer?.last_name || ''}`.trim() || order.buyer?.nickname || `Cliente ML ${order.buyer?.id}`
    };
  });
}

function mapMLStatus(status: string): string {
  const statusMap: Record<string, string> = {
    confirmed: "Confirmado",
    payment_required: "Aguardando Pagamento",
    payment_in_process: "Pagamento em Processamento",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
    invalid: "Inválido",
  };
  return statusMap[status] || status;
}

// Função para mapear status detalhado combinando order status + shipping status
function mapDetailedStatus(orderStatus: string, shippingStatus?: string, statusDetail?: string): string {
  // Status de pedido + shipping para dar contexto completo
  const baseStatus = mapMLStatus(orderStatus);
  
  if (!shippingStatus) return baseStatus;
  
  const shippingMap: Record<string, string> = {
    pending: "Pendente de Envio",
    handling: "Preparando para Envio",
    ready_to_ship: "Pronto para Envio",
    shipped: "A Caminho",
    delivered: "Entregue",
    not_delivered: "Não Entregue",
    cancelled: "Envio Cancelado",
    returned: "Devolvido",
    lost: "Extraviado"
  };
  
  const mappedShipping = shippingMap[shippingStatus] || shippingStatus;
  
  // Combinar status do pedido com status de envio
  if (orderStatus === 'paid' && shippingStatus) {
    return `Pago - ${mappedShipping}`;
  }
  
  return `${baseStatus}${mappedShipping ? ` - ${mappedShipping}` : ''}`;
}

// Função para obter descrição detalhada do status de entrega
function getStatusDescription(shipping?: any): string {
  if (!shipping) return "";
  
  const status = shipping.status;
  const substatus = shipping.substatus;
  const estimatedDelivery = shipping.estimated_delivery_time;
  const estimatedHandling = shipping.estimated_handling_limit;
  
  // Mensagens específicas baseadas no status e substatus
  if (status === "ready_to_ship" && estimatedHandling) {
    const handlingDate = new Date(estimatedHandling.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (handlingDate.toDateString() === tomorrow.toDateString()) {
      return "Você deve dar o pacote ao seu motorista amanhã";
    }
    return `Você deve dar o pacote ao seu motorista até ${handlingDate.toLocaleDateString('pt-BR')}`;
  }
  
  if (status === "shipped" && estimatedDelivery) {
    const deliveryFrom = new Date(estimatedDelivery.date);
    const deliveryTo = new Date(estimatedDelivery.date);
    
    if (estimatedDelivery.time_from && estimatedDelivery.time_to) {
      deliveryFrom.setHours(parseInt(estimatedDelivery.time_from.split(":")[0]));
      deliveryTo.setHours(parseInt(estimatedDelivery.time_to.split(":")[0]));
      
      return `Chega entre ${deliveryFrom.toLocaleDateString('pt-BR')} e ${deliveryTo.toLocaleDateString('pt-BR')}`;
    }
    
    return `Previsão de entrega: ${deliveryFrom.toLocaleDateString('pt-BR')}`;
  }
  
  if (status === "delivered") {
    return "Produto entregue com sucesso";
  }
  
  if (status === "not_delivered") {
    return "Não foi possível entregar o produto";
  }
  
  if (status === "cancelled") {
    return "Envio cancelado";
  }
  
  if (status === "returned") {
    return "Produto devolvido";
  }
  
  if (status === "lost") {
    return "Produto extraviado durante o transporte";
  }
  
  // Status específicos do substatus
  if (substatus === "stale") {
    return "Aguardando atualização do status";
  }
  
  if (substatus === "delayed") {
    return "Entrega atrasada";
  }
  
  return shipping.status_detail || "";
}