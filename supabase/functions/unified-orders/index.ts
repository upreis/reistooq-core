import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, ENC_KEY, ok, fail, corsHeaders } from "../_shared/client.ts";

interface UnifiedOrdersRequest {
  search?: string;
  startDate?: string;
  endDate?: string;
  situacoes?: string[];
  fonte?: 'interno' | 'mercadolivre' | 'shopee' | 'tiny';
  limit?: number;
  offset?: number;
}

interface MLOrder {
  id: number;
  date_created: string;
  date_closed?: string;
  last_updated: string;
  status: string;
  status_detail?: string;
  currency_id: string;
  total_amount: number;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  shipping?: {
    id: number;
    status: string;
    tracking_number?: string;
    tracking_method?: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
      variation_id?: number;
    };
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  payments?: Array<{
    id: number;
    status: string;
    transaction_amount: number;
    payment_method_id: string;
  }>;
}

interface UnifiedOrder {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  data_pedido: string;
  data_prevista: string | null;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string | null;
  numero_venda: string | null;
  empresa: string | null;
  cidade: string | null;
  uf: string | null;
  codigo_rastreamento: string | null;
  url_rastreamento: string | null;
  obs: string | null;
  obs_interna: string | null;
  integration_account_id: string | null;
  created_at: string;
  updated_at: string;
}

// Map ML status to internal status
function mapMLStatus(mlStatus: string): string {
  const statusMap: Record<string, string> = {
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando Pagamento',
    'paid': 'Pago',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'invalid': 'Inválido',
  };
  return statusMap[mlStatus] || 'Pendente';
}

// Map ML order to unified order format
function mapMLOrderToUnified(mlOrder: MLOrder, accountId: string): UnifiedOrder {
  const now = new Date().toISOString();
  
  return {
    id: `ml_${mlOrder.id}`,
    numero: mlOrder.id.toString(),
    nome_cliente: mlOrder.buyer.nickname || 'Cliente ML',
    cpf_cnpj: null, // ML doesn't provide this in basic order data
    data_pedido: mlOrder.date_created,
    data_prevista: mlOrder.date_closed || null,
    situacao: mapMLStatus(mlOrder.status),
    valor_total: mlOrder.total_amount,
    valor_frete: 0, // Could be calculated from shipping info if needed
    valor_desconto: 0, // Could be calculated from price differences
    numero_ecommerce: mlOrder.id.toString(),
    numero_venda: mlOrder.id.toString(),
    empresa: 'mercadolivre',
    cidade: null, // Would need to fetch from shipping details
    uf: null, // Would need to fetch from shipping details
    codigo_rastreamento: mlOrder.shipping?.tracking_number || null,
    url_rastreamento: null, // ML doesn't provide direct tracking URL
    obs: mlOrder.status_detail || null,
    obs_interna: `ML Order ID: ${mlOrder.id}, Buyer: ${mlOrder.buyer.nickname}`,
    integration_account_id: accountId,
    created_at: mlOrder.date_created,
    updated_at: mlOrder.last_updated,
  };
}

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
    const body: UnifiedOrdersRequest = await req.json();
    
    console.log('[Unified Orders] Request received:', body);

    let allOrders: UnifiedOrder[] = [];

    // 1. Get internal orders (if no source filter or source is interno)
    if (!body.fonte || body.fonte === 'interno') {
      try {
        console.log('[Unified Orders] Fetching internal orders...');
        
        const { data: internalOrders, error: internalError } = await supabase.rpc('get_pedidos_masked', {
          _search: body.search || null,
          _start: body.startDate || null,
          _end: body.endDate || null,
          _limit: body.limite || 100,
          _offset: body.offset || 0,
        });

        if (internalError) {
          console.error('[Unified Orders] Internal orders error:', internalError);
        } else {
          console.log('[Unified Orders] Found', internalOrders?.length || 0, 'internal orders');
          allOrders.push(...(internalOrders || []));
        }
      } catch (error) {
        console.error('[Unified Orders] Internal orders exception:', error);
      }
    }

    // 2. Get MercadoLibre orders (if no source filter or source is mercadolivre)
    if (!body.fonte || body.fonte === 'mercadolivre') {
      try {
        console.log('[Unified Orders] Fetching ML orders...');

        // Get all active ML integration accounts
        const { data: mlAccounts, error: accountsError } = await supabase
          .from('integration_accounts')
          .select('id, name, account_identifier')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true);

        if (accountsError) {
          console.error('[Unified Orders] ML accounts error:', accountsError);
        } else if (mlAccounts && mlAccounts.length > 0) {
          console.log('[Unified Orders] Found', mlAccounts.length, 'ML accounts');

          // Fetch orders from each ML account
          for (const account of mlAccounts) {
            try {
              const mlOrdersResponse = await supabase.functions.invoke('rapid-responder', {
                body: {
                  integration_account_id: account.id,
                  date_from: body.startDate,
                  date_to: body.endDate,
                  limit: 50, // Reasonable limit per account
                }
              });

              if (mlOrdersResponse.error) {
                console.error(`[Unified Orders] ML orders error for account ${account.id}:`, mlOrdersResponse.error);
                continue;
              }

              const mlData = mlOrdersResponse.data;
              if (mlData.ok && mlData.orders) {
                const mappedOrders = mlData.orders.map((mlOrder: MLOrder) => 
                  mapMLOrderToUnified(mlOrder, account.id)
                );

                // Apply search filter to ML orders if specified
                let filteredMLOrders = mappedOrders;
                if (body.search) {
                  const searchLower = body.search.toLowerCase();
                  filteredMLOrders = mappedOrders.filter((order: UnifiedOrder) =>
                    order.numero.toLowerCase().includes(searchLower) ||
                    order.nome_cliente.toLowerCase().includes(searchLower) ||
                    order.numero_ecommerce?.toLowerCase().includes(searchLower)
                  );
                }

                // Apply status filter if specified
                if (body.situacoes && body.situacoes.length > 0) {
                  filteredMLOrders = filteredMLOrders.filter((order: UnifiedOrder) =>
                    body.situacoes!.includes(order.situacao)
                  );
                }

                allOrders.push(...filteredMLOrders);
                console.log(`[Unified Orders] Added ${filteredMLOrders.length} orders from ML account ${account.name}`);
              }
            } catch (error) {
              console.error(`[Unified Orders] Exception fetching ML orders for account ${account.id}:`, error);
            }
          }
        } else {
          console.log('[Unified Orders] No active ML accounts found');
        }
      } catch (error) {
        console.error('[Unified Orders] ML orders exception:', error);
      }
    }

    // 3. Sort all orders by date (newest first)
    allOrders.sort((a, b) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime());

    // 4. Apply pagination to combined results
    const offset = body.offset || 0;
    const limit = body.limit || 100;
    const paginatedOrders = allOrders.slice(offset, offset + limit);

    console.log('[Unified Orders] Returning', paginatedOrders.length, 'of', allOrders.length, 'total orders');

    return ok({
      data: paginatedOrders,
      count: allOrders.length,
    });

  } catch (error) {
    console.error('[Unified Orders] Unexpected error:', error);
    return fail(String(error?.message ?? error), 500);
  }
});