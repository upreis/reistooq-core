import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrdersRequest {
  integration_account_id: string
  seller_id?: string
  limit?: number
  offset?: number
  sort?: string
  order?: string
  date_created_from?: string
  date_created_to?: string
  last_updated_from?: string
  last_updated_to?: string
  order_status?: string
}

function makeClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          authorization: req.headers.get('authorization') ?? '',
          'x-client-info': req.headers.get('x-client-info') ?? '',
          apikey: req.headers.get('apikey') ?? '',
        }
      }
    }
  )
}

async function getValidAccessToken(supabase: any, integration_account_id: string): Promise<string | null> {
  try {
    const { data: secretData, error } = await supabase.rpc('get_integration_secret_secure', {
      account_id: integration_account_id,
      provider_name: 'mercadolivre',
      requesting_function: 'mercadolivre-orders'
    })

    if (error || !secretData || secretData.length === 0) {
      console.error('❌ Erro ao obter tokens:', error?.message)
      return null
    }

    const tokenInfo = secretData[0]
    
    // Verificar se token está próximo do vencimento (próximos 5 minutos)
    const expiresAt = new Date(tokenInfo.expires_at)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const fiveMinutes = 5 * 60 * 1000

    if (timeUntilExpiry < fiveMinutes) {
      console.log('🔄 Token próximo do vencimento, fazendo refresh')
      
      // Fazer refresh automático
      const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadolivre-refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ integration_account_id })
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        console.log('✅ Token renovado automaticamente')
        return refreshData.access_token
      } else {
        console.error('❌ Falha no refresh automático')
        return tokenInfo.access_token // Tentar com token atual
      }
    }

    return tokenInfo.access_token
  } catch (error) {
    console.error('❌ Erro ao obter access token:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📦 Buscando pedidos MercadoLibre')
    
    const requestData = await req.json() as OrdersRequest
    const { 
      integration_account_id,
      seller_id,
      limit = 50,
      offset = 0,
      sort = 'date_created',
      order = 'desc',
      date_created_from,
      date_created_to,
      last_updated_from,
      last_updated_to,
      order_status
    } = requestData
    
    if (!integration_account_id) {
      return new Response(
        JSON.stringify({ error: 'integration_account_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = makeClient(req)
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Usuário não autenticado')
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Obter access token válido
    const accessToken = await getValidAccessToken(supabase, integration_account_id)
    
    if (!accessToken) {
      console.error('❌ Access token não disponível')
      return new Response(
        JSON.stringify({ error: 'Token de acesso não disponível' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Se seller_id não fornecido, obter do /users/me
    let finalSellerId = seller_id
    if (!finalSellerId) {
      console.log('🔍 Obtendo seller_id do /users/me')
      
      const meResponse = await fetch('https://api.mercadolibre.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!meResponse.ok) {
        console.error('❌ Erro ao obter seller_id')
        return new Response(
          JSON.stringify({ error: 'Erro ao obter informações do usuário' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const meData = await meResponse.json()
      finalSellerId = meData.id
      console.log('✅ Seller ID obtido:', finalSellerId)
    }

    // Construir URL de busca de pedidos com paginação
    const ordersUrl = new URL('https://api.mercadolibre.com/orders/search')
    ordersUrl.searchParams.set('seller', finalSellerId.toString())
    ordersUrl.searchParams.set('limit', Math.min(limit, 200).toString()) // ML permite máximo 200
    ordersUrl.searchParams.set('offset', offset.toString())
    ordersUrl.searchParams.set('sort', sort)
    ordersUrl.searchParams.set('order', order)
    
    // Filtros opcionais
    if (date_created_from) {
      ordersUrl.searchParams.set('order.date_created.from', date_created_from)
    }
    if (date_created_to) {
      ordersUrl.searchParams.set('order.date_created.to', date_created_to)
    }
    if (last_updated_from) {
      ordersUrl.searchParams.set('order.date_last_updated.from', last_updated_from)
    }
    if (last_updated_to) {
      ordersUrl.searchParams.set('order.date_last_updated.to', last_updated_to)
    }
    if (order_status) {
      ordersUrl.searchParams.set('order.status', order_status)
    }

    console.log('🌐 Fazendo chamada para ML Orders API')
    
    const ordersResponse = await fetch(ordersUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text()
      console.error('❌ Erro na API do ML:', ordersResponse.status, errorText)
      
      if (ordersResponse.status === 401 || ordersResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Token expirado ou inválido',
            requires_reauth: true 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      if (ordersResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit excedido',
            message: 'Muitas requisições. Tente novamente em alguns minutos.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro na API do MercadoLibre' }),
        { 
          status: ordersResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const ordersData = await ordersResponse.json()
    console.log(`✅ ${ordersData.results?.length || 0} pedidos obtidos com sucesso`)

    // Estrutura de resposta padronizada com paginação
    const response = {
      success: true,
      data: {
        results: ordersData.results || [],
        paging: {
          total: ordersData.paging?.total || 0,
          limit: ordersData.paging?.limit || limit,
          offset: ordersData.paging?.offset || offset,
          primary_results: ordersData.paging?.primary_results || 0
        },
        seller_id: finalSellerId,
        query: ordersData.query || {},
        sort: ordersData.sort || { id: sort, name: sort }
      },
      metadata: {
        request_time: new Date().toISOString(),
        integration_account_id,
        api_endpoint: ordersUrl.toString().replace(accessToken, '***') // Log sem vazar token
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})