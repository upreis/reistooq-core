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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorização não fornecido')
    }
    const jwt = authHeader.replace('Bearer ', '')

    // Create user client to validate the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    })

    // Verify user is authenticated and get their profile
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ [Store Secret] Usuário não autenticado:', userError?.message)
      throw new Error('Usuário não autenticado')
    }

    console.log('🔐 [Store Secret] Usuário autenticado:', user.id)

    // Get user's organization from profiles
    const { data: profileData, error: profileError } = await userClient
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData?.organizacao_id) {
      console.error('❌ [Store Secret] Perfil não encontrado:', profileError?.message)
      throw new Error('Perfil do usuário não encontrado')
    }

    const userOrganizationId = profileData.organizacao_id
    console.log('🔐 [Store Secret] Organização do usuário:', userOrganizationId)

    const { integration_account_id, provider, payload } = await req.json()

    if (!integration_account_id || !provider || !payload) {
      throw new Error('Parâmetros obrigatórios: integration_account_id, provider, payload')
    }

    console.log('🔐 [Store Secret] Salvando credenciais para:', { integration_account_id, provider })

    // Use service role to get integration account (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get organization_id from integration account
    const { data: accountData, error: accountError } = await serviceClient
      .from('integration_accounts')
      .select('organization_id')
      .eq('id', integration_account_id)
      .single()

    if (accountError || !accountData) {
      console.error('❌ [Store Secret] Conta não encontrada:', accountError?.message)
      throw new Error('Conta de integração não encontrada')
    }

    // CRITICAL: Verify user belongs to the same organization as the integration account
    if (accountData.organization_id !== userOrganizationId) {
      console.error('❌ [Store Secret] Acesso negado - organização diferente:', {
        userOrg: userOrganizationId,
        accountOrg: accountData.organization_id
      })
      throw new Error('Acesso negado: você não tem permissão para modificar esta conta de integração')
    }

    console.log('✅ [Store Secret] Autorização validada - mesma organização')

    // Encrypt the payload using simple encryption
    const { data: encryptedPayload, error: encryptError } = await serviceClient.rpc('encrypt_simple', {
      data: JSON.stringify(payload)
    })

    if (encryptError) {
      throw new Error(`Erro ao criptografar: ${encryptError.message}`)
    }

    // Store the encrypted secrets using upsert with proper conflict resolution
    const { error: insertError } = await serviceClient
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
    
    const isAuthError = error instanceof Error && 
      (error.message.includes('não autenticado') || 
       error.message.includes('Acesso negado') ||
       error.message.includes('não encontrado'))
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }), {
      status: isAuthError ? 403 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
