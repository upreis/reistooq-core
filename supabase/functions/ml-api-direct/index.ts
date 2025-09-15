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
            
            // Buscar dados completos do claim se houver mediação
            let claimData = null
            if (orderDetail.mediations && orderDetail.mediations.length > 0) {
              const mediationId = orderDetail.mediations[0].id
              const packId = orderDetail.pack_id
              const sellerId = orderDetail.seller.id
              
              console.log(`🔍 Buscando dados completos do claim - Mediation ID: ${mediationId}`)
              
              // Buscar todos os dados do claim em paralelo incluindo returns (estratégia do PDF)
              const claimPromises = []
              
              // 1. Buscar claim principal
              claimPromises.push(
                fetch(`https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 2. Buscar mensagens se tiver pack_id
              if (packId) {
                claimPromises.push(
                  fetch(`https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  }).then(r => r.ok ? r.json() : null).catch(() => null)
                )
              } else {
                claimPromises.push(Promise.resolve(null))
              }
              
              // 3. Buscar detalhes da mediação
              claimPromises.push(
                fetch(`https://api.mercadolibre.com/post-purchase/v1/mediations/${mediationId}`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 4. Buscar anexos do claim
              claimPromises.push(
                fetch(`https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/attachments`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 5. Buscar returns v2 usando claim ID (novo)
              claimPromises.push(
                fetch(`https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 6. Buscar returns v1 usando claim ID (novo)
              claimPromises.push(
                fetch(`https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/returns`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              try {
                const [claimDetails, claimMessages, mediationDetails, claimAttachments, returnsV2, returnsV1] = await Promise.all(claimPromises)
                
                // Buscar reviews dos returns se existirem
                let returnReviews = []
                if (returnsV2?.results?.length > 0) {
                  const reviewPromises = returnsV2.results.map(async (returnItem: any) => {
                    try {
                      const response = await fetch(`https://api.mercadolibre.com/post-purchase/v1/returns/${returnItem.id}/reviews`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      })
                      return response.ok ? await response.json() : null
                    } catch (error) {
                      console.warn(`⚠️ Erro ao buscar review do return ${returnItem.id}:`, error)
                      return null
                    }
                  })
                  
                  try {
                    returnReviews = (await Promise.all(reviewPromises)).filter(review => review !== null)
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar reviews dos returns:`, error)
                  }
                }
                
                claimData = {
                  claim_details: claimDetails,
                  claim_messages: claimMessages,
                  mediation_details: mediationDetails,
                  claim_attachments: claimAttachments,
                  return_details_v2: returnsV2,
                  return_details_v1: returnsV1,
                  return_reviews: returnReviews,
                  // Campos enriquecidos conforme estratégia do PDF
                  claim_status: claimDetails?.status || null,
                  return_status: returnsV2?.results?.[0]?.status || null,
                  return_tracking: returnsV2?.results?.[0]?.tracking_number || null,
                  resolution_date: claimDetails?.date_closed || claimDetails?.resolution?.date || null,
                  resolution_reason: claimDetails?.resolution?.reason || null,
                  messages_count: claimMessages?.messages?.length || 0,
                  review_score: returnReviews?.[0]?.score || null,
                  dados_completos: true
                }
                
                console.log(`✅ Dados completos do claim obtidos para mediação ${mediationId}`)
              } catch (claimError) {
                console.warn(`⚠️ Erro ao buscar dados do claim ${mediationId}:`, claimError)
              }
            }
            
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
              cancel_detail: orderDetail.cancel_detail,
              // Adicionar dados completos do claim
              ...claimData
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