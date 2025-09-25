import { corsHeaders, makeClient } from "../_shared/client.ts";
import { Resend } from "https://esm.sh/resend@2.1.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const DEFAULT_FROM = "Sistema <no-reply@convite.reistoq.com.br>";
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || DEFAULT_FROM;

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
    // Always use service role client (no user RLS)
    const client = makeClient(null);
    
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

    // Get invitation details (no nested relations to avoid FK dependency)
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

    // Optionally resolve names for email content
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

    // Generate invitation URL - use production domain
    const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://app.reistoq.com.br';
    const inviteUrl = `${baseUrl}/convite/${invitation.token}`;

    console.log('Sending email to:', invitation.email);

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [invitation.email],
      subject: `Convite para ${orgName || 'organização'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Você foi convidado!</h2>
          <p>Olá,</p>
          <p>Você foi convidado para participar da organização <strong>${orgName || 'organização'}</strong> como <strong>${roleName || 'usuário'}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
            ${inviteUrl}
          </p>
          
          <p><small>Este convite expira em ${new Date(invitation.expires_at).toLocaleDateString('pt-BR')}.</small></p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Se você não solicitou este convite, pode ignorar este email com segurança.
          </p>
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
        message: "Invitation email sent successfully",
        email_id: emailResult.data?.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);