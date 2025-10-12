import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🔒 Cliente Supabase para buscar tokens de forma segura
function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, integration_account_id, seller_id, filters } = await req.json()

    console.log(`🔍 ML API Direct - Action: ${action}, Seller: ${seller_id}`)

    if (action === 'get_claims_and_returns') {
      // 🔒 Obter token de forma segura usando integrations-get-secret
      console.log(`🔑 Obtendo token ML para conta ${integration_account_id}...`)
      
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      console.log(`🔐 INTERNAL_TOKEN configurado: ${INTERNAL_TOKEN ? 'Sim' : 'Não'}`)
      
      // Fazer chamada HTTP direta para a função usando fetch
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-internal-call': 'true',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        const errorText = await secretResponse.text();
        console.error(`❌ Erro ao obter token ML (${secretResponse.status}):`, errorText)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.',
            details: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      const tokenData = await secretResponse.json();
      
      if (!tokenData?.found || !tokenData?.secret?.access_token) {
        console.error('❌ Token ML não encontrado na resposta:', tokenData)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      const access_token = tokenData.secret.access_token
      console.log(`✅ Token ML obtido com sucesso`)
      
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
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
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
          // Proteção contra orders inválidos
          if (!order || !order.id) {
            console.warn(`⚠️ Order inválido encontrado:`, order)
            continue
          }
          
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
                
                console.log(`📋 Dados obtidos para mediação ${mediationId}:`, {
                  claimDetails: !!claimDetails,
                  claimMessages: !!claimMessages,
                  mediationDetails: !!mediationDetails,
                  claimAttachments: !!claimAttachments,
                  returnsV2: !!returnsV2,
                  returnsV1: !!returnsV1
                })
                
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
                console.error(`❌ Erro crítico ao buscar dados do claim ${mediationId}:`, claimError)
                // Definir claimData como null em caso de erro crítico
                claimData = null
              }
            }
            
            // Processar como devolução/cancelamento com DADOS ENRIQUECIDOS COMPLETOS
            // Proteção contra dados nulos
            const safeClaimData = claimData || {}
            const safeOrderDetail = orderDetail || {}
            
            const devolucao = {
              type: 'cancellation',
              order_id: safeOrderDetail.id || 'N/A',
              date_created: safeOrderDetail.date_created || new Date().toISOString(),
              status: safeOrderDetail.status || 'unknown',
              reason: safeOrderDetail.cancel_detail?.description || 'Pedido cancelado',
              amount: safeOrderDetail.total_amount || 0,
              resource_data: {
                title: safeOrderDetail.order_items?.[0]?.item?.title || 'Produto não identificado',
                sku: safeOrderDetail.order_items?.[0]?.item?.seller_sku || '',
                quantity: safeOrderDetail.order_items?.[0]?.quantity || 1
              },
              order_data: safeOrderDetail,
              buyer: safeOrderDetail.buyer || {},
              cancel_detail: safeOrderDetail.cancel_detail || {},
              
              // DADOS DE CLAIM ESTRUTURADOS
              claim_details: safeClaimData?.claim_details || null,
              claim_messages: safeClaimData?.claim_messages || null,
              mediation_details: safeClaimData?.mediation_details || null,
              claim_attachments: safeClaimData?.claim_attachments || null,
              return_details_v2: safeClaimData?.return_details_v2 || null,
              return_details_v1: safeClaimData?.return_details_v1 || null,
              return_reviews: safeClaimData?.return_reviews || null,
              
              // CAMPOS ENRIQUECIDOS EXTRAÍDOS
              claim_status: safeClaimData?.claim_status || null,
              return_status: safeClaimData?.return_status || null,
              return_tracking: safeClaimData?.return_tracking || null,
              resolution_date: safeClaimData?.resolution_date || null,
              resolution_reason: safeClaimData?.resolution_reason || null,
              messages_count: safeClaimData?.messages_count || 0,
              review_score: safeClaimData?.review_score || null,
              
              // DADOS DE COMUNICAÇÃO - MÚLTIPLAS FONTES DE MENSAGENS
              timeline_mensagens: safeClaimData?.claim_messages?.messages || 
                                  safeClaimData?.mediation_details?.messages || [],
              numero_interacoes: (safeClaimData?.claim_messages?.messages?.length || 0) + 
                                (safeClaimData?.mediation_details?.messages?.length || 0),
              
              // ÚLTIMA MENSAGEM - EXTRAIR DE TODAS AS FONTES
              ultima_mensagem_data: (() => {
                const allMessages = [
                  ...(safeClaimData?.claim_messages?.messages || []),
                  ...(safeClaimData?.mediation_details?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                return allMessages.length > 0 ? allMessages[0].date_created : null
              })(),
              
              ultima_mensagem_remetente: (() => {
                const allMessages = [
                  ...(safeClaimData?.claim_messages?.messages || []),
                  ...(safeClaimData?.mediation_details?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                return allMessages.length > 0 ? allMessages[0]?.from?.role : null
              })(),
              
              mensagens_nao_lidas: (safeClaimData?.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0) +
                                  (safeClaimData?.mediation_details?.messages?.filter((m: any) => !m.read)?.length || 0),
              
              // DADOS DE RETORNO/TROCA - MÚLTIPLAS FONTES
              eh_troca: (safeClaimData?.return_details_v2?.results?.[0]?.subtype || 
                        safeClaimData?.return_details_v1?.results?.[0]?.subtype || 
                        safeClaimData?.claim_details?.type || '').toLowerCase().includes('change'),
              
              // DATAS CRÍTICAS - EXTRAIR DE MÚLTIPLAS FONTES
              data_estimada_troca: safeClaimData?.return_details_v2?.results?.[0]?.estimated_exchange_date || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.estimated_exchange_date ||
                                  safeClaimData?.claim_details?.estimated_delivery_date ||
                                  safeClaimData?.mediation_details?.estimated_resolution_date || null,
              
              data_limite_troca: safeClaimData?.return_details_v2?.results?.[0]?.expiration_date ||
                                safeClaimData?.return_details_v1?.results?.[0]?.expiration_date ||
                                safeClaimData?.claim_details?.expiration_date ||
                                safeClaimData?.mediation_details?.expiration_date || null,
              
              // RASTREAMENTO
              codigo_rastreamento: safeClaimData?.return_details_v2?.results?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.tracking_number ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.tracking_number || null,
              
              transportadora: safeClaimData?.return_details_v2?.results?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.carrier ||
                             safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.carrier || null,
              
              status_rastreamento: safeClaimData?.return_details_v2?.results?.[0]?.status || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.status ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.status || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.status || null,
              
              // DADOS DE ANEXOS
              anexos_count: safeClaimData?.claim_attachments?.length || 0,
              anexos_comprador: safeClaimData?.claim_attachments?.filter((a: any) => a.source === 'buyer') || [],
              anexos_vendedor: safeClaimData?.claim_attachments?.filter((a: any) => a.source === 'seller') || [],
              anexos_ml: safeClaimData?.claim_attachments?.filter((a: any) => a.source === 'meli') || [],
              
              // DADOS FINANCEIROS - MÚLTIPLAS FONTES
              custo_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipping_cost || 
                                    safeClaimData?.return_details_v1?.results?.[0]?.shipping_cost ||
                                    safeClaimData?.return_details_v2?.shipping_cost || 
                                    safeClaimData?.return_details_v1?.shipping_cost || null,
              
              valor_compensacao: safeClaimData?.return_details_v2?.results?.[0]?.refund_amount || 
                                safeClaimData?.return_details_v1?.results?.[0]?.refund_amount ||
                                safeClaimData?.return_details_v2?.refund_amount || 
                                safeClaimData?.return_details_v1?.refund_amount ||
                                safeClaimData?.claim_details?.resolution?.compensation?.amount || null,
              
              responsavel_custo: safeClaimData?.claim_details?.resolution?.benefited?.[0] || 
                                safeClaimData?.mediation_details?.resolution?.benefited?.[0] ||
                                safeClaimData?.claim_details?.resolution?.responsible || null,
              
              // CLASSIFICAÇÃO
              tipo_claim: safeClaimData?.claim_details?.type || safeOrderDetail.status,
              subtipo_claim: safeClaimData?.claim_details?.stage || safeClaimData?.claim_details?.subtype || null,
              motivo_categoria: safeClaimData?.claim_details?.reason_id || null,
              em_mediacao: safeClaimData?.claim_details?.type === 'mediations' || safeClaimData?.mediation_details !== null,
              nivel_prioridade: safeClaimData?.claim_details?.type === 'mediations' ? 'high' : 'medium',
              
              // CONTROLE DE AÇÃO - MÚLTIPLAS FONTES
              acao_seller_necessaria: (safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0 ||
                                     (safeClaimData?.mediation_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
              
              escalado_para_ml: safeClaimData?.claim_details?.type === 'mediations' || 
                               safeClaimData?.mediation_details !== null,
              
              // DATA DE VENCIMENTO - MÚLTIPLAS FONTES
              data_vencimento_acao: safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                                   safeClaimData?.mediation_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                                   safeClaimData?.claim_details?.due_date ||
                                   safeClaimData?.mediation_details?.due_date || null,
              
              dias_restantes_acao: (() => {
                const dueDate = safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                               safeClaimData?.mediation_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                               safeClaimData?.claim_details?.due_date ||
                               safeClaimData?.mediation_details?.due_date
                if (!dueDate) return null
                const diffTime = new Date(dueDate).getTime() - new Date().getTime()
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              })(),
              
              // MARCADORES DE QUALIDADE
              dados_completos: safeClaimData?.dados_completos || false,
              marketplace_origem: 'ML_BRASIL'
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