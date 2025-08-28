import { corsHeaders, makeClient } from "../_shared/client.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const authHeader = req.headers.get("Authorization");
    const client = makeClient(authHeader);
    
    const body = await req.json();
    const { invitation_id } = body;

    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: "invitation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get invitation details
    const { data: invitation, error: invError } = await client
      .from('invitations')
      .select(`
        *,
        roles (
          name
        ),
        organizacoes (
          nome
        )
      `)
      .eq('id', invitation_id)
      .single();

    if (invError || !invitation) {
      console.error('Invitation query error:', invError);
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Found invitation:', invitation.id, 'for email:', invitation.email);

    // Generate invitation URL
    const inviteUrl = `${req.headers.get('origin') || 'https://reistoq.com.br'}/convite/${invitation.token}`;

    console.log('Sending email to:', invitation.email);

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: "Sistema <convites@convite.reistoq.com.br>",
      to: [invitation.email],
      subject: `Convite para ${invitation.organizacoes?.nome || 'organização'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Você foi convidado!</h2>
          <p>Olá,</p>
          <p>Você foi convidado para participar da organização <strong>${invitation.organizacoes?.nome || 'organização'}</strong> como <strong>${invitation.roles?.name || 'usuário'}</strong>.</p>
          
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