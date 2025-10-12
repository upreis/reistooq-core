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
    const requestBody = await req.json()
    const { action, integration_account_id, seller_id, filters } = requestBody

    console.log(`🔍 ML API Direct Request:`, {
      action,
      integration_account_id,
      seller_id,
      filters,
      raw_body: requestBody
    })

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
      console.log(`✅ Token ML obtido com sucesso para seller: ${seller_id}`)
      
      // Validação crítica: seller_id deve existir
      if (!seller_id) {
        console.error('❌ ERRO CRÍTICO: seller_id não foi fornecido')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'seller_id é obrigatório para buscar pedidos cancelados' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // ============ BUSCAR PEDIDOS CANCELADOS DA API MERCADO LIVRE ============
      console.log(`🚀 Chamando buscarPedidosCancelados com seller_id: ${seller_id}`)
      const cancelledOrders = await buscarPedidosCancelados(seller_id, access_token, filters, integration_account_id)
      
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

// ============ FUNÇÃO AUXILIAR: REFRESH TOKEN ============
async function refreshMLToken(integrationAccountId: string): Promise<string | null> {
  try {
    console.log(`🔄 Tentando refresh do token ML para conta ${integrationAccountId}...`)
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/mercadolibre-token-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ integration_account_id: integrationAccountId })
    });
    
    if (!refreshResponse.ok) {
      console.error(`❌ Falha no refresh do token: ${refreshResponse.status}`)
      return null
    }
    
    const refreshData = await refreshResponse.json()
    console.log(`✅ Token ML refreshed com sucesso`)
    return refreshData.access_token || null
  } catch (error) {
    console.error(`❌ Erro ao fazer refresh do token:`, error)
    return null
  }
}

// ============ FUNÇÃO AUXILIAR: FETCH COM RETRY E REFRESH ============
async function fetchMLWithRetry(url: string, accessToken: string, integrationAccountId: string, maxRetries = 1): Promise<Response> {
  let currentToken = accessToken
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    // Se sucesso, retornar
    if (response.ok) {
      return response
    }
    
    // Se 401 (token expirado) e ainda tem tentativas, fazer refresh
    if (response.status === 401 && attempt < maxRetries) {
      console.warn(`⚠️ Token expirado (401) na URL: ${url}. Tentando refresh...`)
      const newToken = await refreshMLToken(integrationAccountId)
      
      if (newToken) {
        currentToken = newToken
        console.log(`🔄 Retry ${attempt + 1}/${maxRetries} com novo token`)
        continue
      } else {
        console.error(`❌ Não foi possível fazer refresh do token`)
        return response
      }
    }
    
    // Qualquer outro erro ou última tentativa, retornar resposta
    return response
  }
  
  // Fallback (nunca deve chegar aqui)
  throw new Error('Fetch com retry falhou inesperadamente')
}

// ============ FUNÇÃO PARA BUSCAR CLAIMS/DEVOLUÇÕES DIRETAMENTE DA API ML ============
async function buscarPedidosCancelados(sellerId: string, accessToken: string, filters: any, integrationAccountId: string) {
  try {
    console.log(`🎯 Buscando claims diretamente da API Claims Search para seller ${sellerId}...`)
    
    // 🚀 USAR ENDPOINT CORRETO: /post-purchase/v1/claims/search
    const params = new URLSearchParams()
    
    // ✅ PARÂMETROS CORRETOS CONFORME ANÁLISE DO MANUS
    // CRÍTICO: API usa SINGULAR com underscore, NÃO plural com ponto!
    params.append('player_role', 'respondent')       // ✅ CORRETO: player_role
    params.append('player_user_id', sellerId)        // ✅ CORRETO: player_user_id
    
    // Paginação (obrigatório)
    params.append('limit', '50')
    params.append('offset', '0')
    
    // Filtros OPCIONAIS (apenas se tiverem valor)
    if (filters?.status_claim && filters.status_claim.trim().length > 0) {
      console.log(`✅ Aplicando filtro de status: ${filters.status_claim}`)
      params.append('status', filters.status_claim)
    }
    
    if (filters?.claim_type && filters.claim_type.trim().length > 0) {
      console.log(`✅ Aplicando filtro de tipo: ${filters.claim_type}`)
      params.append('type', filters.claim_type)
    }
    
    // 📅 FILTROS DE DATA (formato ISO 8601 com timezone)
    if (filters?.date_from && filters.date_from.trim().length > 0) {
      // Converter para formato aceito pela API ML: YYYY-MM-DDTHH:MM:SS.sss-03:00 (BRT)
      const dateFrom = `${filters.date_from}T00:00:00.000-03:00`
      console.log(`✅ Aplicando filtro date_from: ${dateFrom}`)
      params.append('date_created.from', dateFrom)
    }
    
    if (filters?.date_to && filters.date_to.trim().length > 0) {
      // Converter para formato aceito pela API ML com fim do dia
      const dateTo = `${filters.date_to}T23:59:59.999-03:00`
      console.log(`✅ Aplicando filtro date_to: ${dateTo}`)
      params.append('date_created.to', dateTo)
    }
    
    const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`
    console.log(`📞 URL da API Claims Search: ${url}`)
    
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
    
    if (!response.ok) {
      console.error(`❌ Erro na API Orders: ${response.status} - ${response.statusText}`)
      
      if (response.status === 401) {
        throw new Error('Token de acesso inválido ou expirado - reconecte a integração')
      }
      if (response.status === 403) {
        throw new Error('Sem permissão para acessar orders')
      }
      
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Claims encontrados: ${data?.data?.length || 0}`)
    
    if (!data?.data || data.data.length === 0) {
      console.log('ℹ️ Nenhum claim encontrado')
      return []
    }
    
    console.log(`📊 Total de claims retornados: ${data.data.length}`)
    console.log(`📄 Paginação: total=${data.paging?.total || 0}, limit=${data.paging?.limit || 0}, offset=${data.paging?.offset || 0}`)

    // Processar cada claim para obter detalhes completos
    const ordersCancelados = []
    
    for (const claim of data.data) {
      try {
        // Proteção contra claims inválidos
        if (!claim || !claim.id) {
          console.warn(`⚠️ Claim inválido encontrado:`, claim)
          continue
        }
        
        // Extrair order_id do claim
        const orderId = claim.resource_id || claim.order_id
        
        if (!orderId) {
          console.warn(`⚠️ Claim ${claim.id} sem order_id/resource_id`)
          continue
        }
        
        console.log(`📦 Processando claim ${claim.id} para order ${orderId}...`)
        
        // Buscar detalhes completos do pedido
        const orderDetailUrl = `https://api.mercadolibre.com/orders/${orderId}`
        console.log(`📞 Buscando detalhes do pedido: ${orderId}`)
          
          const orderDetailResponse = await fetchMLWithRetry(orderDetailUrl, accessToken, integrationAccountId)
          
          if (orderDetailResponse.ok) {
            const orderDetail = await orderDetailResponse.json()
            
            // Buscar dados completos do claim (já temos o ID do claim do search)
            let claimData = null
            const mediationId = claim.id
            const packId = orderDetail.pack_id
            const sellerId = orderDetail.seller?.id || claim.seller_id
            
            console.log(`🔍 Buscando dados completos do claim ${mediationId}...`)
              
              // Buscar todos os dados do claim em paralelo incluindo returns
              const claimPromises = []
              
              // 1. Buscar claim principal
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 2. Buscar mensagens DIRETO do claim (FONTE PRINCIPAL)
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/messages`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 3. Buscar mensagens via pack_id (FONTE BACKUP)
              if (packId) {
                claimPromises.push(
                  fetchMLWithRetry(
                    `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`,
                    accessToken,
                    integrationAccountId
                  ).then(r => r.ok ? r.json() : null).catch(() => null)
                )
              } else {
                claimPromises.push(Promise.resolve(null))
              }
              
              // 4. Buscar detalhes da mediação
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/mediations/${mediationId}`,
                  accessToken,
                  integrationAccountId
                ).then(async r => {
                  if (r.ok) return r.json();
                  console.log(`⚠️  Mediation failed (${r.status}): ${mediationId}`);
                  return null;
                }).catch(e => {
                  console.error(`❌ Mediation error: ${e.message}`);
                  return null;
                })
              )

              // 5. Buscar returns v2 usando claim ID
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 6. Buscar returns v1 usando claim ID
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/returns`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 7. Buscar shipment history do pedido original E devolução
              claimPromises.push(
                (async () => {
                  // Tentar buscar histórico do envio original primeiro
                  const originalShipmentId = orderDetail?.shipping?.id
                  if (originalShipmentId) {
                    try {
                      const response = await fetchMLWithRetry(
                        `https://api.mercadolibre.com/shipments/${originalShipmentId}/history`,
                        accessToken,
                        integrationAccountId
                      )
                      if (response.ok) {
                        console.log(`🚚 Histórico do envio original encontrado: ${originalShipmentId}`)
                        return { type: 'original', data: await response.json() }
                      }
                    } catch (e) {
                      console.warn(`⚠️ Erro ao buscar histórico do envio original:`, e)
                    }
                  }
                  
                  // Buscar histórico do shipment de devolução
                  try {
                    const returnsResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                      accessToken,
                      integrationAccountId
                    )
                    if (returnsResponse.ok) {
                      const returnsData = await returnsResponse.json()
                      const shipmentId = returnsData?.results?.[0]?.shipments?.[0]?.id || 
                                        returnsData?.results?.[0]?.shipments?.[0]?.shipment_id
                      if (shipmentId) {
                        console.log(`🚚 Buscando histórico do return shipment ${shipmentId}...`)
                        const historyResponse = await fetchMLWithRetry(
                          `https://api.mercadolibre.com/shipments/${shipmentId}/history`,
                          accessToken,
                          integrationAccountId
                        )
                        if (historyResponse.ok) {
                          return { type: 'return', data: await historyResponse.json() }
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar histórico de devolução:`, e)
                  }
                  
                  return null
                })()
              )

              // 8. Buscar change details se for troca
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/changes`,
                  accessToken,
                  integrationAccountId
                ).then(async (r) => {
                  if (!r.ok) return null
                  const data = await r.json()
                  if (data?.results?.length > 0) {
                    const changeId = data.results[0].id
                    console.log(`🔄 Buscando detalhes da troca ${changeId}...`)
                    const changeResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v1/changes/${changeId}`,
                      accessToken,
                      integrationAccountId
                    )
                    return changeResponse.ok ? await changeResponse.json() : null
                  }
                  return null
                }).catch(() => null)
              )
              
            try {
              const [claimDetails, claimMessagesDirect, claimMessagesPack, mediationDetails, returnsV2, returnsV1, shipmentHistory, changeDetails] = await Promise.all(claimPromises)
                
                // Consolidar mensagens de ambas as fontes
                const allMessages = [
                  ...(claimMessagesDirect?.messages || []),
                  ...(claimMessagesPack?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                
                // Remover duplicatas por ID
                const uniqueMessages = allMessages.filter((msg, index, self) => 
                  index === self.findIndex((m) => m.id === msg.id)
                )
                
                const consolidatedMessages = {
                  messages: uniqueMessages,
                  unread_messages: (claimMessagesDirect?.unread_messages || 0) + (claimMessagesPack?.unread_messages || 0)
                }
                
                // Extrair anexos das mensagens
                const extractedAttachments = []
                consolidatedMessages.messages.forEach(msg => {
                  if (msg.attachments && Array.isArray(msg.attachments)) {
                    extractedAttachments.push(...msg.attachments.map(att => ({
                      ...att,
                      source: msg.from?.role || 'unknown',
                      message_id: msg.id,
                      date_created: msg.date_created
                    })))
                  }
                })
                
                console.log(`📋 Dados obtidos para mediação ${mediationId}:`, {
                  claimDetails: !!claimDetails,
                  messagesCount: consolidatedMessages.messages.length,
                  attachmentsCount: extractedAttachments.length,
                  mediationDetails: !!mediationDetails,
                  returnsV2: !!returnsV2,
                  returnsV1: !!returnsV1,
                  shipmentHistory: !!shipmentHistory,
                  changeDetails: !!changeDetails
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
                  claim_messages: consolidatedMessages,
                  mediation_details: mediationDetails,
                  claim_attachments: extractedAttachments,
                  return_details_v2: returnsV2,
                  return_details_v1: returnsV1,
                  return_reviews: returnReviews,
                  shipment_history: shipmentHistory,
                  change_details: changeDetails,
                  // Campos enriquecidos conforme estratégia do PDF
                  claim_status: claimDetails?.status || null,
                  return_status: returnsV2?.results?.[0]?.status || null,
                  return_tracking: returnsV2?.results?.[0]?.tracking_number || null,
                  resolution_date: claimDetails?.date_closed || claimDetails?.resolution?.date || null,
                  resolution_reason: claimDetails?.resolution?.reason || null,
                  messages_count: consolidatedMessages.messages.length,
                  review_score: returnReviews?.[0]?.score || null,
                  // Dados de shipment history
                  tracking_events: shipmentHistory?.history || [],
                  last_tracking_update: shipmentHistory?.history?.[0]?.date || null,
                  tracking_status_detail: shipmentHistory?.history?.[0]?.status || null,
                  // Dados de troca
                  is_exchange: changeDetails !== null,
                  exchange_product_id: changeDetails?.substitute_product?.id || null,
                  exchange_product_title: changeDetails?.substitute_product?.title || null,
                  exchange_status: changeDetails?.status || null,
                  exchange_expected_date: changeDetails?.estimated_delivery_date || null,
                  dados_completos: true
                }
                
              console.log(`✅ Dados completos do claim obtidos para mediação ${mediationId}`)
            } catch (claimError) {
              console.error(`❌ Erro crítico ao buscar dados do claim ${mediationId}:`, claimError)
              // Definir claimData como null em caso de erro crítico
              claimData = null
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
              shipment_history: safeClaimData?.shipment_history || null,
              change_details: safeClaimData?.change_details || null,
              
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
              
              // DADOS DE RETORNO/TROCA - ENRIQUECIDO COM CHANGE DETAILS
              eh_troca: safeClaimData?.is_exchange || 
                       (safeClaimData?.return_details_v2?.results?.[0]?.subtype || 
                        safeClaimData?.return_details_v1?.results?.[0]?.subtype || 
                        safeClaimData?.claim_details?.type || '').toLowerCase().includes('change'),
              
              produto_troca_id: safeClaimData?.exchange_product_id || null,
              produto_troca_titulo: safeClaimData?.exchange_product_title || null,
              
              // DATAS CRÍTICAS - EXTRAIR DE MÚLTIPLAS FONTES INCLUINDO CHANGE
              data_estimada_troca: safeClaimData?.exchange_expected_date ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.estimated_exchange_date || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.estimated_exchange_date ||
                                  safeClaimData?.claim_details?.estimated_delivery_date ||
                                  safeClaimData?.mediation_details?.estimated_resolution_date || null,
              
              data_limite_troca: safeClaimData?.return_details_v2?.results?.[0]?.expiration_date ||
                                safeClaimData?.return_details_v1?.results?.[0]?.expiration_date ||
                                safeClaimData?.claim_details?.expiration_date ||
                                safeClaimData?.mediation_details?.expiration_date || null,
              
              // RASTREAMENTO - ENRIQUECIDO COM HISTORY
              codigo_rastreamento: safeClaimData?.return_details_v2?.results?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.tracking_number ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.tracking_number || null,
              
              transportadora: safeClaimData?.return_details_v2?.results?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.carrier ||
                             safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.carrier || null,
              
              status_rastreamento: safeClaimData?.tracking_status_detail || 
                                  safeClaimData?.return_details_v2?.results?.[0]?.status || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.status ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.status || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.status || null,
              
              tracking_history: safeClaimData?.tracking_events || [],
              data_ultima_movimentacao: safeClaimData?.last_tracking_update || null,
              
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
            console.log(`✅ Processado pedido cancelado: ${orderId}`)
          } else {
            console.warn(`⚠️ Erro ao buscar detalhes do pedido ${orderId}: ${orderDetailResponse.status}`)
          }
        } catch (orderError) {
          const orderId = claim.resource_id || claim.order_id || 'unknown'
          console.error(`❌ Erro ao processar pedido ${orderId}:`, orderError)
        }
      }
    
    console.log(`🎉 Total de claims processados: ${ordersCancelados.length}`)
    return ordersCancelados
    
  } catch (error) {
    console.error('❌ Erro ao buscar claims:', error)
    throw error
  }
}