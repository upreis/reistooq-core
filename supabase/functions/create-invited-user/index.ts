import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  invitation_id: string;
  user_email?: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// Helper para logs estruturados
function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${prefix} [create-invited-user] ${message}`, data ? JSON.stringify(data) : '');
}

// Helper para criar resposta JSON
function jsonResponse(data: Record<string, unknown>, status: number) {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Validação de entrada
function validateInput(body: unknown): { valid: boolean; error?: string; data?: CreateUserRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  
  const { invitation_id, user_email } = body as CreateUserRequest;
  
  if (!invitation_id) {
    return { valid: false, error: 'invitation_id is required' };
  }
  
  if (typeof invitation_id !== 'string') {
    return { valid: false, error: 'invitation_id must be a string' };
  }
  
  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(invitation_id)) {
    return { valid: false, error: 'invitation_id must be a valid UUID' };
  }
  
  if (user_email && typeof user_email !== 'string') {
    return { valid: false, error: 'user_email must be a string if provided' };
  }
  
  return { valid: true, data: { invitation_id, user_email } };
}

// Gerar senha segura
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

// Normalizar string para uso em email
function normalizeForEmail(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();
  let invitationId: string | undefined;

  try {
    // Parse body com tratamento de erro
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      log('error', 'Invalid JSON in request body');
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    // Validar entrada
    const validation = validateInput(body);
    if (!validation.valid || !validation.data) {
      log('error', 'Validation failed', { error: validation.error });
      return jsonResponse({ error: validation.error }, 400);
    }

    const { invitation_id, user_email } = validation.data;
    invitationId = invitation_id;

    log('info', 'Processing invitation', { invitation_id, user_email: user_email ? '***@***' : null });

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      log('error', 'Missing environment variables');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    // Criar cliente admin
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // ============================================================
    // STEP 1: Buscar e validar convite
    // ============================================================
    log('info', 'Step 1: Fetching invitation');
    
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('id, email, username, organization_id, role_id, status, expires_at')
      .eq('id', invitation_id)
      .single();

    if (invError) {
      log('error', 'Failed to fetch invitation', { error: invError.message, code: invError.code });
      
      if (invError.code === 'PGRST116') {
        return jsonResponse({ error: 'Convite não encontrado' }, 404);
      }
      return jsonResponse({ error: `Erro ao buscar convite: ${invError.message}` }, 500);
    }

    if (!invitation) {
      log('error', 'Invitation not found');
      return jsonResponse({ error: 'Convite não encontrado' }, 404);
    }

    // Verificar status do convite
    if (invitation.status === 'accepted') {
      log('warn', 'Invitation already accepted', { invitation_id });
      return jsonResponse({ 
        error: 'Este convite já foi aceito',
        status: 'accepted'
      }, 400);
    }

    if (invitation.status === 'expired') {
      log('warn', 'Invitation expired', { invitation_id });
      return jsonResponse({ 
        error: 'Este convite expirou',
        status: 'expired'
      }, 400);
    }

    if (invitation.status === 'cancelled') {
      log('warn', 'Invitation cancelled', { invitation_id });
      return jsonResponse({ 
        error: 'Este convite foi cancelado',
        status: 'cancelled'
      }, 400);
    }

    if (invitation.status !== 'pending') {
      log('warn', 'Invalid invitation status', { status: invitation.status });
      return jsonResponse({ 
        error: `Status do convite inválido: ${invitation.status}`,
        status: invitation.status
      }, 400);
    }

    // Verificar expiração
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      log('warn', 'Invitation expired by date', { expires_at: invitation.expires_at });
      
      // Atualizar status para expirado
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation_id);
      
      return jsonResponse({ 
        error: 'Este convite expirou',
        status: 'expired'
      }, 400);
    }

    log('info', 'Invitation validated', { 
      username: invitation.username, 
      org_id: invitation.organization_id 
    });

    // ============================================================
    // STEP 2: Buscar dados da organização
    // ============================================================
    log('info', 'Step 2: Fetching organization data');
    
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizacoes')
      .select('id, fantasia, nome, slug')
      .eq('id', invitation.organization_id)
      .single();

    if (orgError) {
      log('error', 'Failed to fetch organization', { 
        error: orgError.message, 
        code: orgError.code,
        org_id: invitation.organization_id 
      });
      return jsonResponse({ 
        error: 'Organização do convite não encontrada' 
      }, 500);
    }

    if (!orgData) {
      log('error', 'Organization not found', { org_id: invitation.organization_id });
      return jsonResponse({ error: 'Organização não encontrada' }, 500);
    }

    // Determinar fantasia para email
    const fantasiaRaw = orgData.fantasia || orgData.nome || orgData.slug || 'org';
    const fantasia = normalizeForEmail(fantasiaRaw);
    const internalEmail = `${fantasia}.${invitation.username}@interno.local`;

    log('info', 'Organization found', { 
      fantasia: fantasiaRaw, 
      normalized: fantasia,
      internal_email: internalEmail 
    });

    // ============================================================
    // STEP 3: Verificar se usuário já existe
    // ============================================================
    log('info', 'Step 3: Checking for existing user');
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === internalEmail);
    
    if (existingUser) {
      log('warn', 'User already exists with this email', { email: internalEmail });
      return jsonResponse({ 
        error: `Já existe um usuário com o login ${fantasia}.${invitation.username}`,
        existing_user: true
      }, 409);
    }

    // ============================================================
    // STEP 4: Criar usuário no auth
    // ============================================================
    log('info', 'Step 4: Creating auth user');
    
    const randomPassword = generateSecurePassword();
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        username: invitation.username,
        organization_id: invitation.organization_id,
        fantasia: fantasia,
        real_email: user_email || invitation.email,
        invited: true,
        created_at: new Date().toISOString()
      }
    });

    if (authError) {
      log('error', 'Failed to create auth user', { 
        error: authError.message,
        code: authError.status
      });
      
      // Tratamento específico de erros
      if (authError.message?.includes('already registered')) {
        return jsonResponse({ 
          error: 'Este email já está registrado no sistema',
          existing_user: true
        }, 409);
      }
      
      return jsonResponse({ 
        error: `Erro ao criar usuário: ${authError.message}` 
      }, 500);
    }

    if (!authData?.user) {
      log('error', 'Auth user creation returned no user');
      return jsonResponse({ error: 'Erro ao criar usuário: resposta inválida' }, 500);
    }

    const userId = authData.user.id;
    log('info', 'Auth user created', { user_id: userId });

    // ============================================================
    // STEP 5: Criar profile
    // ============================================================
    log('info', 'Step 5: Creating profile');
    
    const profileData = {
      id: userId,
      username: invitation.username,
      organizacao_id: invitation.organization_id,
      nome_exibicao: invitation.username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    const profileResult: OperationResult = profileError 
      ? { success: false, error: profileError.message }
      : { success: true };

    if (profileError) {
      log('warn', 'Failed to create profile (non-fatal)', { 
        error: profileError.message,
        code: profileError.code 
      });
    } else {
      log('info', 'Profile created successfully');
    }

    // ============================================================
    // STEP 6: Atribuir cargo
    // ============================================================
    log('info', 'Step 6: Assigning role');
    
    const roleAssignment = {
      user_id: userId,
      role_id: invitation.role_id,
      organization_id: invitation.organization_id
    };

    const { error: roleError } = await supabaseAdmin
      .from('user_role_assignments')
      .insert(roleAssignment);

    const roleResult: OperationResult = roleError 
      ? { success: false, error: roleError.message }
      : { success: true };

    if (roleError) {
      log('warn', 'Failed to assign role (non-fatal)', { 
        error: roleError.message,
        code: roleError.code 
      });
    } else {
      log('info', 'Role assigned successfully');
    }

    // Buscar nome do cargo para o email
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', invitation.role_id)
      .single();

    // ============================================================
    // STEP 7: Atualizar convite
    // ============================================================
    log('info', 'Step 7: Updating invitation status');
    
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_user_id: userId
      })
      .eq('id', invitation_id);

    if (updateError) {
      log('warn', 'Failed to update invitation status (non-fatal)', { 
        error: updateError.message 
      });
    } else {
      log('info', 'Invitation marked as accepted');
    }

    const loginFormat = `${fantasia}.${invitation.username}`;

    // ============================================================
    // STEP 8: Enviar email (opcional)
    // ============================================================
    const emailToSend = user_email || invitation.email;
    let emailSent = false;
    let emailError: string | undefined;

    if (emailToSend && emailToSend.includes('@') && !emailToSend.includes('@interno.local')) {
      log('info', 'Step 8: Sending welcome email');
      
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const resendFrom = Deno.env.get('RESEND_FROM') || 'noreply@resend.dev';
      
      if (!resendApiKey) {
        log('warn', 'RESEND_API_KEY not configured, skipping email');
        emailError = 'Email service not configured';
      } else {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: resendFrom,
              to: emailToSend,
              subject: `Bem-vindo ao ${orgData.nome || 'sistema'}! Suas credenciais de acesso`,
              html: generateWelcomeEmailHtml({
                orgName: orgData.nome || fantasia,
                loginFormat,
                password: randomPassword,
                roleName: roleData?.name
              })
            })
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            log('warn', 'Email API returned error', { 
              status: emailResponse.status, 
              error: errorText 
            });
            emailError = `Email service error: ${emailResponse.status}`;
          } else {
            emailSent = true;
            log('info', 'Welcome email sent successfully');
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          log('warn', 'Failed to send email', { error: errorMsg });
          emailError = errorMsg;
        }
      }
    } else {
      log('info', 'Step 8: Skipping email (no valid address)');
    }

    // ============================================================
    // FINALIZAÇÃO
    // ============================================================
    const duration = Date.now() - startTime;
    
    log('info', 'User creation completed', { 
      user_id: userId,
      login: loginFormat,
      duration_ms: duration,
      profile_created: profileResult.success,
      role_assigned: roleResult.success,
      email_sent: emailSent
    });

    return jsonResponse({
      success: true,
      user_id: userId,
      login: loginFormat,
      password: randomPassword,
      organization: orgData.nome || fantasia,
      role: roleData?.name,
      email_sent: emailSent,
      email_error: emailError,
      warnings: [
        !profileResult.success ? `Profile: ${profileResult.error}` : null,
        !roleResult.success ? `Role: ${roleResult.error}` : null,
      ].filter(Boolean),
      message: `Usuário criado com sucesso! Login: ${loginFormat}`,
      duration_ms: duration
    }, 200);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log('error', 'Unexpected error', { 
      error: errorMessage,
      stack: errorStack,
      invitation_id: invitationId,
      duration_ms: duration
    });

    return jsonResponse({ 
      error: 'Erro interno do servidor',
      details: errorMessage,
      invitation_id: invitationId
    }, 500);
  }
});

// Gerar HTML do email de boas-vindas
function generateWelcomeEmailHtml(params: {
  orgName: string;
  loginFormat: string;
  password: string;
  roleName?: string;
}): string {
  const { orgName, loginFormat, password, roleName } = params;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
    .content { padding: 30px; }
    .credentials { background: #f8f9fa; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #D4AF37; }
    .credential-item { margin: 16px 0; }
    .label { color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; }
    .value { font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; font-size: 18px; color: #1a1a1a; background: white; padding: 10px 14px; border-radius: 6px; display: inline-block; border: 1px solid #e0e0e0; }
    .warning { background: #fff8e1; border: 1px solid #ffe082; padding: 16px; border-radius: 8px; margin-top: 24px; display: flex; align-items: flex-start; gap: 12px; }
    .warning-icon { font-size: 20px; }
    .warning-text { flex: 1; }
    .warning strong { color: #f57c00; }
    .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo ao ${orgName}!</h1>
    </div>
    <div class="content">
      <p>Olá!</p>
      <p>Sua conta foi criada com sucesso. Abaixo estão suas credenciais de acesso:</p>
      
      <div class="credentials">
        <div class="credential-item">
          <div class="label">Login</div>
          <div class="value">${loginFormat}</div>
        </div>
        <div class="credential-item">
          <div class="label">Senha</div>
          <div class="value">${password}</div>
        </div>
        ${roleName ? `
        <div class="credential-item">
          <div class="label">Cargo</div>
          <div class="value">${roleName}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="warning">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <strong>Importante:</strong> Guarde essas credenciais em um local seguro. Recomendamos que você altere sua senha após o primeiro acesso.
        </div>
      </div>
    </div>
    <div class="footer">
      Este email foi enviado automaticamente. Por favor, não responda.
    </div>
  </div>
</body>
</html>
  `.trim();
}
