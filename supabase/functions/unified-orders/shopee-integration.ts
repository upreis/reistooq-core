import { makeServiceClient, makeClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";

/**
 * 🛍️ SHOPEE INTEGRATION V2 - API REAL IMPLEMENTADA
 * Módulo completamente isolado para Shopee - NÃO afeta ML
 * ✅ FASE 4: API Real da Shopee integrada com segurança total
 */

export interface ShopeeCredentials {
  partner_id: string;
  partner_key: string;
  shop_id?: string;
  access_token?: string;
}

/**
 * 🚀 REAL: Função para buscar pedidos Shopee via API real
 */
export async function fetchShopeeOrders(params: any, accountData: any, credentials: ShopeeCredentials, cid: string) {
  try {
    console.log(`[unified-orders:${cid}] 🛍️ Shopee API REAL: Busca iniciada para conta ${accountData.id}`);
    
    // 🚀 CHAMAR API SHOPEE REAL
    const shopeeResponse = await fetch('https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/shopee-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        integration_account_id: accountData.id,
        time_range_field: 'update_time',
        time_from: params.time_from || Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // 7 dias
        time_to: params.time_to || Math.floor(Date.now() / 1000),
        page_size: Math.min(params.limit || 50, 100),
        cursor: params.cursor,
        response_optional_fields: [
          'recipient_address',
          'actual_shipping_fee', 
          'item_list',
          'buyer_username',
          'payment_method'
        ]
      })
    });

    if (!shopeeResponse.ok) {
      const errorText = await shopeeResponse.text();
      console.log(`[unified-orders:${cid}] ❌ Erro API Shopee: ${shopeeResponse.status} - ${errorText}`);
      
      // 🛡️ FALLBACK SEGURO: Retorna vazio em caso de erro
      return {
        results: [],
        pedidos: [],
        total: 0,
        paging: {
          total: 0,
          limit: params.limit || 50,
          offset: params.offset || 0,
          has_more: false
        }
      };
    }

    const shopeeData = await shopeeResponse.json();
    
    if (!shopeeData.success) {
      console.log(`[unified-orders:${cid}] ❌ Shopee API retornou erro:`, shopeeData.error);
      return {
        results: [],
        pedidos: [],
        total: 0,
        paging: {
          total: 0,
          limit: params.limit || 50,
          offset: params.offset || 0,
          has_more: false
        }
      };
    }

    const orders = shopeeData.orders || [];
    console.log(`[unified-orders:${cid}] ✅ Shopee API retornou ${orders.length} pedidos`);
    
    // 🔄 TRANSFORMAR PARA FORMATO UNIFIED
    const transformedOrders = transformShopeeOrders(orders, accountData.id, accountData.name, cid);
    
    return {
      results: transformedOrders,
      pedidos: transformedOrders,
      total: orders.length,
      paging: {
        total: orders.length,
        limit: params.limit || 50,
        offset: params.offset || 0,
        has_more: shopeeData.has_more || false,
        next_cursor: shopeeData.next_cursor
      }
    };
    
  } catch (error) {
    console.error(`[unified-orders:${cid}] 🛍️ Erro Shopee API:`, error);
    
    // 🛡️ FALLBACK SEGURO: Em caso de erro, retorna vazio para não quebrar sistema
    return {
      results: [],
      pedidos: [],
      total: 0,
      paging: {
        total: 0,
        limit: params.limit || 50,
        offset: params.offset || 0,
        has_more: false
      }
    };
  }
}

/**
 * 🔄 REAL: Transformar pedidos Shopee para formato unificado
 */
export function transformShopeeOrders(orders: any[], integration_account_id: string, accountName?: string, cid?: string) {
  console.log(`[unified-orders:${cid}] 🛍️ Transformando ${orders.length} pedidos Shopee para formato unificado`);
  
  if (!orders || orders.length === 0) {
    return [];
  }
  
  return orders.map((order: any) => {
    const firstItem = order.items?.[0];
    
    // 🔄 CONVERTER PARA FORMATO PADRÃO ML-COMPATIBLE
    return {
      id: order.order_id,
      order_id: order.order_id,
      status: order.order_status,
      date_created: order.date_created,
      date_closed: order.date_updated,
      last_updated: order.date_updated,
      total_amount: order.total_amount,
      currency_id: order.currency || 'BRL',
      
      // 👤 DADOS DO CLIENTE (compatível com ML)
      buyer: {
        id: order.customer_name || 'shopee_user',
        nickname: order.customer_name || 'Cliente Shopee',
        first_name: order.customer_name?.split(' ')?.[0] || '',
        last_name: order.customer_name?.split(' ')?.slice(1)?.join(' ') || '',
        email: order.customer_email || '',
        phone: {
          number: order.customer_phone || ''
        }
      },
      
      // 🏠 ENDEREÇO (compatível com ML)
      shipping: {
        receiver_address: {
          address_line: order.shipping_address?.street || '',
          city: {
            name: order.shipping_address?.city || ''
          },
          state: {
            name: order.shipping_address?.state || ''
          },
          zip_code: order.shipping_address?.zipcode || '',
          country: {
            id: order.shipping_address?.country || 'BR'
          }
        }
      },
      
      // 💰 PAGAMENTO (compatível com ML)
      payments: [{
        payment_method_id: order.payment_info?.method || 'unknown',
        status: order.payment_info?.status || 'pending',
        date_approved: order.payment_info?.paid_at,
        transaction_amount: order.total_amount
      }],
      
      // 📦 ITENS (compatível com ML)
      order_items: order.items?.map((item: any) => ({
        item: {
          id: item.id,
          title: item.title,
          seller_sku: item.sku
        },
        quantity: item.quantity,
        unit_price: item.unit_price,
        full_unit_price: item.unit_price
      })) || [],
      
      // 🏷️ TAGS E METADADOS
      tags: ['shopee', 'imported'],
      
      // 🚚 LOGÍSTICA
      pack_id: null,
      shipping_cost: order.shipping_info?.cost || 0,
      
      // 📊 METADADOS ESPECÍFICOS SHOPEE
      _shopee_data: {
        provider: 'shopee',
        integration_account_id: integration_account_id,
        account_name: accountName,
        raw_order: order,
        imported_at: new Date().toISOString()
      }
    };
  });
}