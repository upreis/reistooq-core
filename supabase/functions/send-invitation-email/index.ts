import { corsHeaders, makeServiceClient } from "../_shared/client.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const DEFAULT_FROM = "Sistema REISTOQ <no-reply@convite.reistoq.com.br>";
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || DEFAULT_FROM;

// Generate a random password
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Use service role client to bypass RLS
    const client = makeServiceClient();
    
    const body = await req.json();
    const { invitation_id } = body;

    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: "invitation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Secrets sanity checks
    if (!Deno.env.get('RESEND_API_KEY')) {
      console.error('Missing RESEND_API_KEY secret');
      return new Response(
        JSON.stringify({ error: 'Email service not configured', details: 'RESEND_API_KEY is missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!FROM_EMAIL || !FROM_EMAIL.includes('@')) {
      console.error('Invalid FROM_EMAIL:', FROM_EMAIL);
      return new Response(
        JSON.stringify({ error: 'Invalid sender address', details: 'Configure RESEND_FROM with a verified domain (ex: Sistema <convite@convite.reistoq.com.br>)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invitation details
    const { data: invitation, error: invError } = await client
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (invError || !invitation) {
      console.error('Invitation query error:', invError, 'id:', invitation_id);
      return new Response(
        JSON.stringify({ error: "Invitation not found", details: invError?.message, id: invitation_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve names for email content
    let orgName: string | undefined = undefined;
    let roleName: string | undefined = undefined;
    try {
      const { data: org } = await client.from('organizacoes').select('nome').eq('id', invitation.organization_id).single();
      orgName = org?.nome;
    } catch { /* ignore */ }
    try {
      const { data: role } = await client.from('roles').select('name').eq('id', invitation.role_id).single();
      roleName = role?.name;
    } catch { /* ignore */ }

    console.log('Found invitation:', invitation.id, 'for email:', invitation.email);

    // Generate temporary password for the user
    const tempPassword = generatePassword(12);

    // Helper: ensure profile exists (but DO NOT link to org before the user accepts)
    const ensureProfileExists = async (userId: string) => {
      // Try insert; if already exists, do nothing.
      const { error: insErr } = await client
        .from('profiles')
        .insert({
          id: userId,
          nome_completo: invitation.email.split('@')[0],
          nome_exibicao: invitation.email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle();

      // Ignore duplicate errors, but log everything else.
      if (insErr && insErr.code !== '23505') {
        console.error('Failed to ensure profile exists:', insErr);
      }

      // Audit current profile org linkage (should be null until acceptance)
      const { data: finalProfile, error: readErr } = await client
        .from('profiles')
        .select('id, organizacao_id, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (readErr) {
        console.error('Failed to read profile after ensure:', readErr);
      } else {
        console.log('Profile state after ensure (pre-accept):', finalProfile);
      }
    };

    // Check if user already exists
    const { data: existingUsers } = await client.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === invitation.email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User already exists, just update their password
      userId = existingUser.id;
      console.log('User already exists:', userId);

      // Update password for existing user
      const { error: updateError } = await client.auth.admin.updateUserById(userId, {
        password: tempPassword
      });

      if (updateError) {
        console.error('Failed to update user password:', updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update user", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await ensureProfileExists(userId);
    } else {
      // Create new user with the generated password
      isNewUser = true;
      const { data: newUser, error: createError } = await client.auth.admin.createUser({
        email: invitation.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          invited_by: 'system'
        }
      });

      if (createError || !newUser?.user) {
        console.error('Failed to create user:', createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      console.log('Created new user:', userId);

      await ensureProfileExists(userId);
    }

    // IMPORTANT:
    // - Do NOT assign roles here
    // - Do NOT change invitation status here
    // The user must accept the invitation link so the DB function can atomically link org + role.


    // Generate URLs
    const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://www.reistoq.com.br';
    const acceptUrl = `${baseUrl}/convite/${invitation.token}`;
    const loginUrl = `${baseUrl}/auth`;

    console.log('Sending email to:', invitation.email);

    // Send email with credentials + acceptance link
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [invitation.email],
      subject: `Convite para ${orgName || 'REISTOQ'} - aceite para entrar`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Convite para o REISTOQ</h2>
            
            <p style="color: #4b5563;">Olá,</p>
            
            <p style="color: #4b5563;">
              Você foi convidado(a) para entrar na organização <strong>${orgName || 'organização'}</strong> como <strong>${roleName || 'usuário'}</strong>.
            </p>

            <div style="text-align: center; margin: 26px 0;">
              <a href="${acceptUrl}"
                 style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                Aceitar convite
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 0;">
              Ao aceitar, sua conta será vinculada automaticamente à organização.
            </p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">Suas credenciais de acesso</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${invitation.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Senha temporária:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-family: monospace; font-size: 16px; background: #fef3c7; padding: 5px 10px; border-radius: 4px;">${tempPassword}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Importante:</strong> após o primeiro acesso, altere sua senha nas configurações da conta.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">Link do convite:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 13px; color: #1f2937;">${acceptUrl}</p>

            <p style="color: #6b7280; font-size: 14px;">Se precisar abrir o sistema diretamente: ${loginUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Se você não solicitou este acesso, pode ignorar este email com segurança.
            </p>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Email sent successfully:', emailResult.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser ? "User created and email sent successfully" : "User updated and email sent successfully",
        email_id: emailResult.data?.id,
        user_id: userId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error sending invitation email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
