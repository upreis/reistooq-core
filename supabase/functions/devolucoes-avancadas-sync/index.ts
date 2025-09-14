import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MLTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

Deno.serve(async (req) => {
  console.log('[Devoluções Avançadas Sync] Request received:', req.method)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { account_ids } = await req.json()
    console.log('[Devoluções Avançadas Sync] Account IDs received:', account_ids)

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      console.log('[Devoluções Avançadas Sync] No account IDs provided')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'account_ids array is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalProcessed = 0
    let totalSaved = 0
    let errors: string[] = []

    // Process each account
    for (const accountId of account_ids) {
      console.log(`[Devoluções Avançadas Sync] Processing account: ${accountId}`)
      
      try {
        // Get tokens for this account
        const { data: secretData, error: secretError } = await supabase
          .from('integration_secrets')
          .select('simple_tokens')
          .eq('integration_account_id', accountId)
          .eq('provider', 'mercadolivre')
          .single()

        if (secretError || !secretData?.simple_tokens) {
          console.error(`[Devoluções Avançadas Sync] No tokens found for account ${accountId}:`, secretError)
          errors.push(`Account ${accountId}: No tokens found`)
          continue
        }

        // Decrypt tokens
        const { data: decryptedData, error: decryptError } = await supabase.rpc(
          'decrypt_simple', 
          { encrypted_data: secretData.simple_tokens }
        )

        if (decryptError || !decryptedData) {
          console.error(`[Devoluções Avançadas Sync] Failed to decrypt tokens for account ${accountId}:`, decryptError)
          errors.push(`Account ${accountId}: Failed to decrypt tokens`)
          continue
        }

        const tokens: MLTokens = JSON.parse(decryptedData)
        console.log(`[Devoluções Avançadas Sync] Tokens decrypted for account ${accountId}`)

        // Fetch orders from MercadoLivre API
        const ordersUrl = 'https://api.mercadolibre.com/orders/search?seller_id=me&order.status=paid,cancelled&sort=date_desc&limit=50'
        
        console.log(`[Devoluções Avançadas Sync] Fetching orders for account ${accountId}`)
        const ordersResponse = await fetch(ordersUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!ordersResponse.ok) {
          console.error(`[Devoluções Avançadas Sync] Failed to fetch orders for account ${accountId}:`, ordersResponse.status)
          errors.push(`Account ${accountId}: Failed to fetch orders (${ordersResponse.status})`)
          continue
        }

        const ordersData = await ordersResponse.json()
        console.log(`[Devoluções Avançadas Sync] Found ${ordersData.results?.length || 0} orders for account ${accountId}`)

        if (!ordersData.results || ordersData.results.length === 0) {
          console.log(`[Devoluções Avançadas Sync] No orders found for account ${accountId}`)
          continue
        }

        // Process each order
        for (const order of ordersData.results) {
          totalProcessed++
          
          try {
            console.log(`[Devoluções Avançadas Sync] Processing order ${order.id}`)

            // Check if already exists
            const { data: existingData } = await supabase
              .from('devolucoes_avancadas')
              .select('id')
              .eq('order_id', order.id.toString())
              .eq('integration_account_id', accountId)
              .single()

            if (existingData) {
              console.log(`[Devoluções Avançadas Sync] Order ${order.id} already exists, skipping`)
              continue
            }

            // Fetch claims for this order
            let claimsData = null
            try {
              const claimsUrl = `https://api.mercadolibre.com/orders/${order.id}/claims`
              const claimsResponse = await fetch(claimsUrl, {
                headers: {
                  'Authorization': `Bearer ${tokens.access_token}`,
                  'Content-Type': 'application/json'
                }
              })

              if (claimsResponse.ok) {
                claimsData = await claimsResponse.json()
                console.log(`[Devoluções Avançadas Sync] Found ${claimsData?.length || 0} claims for order ${order.id}`)
              }
            } catch (claimError) {
              console.warn(`[Devoluções Avançadas Sync] Failed to fetch claims for order ${order.id}:`, claimError)
            }

            // Fetch returns for each claim
            let returnsData = null
            if (claimsData && claimsData.length > 0) {
              try {
                const returnPromises = claimsData.map(async (claim: any) => {
                  try {
                    const returnUrl = `https://api.mercadolibre.com/claims/${claim.id}/return`
                    const returnResponse = await fetch(returnUrl, {
                      headers: {
                        'Authorization': `Bearer ${tokens.access_token}`,
                        'Content-Type': 'application/json'
                      }
                    })

                    if (returnResponse.ok) {
                      return await returnResponse.json()
                    }
                  } catch (returnError) {
                    console.warn(`[Devoluções Avançadas Sync] Failed to fetch return for claim ${claim.id}:`, returnError)
                  }
                  return null
                })

                const returns = await Promise.all(returnPromises)
                returnsData = returns.filter(r => r !== null)
                console.log(`[Devoluções Avançadas Sync] Found ${returnsData.length} returns for order ${order.id}`)
              } catch (returnError) {
                console.warn(`[Devoluções Avançadas Sync] Failed to fetch returns for order ${order.id}:`, returnError)
              }
            }

            // Prepare data for insertion
            const devolucaoData = {
              order_id: order.id.toString(),
              claim_id: claimsData?.[0]?.id?.toString() || null,
              return_id: returnsData?.[0]?.id?.toString() || null,
              data_criacao: order.date_created ? new Date(order.date_created).toISOString() : null,
              data_fechamento: order.date_closed ? new Date(order.date_closed).toISOString() : null,
              ultima_atualizacao: order.last_updated ? new Date(order.last_updated).toISOString() : null,
              status_devolucao: order.status || null,
              status_envio: order.shipping?.status || null,
              status_dinheiro: order.payments?.[0]?.status || null,
              reembolso_quando: null, // Will be filled based on specific logic later
              valor_retido: order.total_amount || 0,
              codigo_rastreamento: order.shipping?.id?.toString() || null,
              destino_tipo: null, // Will be filled based on return data
              destino_endereco: order.shipping?.receiver_address || null,
              dados_order: order,
              dados_claim: claimsData?.[0] || null,
              dados_return: returnsData?.[0] || null,
              integration_account_id: accountId,
              processado_em: new Date().toISOString()
            }

            // Insert into database
            const { error: insertError } = await supabase
              .from('devolucoes_avancadas')
              .insert(devolucaoData)

            if (insertError) {
              console.error(`[Devoluções Avançadas Sync] Failed to insert order ${order.id}:`, insertError)
              errors.push(`Order ${order.id}: ${insertError.message}`)
            } else {
              totalSaved++
              console.log(`[Devoluções Avançadas Sync] Successfully saved order ${order.id}`)
            }

          } catch (orderError) {
            console.error(`[Devoluções Avançadas Sync] Error processing order ${order.id}:`, orderError)
            errors.push(`Order ${order.id}: ${orderError.message}`)
          }
        }

      } catch (accountError) {
        console.error(`[Devoluções Avançadas Sync] Error processing account ${accountId}:`, accountError)
        errors.push(`Account ${accountId}: ${accountError.message}`)
      }
    }

    const result = {
      success: true,
      totalProcessed,
      totalSaved,
      errors: errors.length > 0 ? errors : null
    }

    console.log('[Devoluções Avançadas Sync] Sync completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[Devoluções Avançadas Sync] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})