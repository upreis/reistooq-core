import { corsHeaders, makeClient, fail, ok } from "../_shared/client.ts";

interface GetOrderRequest {
  integration_account_id: string;
  order_id: string;
  include_shipping?: boolean;
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail("Method not allowed", 405);
  }

  const cid = Math.random().toString(36).substring(2, 10);
  console.log(`[ml-get-order:${cid}] Request started`);

  try {
    const body = await req.json() as GetOrderRequest;
    const { integration_account_id, order_id, include_shipping = false } = body;

    if (!integration_account_id || !order_id) {
      return fail("integration_account_id and order_id are required", 400);
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = makeClient(authHeader);

    // Get integration account and secrets
    console.log(`[ml-get-order:${cid}] Getting integration account: ${integration_account_id}`);
    const { data: account } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .single();

    if (!account) {
      return fail("Integration account not found", 404);
    }

    // Get ML secrets
    const { data: secrets } = await supabase
      .rpc('get_integration_secret_secure', {
        account_id: integration_account_id,
        provider_name: 'mercadolivre',
        requesting_function: 'ml-get-order'
      });

    if (!secrets?.access_token) {
      return fail("MercadoLivre access token not found", 401);
    }

    console.log(`[ml-get-order:${cid}] Fetching order ${order_id} from MercadoLivre API`);

    // Fetch individual order from MercadoLivre
    const mlUrl = `https://api.mercadolibre.com/orders/${order_id}`;
    console.log(`[ml-get-order:${cid}] URL: ${mlUrl}`);

    const mlResponse = await fetch(mlUrl, {
      headers: {
        'Authorization': `Bearer ${secrets.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`[ml-get-order:${cid}] ML API error:`, {
        status: mlResponse.status,
        statusText: mlResponse.statusText,
        body: errorText
      });
      return fail(`MercadoLivre API error: ${mlResponse.status} ${mlResponse.statusText}`, mlResponse.status);
    }

    const mlOrder = await mlResponse.json();
    console.log(`[ml-get-order:${cid}] Order fetched successfully. ID: ${mlOrder.id}, Status: ${mlOrder.status}`);

    // Optionally enrich with shipping data
    let enrichedOrder = mlOrder;
    if (include_shipping && mlOrder.shipping?.id) {
      try {
        console.log(`[ml-get-order:${cid}] Fetching shipping data for shipment ${mlOrder.shipping.id}`);
        const shippingUrl = `https://api.mercadolibre.com/shipments/${mlOrder.shipping.id}`;
        const shippingResponse = await fetch(shippingUrl, {
          headers: {
            'Authorization': `Bearer ${secrets.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json();
          enrichedOrder = {
            ...mlOrder,
            shipping_detail: shippingData
          };
          console.log(`[ml-get-order:${cid}] Shipping data enriched successfully`);
        } else {
          console.warn(`[ml-get-order:${cid}] Failed to fetch shipping data: ${shippingResponse.status}`);
        }
      } catch (shippingError) {
        console.warn(`[ml-get-order:${cid}] Error fetching shipping data:`, shippingError);
      }
    }

    // Transform the ML order to match our internal structure
    const transformedOrder = transformMLOrder(enrichedOrder, integration_account_id);

    console.log(`[ml-get-order:${cid}] Order transformation completed`);
    return ok({
      order: transformedOrder,
      raw_order: enrichedOrder,
      account_id: integration_account_id
    });

  } catch (error) {
    console.error(`[ml-get-order:${cid}] Error:`, error);
    return fail(`Internal server error: ${error.message}`, 500);
  }
}

function transformMLOrder(mlOrder: any, integrationAccountId: string) {
  const now = new Date().toISOString();
  
  // Calculate discount from order items
  let totalDiscount = 0;
  if (mlOrder.order_items) {
    mlOrder.order_items.forEach((item: any) => {
      const itemDiscount = (item.full_unit_price - item.unit_price) * item.quantity;
      totalDiscount += Math.max(0, itemDiscount);
    });
  }

  // Build customer name with fallback
  const customerName = mlOrder.buyer?.nickname || `Cliente ML ${mlOrder.buyer?.id || 'N/A'}`;
  
  // Build internal notes with ML-specific info
  const internalNotes = [
    `ML Order ID: ${mlOrder.id}`,
    `Pack ID: ${mlOrder.pack_id || 'N/A'}`,
    `Buyer ID: ${mlOrder.buyer?.id || 'N/A'}`,
    `Currency: ${mlOrder.currency_id}`,
    `Buying Mode: ${mlOrder.buying_mode || 'N/A'}`,
    mlOrder.status_detail ? `Status Detail: ${mlOrder.status_detail}` : null,
    mlOrder.tags?.length ? `Tags: ${mlOrder.tags.join(', ')}` : null,
  ].filter(Boolean).join(' | ');

  // Extract shipping info
  const shippingInfo = mlOrder.shipping_detail || mlOrder.shipping || {};
  
  return {
    id: `ml_${mlOrder.id}`,
    numero: `ML-${mlOrder.id}`,
    nome_cliente: customerName,
    cpf_cnpj: null, // ML doesn't provide CPF/CNPJ in basic order data
    data_pedido: mlOrder.date_created?.split('T')[0] || new Date().toISOString().split('T')[0],
    data_prevista: mlOrder.date_closed?.split('T')[0] || null,
    situacao: mapMLStatus(mlOrder.status),
    valor_total: mlOrder.total_amount || 0,
    valor_frete: mlOrder.shipping_cost || 0,
    valor_desconto: totalDiscount,
    numero_ecommerce: mlOrder.id?.toString(),
    numero_venda: mlOrder.id?.toString(),
    empresa: 'mercadolivre',
    cidade: shippingInfo.receiver_address?.city?.name || null,
    uf: shippingInfo.receiver_address?.state?.name || null,
    codigo_rastreamento: shippingInfo.tracking_number || null,
    url_rastreamento: null, // ML doesn't provide direct tracking URLs
    obs: mlOrder.status_detail || null,
    obs_interna: internalNotes,
    integration_account_id: integrationAccountId,
    created_at: mlOrder.date_created || now,
    updated_at: mlOrder.last_updated || now,
    
    // Additional ML-specific fields
    date_created: mlOrder.date_created,
    date_closed: mlOrder.date_closed,
    last_updated: mlOrder.last_updated,
    pack_id: mlOrder.pack_id,
    fulfilled: mlOrder.fulfilled,
    buying_mode: mlOrder.buying_mode,
    shipping_cost: mlOrder.shipping_cost,
    mediations: mlOrder.mediations,
    paid_amount: mlOrder.paid_amount,
    order_items: mlOrder.order_items,
    currency_id: mlOrder.currency_id,
    payments: mlOrder.payments,
    shipping: mlOrder.shipping,
    status_detail: mlOrder.status_detail,
    tags: mlOrder.tags,
    feedback: mlOrder.feedback,
    context: mlOrder.context,
    buyer: mlOrder.buyer,
    seller: mlOrder.seller,
    taxes: mlOrder.taxes,
    cancel_detail: mlOrder.cancel_detail,
    manufacturing_ending_date: mlOrder.manufacturing_ending_date,
    order_request: mlOrder.order_request,
    
    // Enriched shipping data if available
    shipping_detail: mlOrder.shipping_detail
  };
}

function mapMLStatus(mlStatus: string): string {
  const statusMap: Record<string, string> = {
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento', 
    'payment_in_process': 'Processando Pagamento',
    'paid': 'Pago',
    'partially_paid': 'Parcialmente Pago',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'invalid': 'Inválido',
    'not_processed': 'Não Processado',
  };
  
  return statusMap[mlStatus] || 'Pendente';
}