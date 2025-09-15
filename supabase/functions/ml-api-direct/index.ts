import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, integration_account_id, seller_id, access_token, filters } = await req.json()

    console.log(`🔍 ML API Direct - Action: ${action}, Seller: ${seller_id}`)

    if (action === 'get_claims_and_returns') {
      // ============ BUSCAR PEDIDOS CANCELADOS DA API MERCADO LIVRE ============
      const cancelledOrders = await buscarPedidosCancelados(seller_id, access_token, filters)
      
      console.log(`📊 Total de pedidos cancelados encontrados: ${cancelledOrders.length}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: cancelledOrders,
          totals: {
            cancelled_orders: cancelledOrders.length,
            total: cancelledOrders.length
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação não suportada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro na ml-api-direct:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// ============ FUNÇÃO PARA BUSCAR PEDIDOS CANCELADOS DA API ML ============
async function buscarPedidosCancelados(sellerId: string, accessToken: string, filters: any) {
  try {
    console.log(`🔍 Buscando pedidos cancelados para seller ${sellerId}...`)
    
    let url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled`
    
    // Adicionar filtros de data se fornecidos
    if (filters?.date_from) {
      url += `&order.date_created.from=${filters.date_from}T00:00:00.000Z`
    }
    if (filters?.date_to) {
      url += `&order.date_created.to=${filters.date_to}T23:59:59.999Z`
    }
    
    // Limitar a 50 resultados por requisição
    url += `&limit=50&sort=date_desc`
    
    console.log(`📞 URL da API Orders Cancelados: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`❌ Erro na API Orders: ${response.status} - ${response.statusText}`)
      
      if (response.status === 401) {
        throw new Error('Token de acesso inválido ou expirado')
      }
      if (response.status === 403) {
        throw new Error('Sem permissão para acessar orders')
      }
      
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`📋 Orders cancelados encontrados: ${data?.results?.length || 0}`)
    
    if (!data?.results || data.results.length === 0) {
      console.log('ℹ️ Nenhum pedido cancelado encontrado')
      return []
    }

    // Processar cada order cancelado para obter detalhes completos
    const ordersCancelados = []
    
    for (const order of data.results) {
      try {
        // Buscar detalhes completos do pedido
        const orderDetailUrl = `https://api.mercadolibre.com/orders/${order.id}`
        console.log(`📞 Buscando detalhes do pedido: ${order.id}`)
        
        const orderDetailResponse = await fetch(orderDetailUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (orderDetailResponse.ok) {
          const orderDetail = await orderDetailResponse.json()
          
          // Processar como devolução/cancelamento
          const devolucao = {
            type: 'cancellation',
            order_id: orderDetail.id,
            date_created: orderDetail.date_created,
            status: orderDetail.status,
            reason: orderDetail.cancel_detail?.description || 'Pedido cancelado',
            amount: orderDetail.total_amount || 0,
            resource_data: {
              title: orderDetail.order_items?.[0]?.item?.title || 'Produto não identificado',
              sku: orderDetail.order_items?.[0]?.item?.seller_sku || '',
              quantity: orderDetail.order_items?.[0]?.quantity || 1
            },
            order_data: orderDetail,
            buyer: orderDetail.buyer,
            cancel_detail: orderDetail.cancel_detail
          }
          
          ordersCancelados.push(devolucao)
          console.log(`✅ Processado pedido cancelado: ${order.id}`)
        } else {
          console.warn(`⚠️ Erro ao buscar detalhes do pedido ${order.id}: ${orderDetailResponse.status}`)
        }
      } catch (orderError) {
        console.error(`❌ Erro ao processar pedido ${order.id}:`, orderError)
      }
    }
    
    console.log(`🎉 Total de pedidos cancelados processados: ${ordersCancelados.length}`)
    return ordersCancelados
    
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos cancelados:', error)
    throw error
  }
}