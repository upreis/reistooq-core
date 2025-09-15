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
      // ============ BUSCAR CLAIMS DA API MERCADO LIVRE ============
      const claims = await buscarClaimsAPI(seller_id, access_token, filters)
      
      // ============ BUSCAR RETURNS DA API MERCADO LIVRE ============  
      const returns = await buscarReturnsAPI(seller_id, access_token, filters)
      
      // Combinar claims e returns
      const allData = [...claims, ...returns]
      
      console.log(`📊 Total encontrado: ${allData.length} (${claims.length} claims + ${returns.length} returns)`)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: allData,
          totals: {
            claims: claims.length,
            returns: returns.length,
            total: allData.length
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

// ============ FUNÇÃO PARA BUSCAR CLAIMS DA API ML ============
async function buscarClaimsAPI(sellerId: string, accessToken: string, filters: any) {
  try {
    console.log(`🔍 Buscando claims para seller ${sellerId}...`)
    
    let url = `https://api.mercadolibre.com/claims/search?seller=${sellerId}`
    
    // Adicionar filtros de data se fornecidos
    if (filters?.date_from) {
      url += `&date_from=${filters.date_from}`
    }
    if (filters?.date_to) {
      url += `&date_to=${filters.date_to}`
    }
    if (filters?.status) {
      url += `&status=${filters.status}`
    }
    
    // Limitar a 50 resultados por requisição
    url += `&limit=50`
    
    console.log(`📞 URL da API Claims: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`❌ Erro na API Claims: ${response.status} - ${response.statusText}`)
      
      if (response.status === 401) {
        throw new Error('Token de acesso inválido ou expirado')
      }
      if (response.status === 403) {
        throw new Error('Sem permissão para acessar claims')
      }
      if (response.status === 404) {
        console.log('ℹ️ Endpoint de claims não encontrado, pode não estar disponível')
        return []
      }
      
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`📋 Claims encontrados: ${data?.results?.length || 0}`)
    
    return (data?.results || []).map((claim: any) => ({
      type: 'claim',
      claim_id: claim.id,
      order_id: claim.resource_id,
      date_created: claim.date_created,
      status: claim.status,
      reason: claim.reason,
      amount: claim.amount?.amount || 0,
      resource_data: claim.resource,
      claim_data: claim,
      buyer: claim.resource?.buyer,
      order_data: claim.resource
    }))
    
  } catch (error) {
    console.error('❌ Erro ao buscar claims:', error)
    
    // Se der erro, retorna array vazio em vez de falhar completamente
    if (error.message.includes('404') || error.message.includes('não encontrado')) {
      console.log('ℹ️ API de claims não disponível, continuando...')
      return []
    }
    
    throw error
  }
}

// ============ FUNÇÃO PARA BUSCAR RETURNS DA API ML ============
async function buscarReturnsAPI(sellerId: string, accessToken: string, filters: any) {
  try {
    console.log(`🔍 Buscando returns para seller ${sellerId}...`)
    
    let url = `https://api.mercadolibre.com/returns/search?seller=${sellerId}`
    
    // Adicionar filtros de data se fornecidos
    if (filters?.date_from) {
      url += `&date_from=${filters.date_from}`
    }
    if (filters?.date_to) {
      url += `&date_to=${filters.date_to}`
    }
    if (filters?.status) {
      url += `&status=${filters.status}`
    }
    
    // Limitar a 50 resultados por requisição
    url += `&limit=50`
    
    console.log(`📞 URL da API Returns: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`❌ Erro na API Returns: ${response.status} - ${response.statusText}`)
      
      if (response.status === 401) {
        throw new Error('Token de acesso inválido ou expirado')
      }
      if (response.status === 403) {
        throw new Error('Sem permissão para acessar returns')
      }
      if (response.status === 404) {
        console.log('ℹ️ Endpoint de returns não encontrado, pode não estar disponível')
        return []
      }
      
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`📋 Returns encontrados: ${data?.results?.length || 0}`)
    
    return (data?.results || []).map((returnItem: any) => ({
      type: 'return',
      return_id: returnItem.id,
      order_id: returnItem.order_id,
      date_created: returnItem.date_created,
      status: returnItem.status,
      reason: returnItem.reason,
      amount: returnItem.refund?.amount || 0,
      resource_data: {
        title: returnItem.items?.[0]?.title,
        sku: returnItem.items?.[0]?.seller_sku,
        quantity: returnItem.items?.[0]?.quantity
      },
      return_data: returnItem,
      buyer: returnItem.buyer
    }))
    
  } catch (error) {
    console.error('❌ Erro ao buscar returns:', error)
    
    // Se der erro, retorna array vazio em vez de falhar completamente
    if (error.message.includes('404') || error.message.includes('não encontrado')) {
      console.log('ℹ️ API de returns não disponível, continuando...')
      return []
    }
    
    throw error
  }
}