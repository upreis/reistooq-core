import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopeeOrdersRequest {
  integration_account_id: string
  page?: number
  page_size?: number
  order_status?: string
  date_from?: string
  date_to?: string
}

interface ShopeeOrder {
  order_sn: string
  order_status: string
  create_time: number
  update_time: number
  total_amount: number
  shipping_fee: number
  payment_method: string
  recipient_address: {
    name: string
    phone: string
    full_address: string
    city: string
    state: string
    zipcode: string
  }
  order_items: ShopeeOrderItem[]
  note?: string
  tracking_number?: string
  voucher_details_list?: Array<{
    discount_amount: number
  }>
}

interface ShopeeOrderItem {
  item_id: number
  item_name: string
  item_sku?: string
  variation_name?: string
  quantity: number
  item_price: number
  discount_amount: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🛍️ [Shopee Orders] Iniciando processamento...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body: ShopeeOrdersRequest = await req.json()
    console.log('🛍️ [Shopee Orders] Body recebido:', body)

    const { integration_account_id, page = 1, page_size = 50, order_status, date_from, date_to } = body

    if (!integration_account_id) {
      throw new Error('integration_account_id é obrigatório')
    }

    // Get integration account and secrets
    console.log('📋 [Shopee Orders] Buscando conta de integração:', integration_account_id)
    
    const { data: accountData, error: accountError } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'shopee')
      .eq('is_active', true)
      .single()

    if (accountError) {
      console.error('❌ [Shopee Orders] Erro ao buscar conta:', accountError)
      throw new Error(`Conta não encontrada: ${accountError.message}`)
    }

    console.log('✅ [Shopee Orders] Conta encontrada:', accountData.name)

    // Get secrets for this account
    const { data: secretsData, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('simple_tokens')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'shopee')
      .single()

    if (secretsError) {
      console.error('❌ [Shopee Orders] Erro ao buscar secrets:', secretsError)
      throw new Error(`Credenciais não encontradas: ${secretsError.message}`)
    }

    // Decrypt simple tokens
    const { data: decryptResult, error: decryptError } = await supabase.rpc('decrypt_simple', {
      encrypted_data: secretsData.simple_tokens
    })

    if (decryptError || !decryptResult) {
      console.error('❌ [Shopee Orders] Erro ao descriptografar:', decryptError)
      throw new Error('Erro ao acessar credenciais')
    }

    const credentials = JSON.parse(decryptResult)
    console.log('🔑 [Shopee Orders] Credenciais carregadas para shop_id:', credentials.shop_id)

    // Generate Shopee API signature
    const timestamp = Math.floor(Date.now() / 1000)
    const partnerId = credentials.partner_id
    const accessToken = credentials.access_token
    const shopId = credentials.shop_id
    const apiDomain = credentials.api_domain || 'https://openplatform.sandbox.test-stable.shopee.sg'

    // Build API path
    const path = '/api/v2/order/get_order_list'
    
    // Calculate time ranges (last 15 days if not specified)
    const timeFrom = date_from ? Math.floor(new Date(date_from).getTime() / 1000) : Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000)
    const timeTo = date_to ? Math.floor(new Date(date_to).getTime() / 1000) : Math.floor(Date.now() / 1000)

    // Create base string for signature
    const baseString = `${partnerId}${path}${timestamp}${accessToken}${shopId}`
    
    // Create HMAC-SHA256 signature (simplified for demo)
    const encoder = new TextEncoder()
    const keyData = encoder.encode(credentials.partner_key || 'demo-key')
    const messageData = encoder.encode(baseString)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('🔐 [Shopee Orders] Signature gerada')

    // Build query parameters
    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: timestamp.toString(),
      access_token: accessToken,
      shop_id: shopId,
      sign: signature,
      page_size: page_size.toString(),
      cursor: ((page - 1) * page_size).toString(),
      time_range_field: 'create_time',
      time_from: timeFrom.toString(),
      time_to: timeTo.toString(),
      ...(order_status && { order_status })
    })

    const apiUrl = `${apiDomain}${path}?${params.toString()}`
    console.log('🌐 [Shopee Orders] Chamando API:', apiUrl.replace(/access_token=[^&]+/, 'access_token=***'))

    // Call Shopee API
    const shopeeResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!shopeeResponse.ok) {
      throw new Error(`Shopee API error: ${shopeeResponse.status} ${shopeeResponse.statusText}`)
    }

    const shopeeData = await shopeeResponse.json()
    console.log('📊 [Shopee Orders] Resposta da API recebida')

    if (shopeeData.error) {
      throw new Error(`Shopee API error: ${shopeeData.message || 'Unknown error'}`)
    }

    // Get order details for each order
    const orderSnList = shopeeData.response?.order_list || []
    console.log(`📦 [Shopee Orders] ${orderSnList.length} pedidos encontrados`)

    if (orderSnList.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        orders: [],
        total: 0,
        has_more: false,
        message: 'Nenhum pedido encontrado no período (normal em ambiente de teste)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get detailed order info
    const detailedOrders: ShopeeOrder[] = []
    
    for (const orderItem of orderSnList) {
      try {
        const detailParams = new URLSearchParams({
          partner_id: partnerId,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          access_token: accessToken,
          shop_id: shopId,
          sign: signature, // In production, generate new signature for each call
          order_sn_list: orderItem.order_sn
        })

        const detailUrl = `${apiDomain}/api/v2/order/get_order_detail?${detailParams.toString()}`
        
        const detailResponse = await fetch(detailUrl)
        const detailData = await detailResponse.json()
        
        if (detailData.response?.order_list?.[0]) {
          detailedOrders.push(detailData.response.order_list[0])
        }
      } catch (error) {
        console.warn(`⚠️ [Shopee Orders] Erro ao buscar detalhes do pedido ${orderItem.order_sn}:`, error)
        // Continue with basic order info
        detailedOrders.push({
          order_sn: orderItem.order_sn,
          order_status: mapShopeeStatus(orderItem.order_status),
          create_time: orderItem.create_time,
          update_time: orderItem.update_time,
          total_amount: 0,
          shipping_fee: 0,
          payment_method: 'unknown',
          recipient_address: {
            name: '',
            phone: '',
            full_address: '',
            city: '',
            state: '',
            zipcode: ''
          },
          order_items: []
        })
      }
    }

    // Transform to unified format
    const unifiedOrders = detailedOrders.map(order => ({
      id: order.order_sn,
      numero: order.order_sn,
      nome_cliente: order.recipient_address?.name || null,
      cpf_cnpj: null,
      data_pedido: order.create_time ? new Date(order.create_time * 1000).toISOString() : null,
      data_prevista: null,
      situacao: mapShopeeStatus(order.order_status),
      valor_total: order.total_amount || 0,
      valor_frete: order.shipping_fee || 0,
      valor_desconto: order.voucher_details_list?.reduce((sum, v) => sum + (v.discount_amount || 0), 0) || 0,
      numero_ecommerce: order.order_sn,
      numero_venda: order.order_sn,
      empresa: 'Shopee',
      cidade: order.recipient_address?.city || null,
      uf: order.recipient_address?.state || null,
      codigo_rastreamento: order.tracking_number || null,
      url_rastreamento: null,
      obs: order.note || null,
      obs_interna: null,
      integration_account_id,
      created_at: order.create_time ? new Date(order.create_time * 1000).toISOString() : null,
      updated_at: order.update_time ? new Date(order.update_time * 1000).toISOString() : null,
      raw_order: order // Include raw data for debugging
    }))

    console.log(`✅ [Shopee Orders] ${unifiedOrders.length} pedidos processados com sucesso`)

    return new Response(JSON.stringify({
      success: true,
      orders: unifiedOrders,
      total: shopeeData.response?.total_count || unifiedOrders.length,
      has_more: shopeeData.response?.has_more || false,
      provider: 'shopee',
      account_name: accountData.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ [Shopee Orders] Erro:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor',
      orders: [],
      total: 0,
      has_more: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Map Shopee status to standardized status
function mapShopeeStatus(shopeeStatus: string): string {
  const statusMap: Record<string, string> = {
    'UNPAID': 'Pendente',
    'TO_SHIP': 'Confirmado',
    'SHIPPED': 'Enviado',
    'TO_CONFIRM_RECEIVE': 'Em Trânsito',
    'IN_CANCEL': 'Cancelando',
    'CANCELLED': 'Cancelado',
    'TO_RETURN': 'Devolvendo',
    'COMPLETED': 'Entregue'
  }
  
  return statusMap[shopeeStatus] || shopeeStatus
}