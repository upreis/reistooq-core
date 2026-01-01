import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  invitation_id: string;
  user_email?: string; // Email real para enviar convite
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id, user_email } = await req.json() as CreateUserRequest;

    if (!invitation_id) {
      console.error('Missing invitation_id');
      return new Response(
        JSON.stringify({ error: 'invitation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-invited-user] Processing invitation:', invitation_id);

    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get invitation details
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select(`
        id,
        email,
        username,
        organization_id,
        role_id,
        status,
        expires_at
      `)
      .eq('id', invitation_id)
      .single();

    if (invError || !invitation) {
      console.error('Invitation not found:', invError);
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invitation.status !== 'pending') {
      console.log('Invitation already processed:', invitation.status);
      return new Response(
        JSON.stringify({ error: 'Invitation already processed', status: invitation.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate random password (12 chars)
    const randomPassword = crypto.randomUUID().slice(0, 12);
    
    // Get org fantasia for email generation
    const { data: orgData } = await supabaseAdmin
      .from('organizacoes')
      .select('fantasia, nome')
      .eq('id', invitation.organization_id)
      .single();

    // Normaliza fantasia para minúsculas para consistência
    const fantasia = (orgData?.fantasia || 'org').toLowerCase();
    const internalEmail = `${fantasia}.${invitation.username}@interno.local`;
    
    console.log('[create-invited-user] Creating auth user with email:', internalEmail);

    // Create user in auth.users using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: randomPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        username: invitation.username,
        organization_id: invitation.organization_id,
        fantasia: fantasia,
        real_email: user_email || invitation.email, // Store real email for reference
        invited: true
      }
    });

    if (authError) {
      console.error('Failed to create auth user:', authError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log('[create-invited-user] Auth user created:', userId);

    // Create profile with username and organization
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        username: invitation.username,
        organizacao_id: invitation.organization_id,
        nome_exibicao: invitation.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      // Don't fail completely, user was created
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id: invitation.role_id,
        organization_id: invitation.organization_id
      });

    if (roleError) {
      console.error('Failed to assign role:', roleError);
      // Don't fail completely
    }

    // Get role name for email
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', invitation.role_id)
      .single();

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Failed to update invitation:', updateError);
    }

    const loginFormat = `${fantasia}.${invitation.username}`;

    // Send email with credentials if user_email is provided
    const emailToSend = user_email || invitation.email;
    if (emailToSend && emailToSend.includes('@') && !emailToSend.includes('@interno.local')) {
      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const resendFrom = Deno.env.get('RESEND_FROM') || 'noreply@resend.dev';
        
        if (resendApiKey) {
          console.log('[create-invited-user] Sending email to:', emailToSend);
          
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: resendFrom,
              to: emailToSend,
              subject: `Bem-vindo ao ${orgData?.nome || 'sistema'}! Suas credenciais de acesso`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 24px; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37; }
                    .credential-item { margin: 15px 0; }
                    .label { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .value { font-family: monospace; font-size: 18px; color: #1a1a1a; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
                    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                    .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>🎉 Bem-vindo ao ${orgData?.nome || 'Sistema'}!</h1>
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
                        <div class="value">${randomPassword}</div>
                      </div>
                      ${roleData?.name ? `
                      <div class="credential-item">
                        <div class="label">Cargo</div>
                        <div class="value">${roleData.name}</div>
                      </div>
                      ` : ''}
                    </div>
                    
                    <div class="warning">
                      <strong>⚠️ Importante:</strong> Guarde essas credenciais em um local seguro. Recomendamos que você altere sua senha após o primeiro acesso.
                    </div>
                    
                    <p class="footer">
                      Este email foi enviado automaticamente. Por favor, não responda.
                    </p>
                  </div>
                </body>
                </html>
              `
            })
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Failed to send email:', errorText);
          } else {
            console.log('[create-invited-user] Email sent successfully');
          }
        } else {
          console.log('[create-invited-user] RESEND_API_KEY not configured, skipping email');
        }
      } catch (emailError) {
        console.error('[create-invited-user] Error sending email:', emailError);
        // Don't fail the whole operation if email fails
      }
    }

    console.log('[create-invited-user] User created successfully. Login:', loginFormat);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        login: loginFormat,
        password: randomPassword, // Return password so admin can share with user
        organization: orgData?.nome || fantasia,
        email_sent: !!emailToSend && emailToSend.includes('@') && !emailToSend.includes('@interno.local'),
        message: `Usuário criado com sucesso! Login: ${loginFormat}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-invited-user] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
