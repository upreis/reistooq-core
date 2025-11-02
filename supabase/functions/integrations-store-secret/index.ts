import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔐 [Store Secret] Iniciando...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { integration_account_id, provider, payload } = await req.json()

    if (!integration_account_id || !provider || !payload) {
      throw new Error('Parâmetros obrigatórios: integration_account_id, provider, payload')
    }

    console.log('🔐 [Store Secret] Salvando credenciais para:', { integration_account_id, provider })

    // Get organization_id from integration account
    const { data: accountData, error: accountError } = await supabase
      .from('integration_accounts')
      .select('organization_id')
      .eq('id', integration_account_id)
      .single()

    if (accountError || !accountData) {
      throw new Error('Conta de integração não encontrada')
    }

    // Encrypt the payload using simple encryption
    const { data: encryptedPayload, error: encryptError } = await supabase.rpc('encrypt_simple', {
      data: JSON.stringify(payload)
    })

    if (encryptError) {
      throw new Error(`Erro ao criptografar: ${encryptError.message}`)
    }

    // Store the encrypted secrets using upsert with proper conflict resolution
    const { error: insertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_account_id,
        provider,
        simple_tokens: encryptedPayload,
        expires_at: payload.expires_at || null,
        use_simple: true,
        organization_id: accountData.organization_id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'integration_account_id,provider'
      })

    if (insertError) {
      throw new Error(`Erro ao salvar: ${insertError.message}`)
    }

    console.log('✅ [Store Secret] Credenciais salvas com sucesso')

    return new Response(JSON.stringify({
      success: true,
      message: 'Credenciais salvas com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ [Store Secret] Erro:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})