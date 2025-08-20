import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, status, limit = 50, offset = 0 } = await req.json()

    console.log('Unified orders request:', { integration_account_id, status, limit, offset })

    if (!integration_account_id) {
      throw new Error('Missing integration_account_id')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the integration account exists and is active
    const { data: account } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('is_active', true)
      .single()

    if (!account) {
      throw new Error('Integration account not found or inactive')
    }

    console.log('Found integration account:', account.name, account.provider)

    if (account.provider === 'mercadolivre') {
      // Get current secrets and validate token
      let { data: secrets } = await supabase.rpc('get_integration_secret_secure', {
        account_id: integration_account_id,
        provider_name: 'mercadolivre',
        requesting_function: 'unified-orders'
      }).single()

      if (!secrets) {
        throw new Error('No secrets found for account')
      }

      // Check if token needs refresh
      const now = new Date()
      const expiresAt = new Date(secrets.expires_at)
      if (expiresAt <= now) {
        console.log('Token expired, refreshing...')
        
        const refreshResponse = await refreshToken(supabase, integration_account_id, secrets)
        if (refreshResponse.error) {
          throw new Error('Failed to refresh token')
        }
        
        secrets = refreshResponse.data
      }

      // Get user ID from payload
      const userId = secrets.payload?.user_data?.id
      if (!userId) {
        throw new Error('User ID not found in secrets')
      }

      // Fetch orders from Mercado Livre
      const ordersUrl = new URL(`https://api.mercadolibre.com/orders/search`)
      ordersUrl.searchParams.set('seller', userId.toString())
      ordersUrl.searchParams.set('limit', limit.toString())
      ordersUrl.searchParams.set('offset', offset.toString())
      
      if (status && status !== 'all') {
        ordersUrl.searchParams.set('order.status', status)
      }

      console.log('Fetching orders from ML API:', ordersUrl.toString())

      const ordersResponse = await fetch(ordersUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${secrets.access_token}`,
          'Accept': 'application/json'
        }
      })
      const ordersData = await ordersResponse.json()

      if (!ordersResponse.ok) {
        console.error('Orders fetch failed:', ordersData)
        
        // Handle specific ML API errors
        if (ordersResponse.status === 401) {
          throw new Error('Token de acesso inválido ou expirado')
        } else if (ordersResponse.status === 403) {
          if (ordersData.message?.includes('invalid_operator_user_id')) {
            throw new Error('Conecte com o usuário administrador da conta do Mercado Livre')
          }
          throw new Error('Acesso negado - verifique as permissões da aplicação')
        } else if (ordersResponse.status === 429) {
          throw new Error('Limite de taxa excedido - tente novamente mais tarde')
        }
        
        throw new Error(ordersData.message || 'Failed to fetch orders')
      }

      console.log('ML API returned', ordersData.results?.length || 0, 'orders')

      // Convert ML orders to unified format
      const unifiedOrders = ordersData.results?.map((order: any) => ({
        id: order.id.toString(),
        external_id: order.id.toString(),
        source: 'mercadolivre',
        status: mapMLStatus(order.status),
        total: order.total_amount || 0,
        currency: order.currency_id || 'BRL',
        created_at: order.date_created,
        updated_at: order.date_closed || order.date_created,
        customer: {
          name: order.buyer?.nickname || '',
          email: order.buyer?.email || '',
          document: null
        },
        items: order.order_items?.map((item: any) => ({
          id: item.item?.id,
          title: item.item?.title,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: (item.unit_price || 0) * (item.quantity || 1)
        })) || [],
        shipping: {
          status: order.shipping?.status || '',
          cost: order.shipping?.cost || 0
        },
        integration_account_id
      })) || []

      console.log('Returning', unifiedOrders.length, 'unified orders')

      return new Response(
        JSON.stringify({ 
          success: true, 
          orders: unifiedOrders,
          total: ordersData.paging?.total || unifiedOrders.length,
          source: 'mercadolivre'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For other providers, return empty for now
    return new Response(
      JSON.stringify({ 
        success: true, 
        orders: [],
        total: 0,
        source: account.provider
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unified orders error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function refreshToken(supabase: any, accountId: string, secrets: any) {
  try {
    console.log('Refreshing ML token...')
    
    const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: secrets.client_id,
        client_secret: secrets.client_secret,
        refresh_token: secrets.refresh_token
      })
    })

    const tokenData = await refreshResponse.json()

    if (!refreshResponse.ok) {
      console.error('Token refresh failed:', tokenData)
      return { error: tokenData.message || 'Token refresh failed' }
    }

    // Update stored secrets
    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')
    if (!encryptionKey) {
      return { error: 'Encryption key not found' }
    }

    await supabase.rpc('encrypt_integration_secret', {
      p_account_id: accountId,
      p_provider: 'mercadolivre',
      p_client_id: secrets.client_id,
      p_client_secret: secrets.client_secret,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token || secrets.refresh_token,
      p_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      p_payload: secrets.payload || {},
      p_encryption_key: encryptionKey
    })

    console.log('Token refreshed successfully')

    return {
      data: {
        ...secrets,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || secrets.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      }
    }
  } catch (error) {
    console.error('Refresh token error:', error)
    return { error: error.message }
  }
}

function mapMLStatus(mlStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'confirmed': 'paid',
    'payment_required': 'pending',
    'payment_in_process': 'processing',
    'partially_paid': 'processing',
    'paid': 'paid',
    'cancelled': 'cancelled',
    'invalid': 'cancelled',
    'shipped': 'shipped',
    'delivered': 'delivered'
  }
  return statusMap[mlStatus] || mlStatus
}