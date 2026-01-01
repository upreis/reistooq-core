import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  invitation_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id } = await req.json() as CreateUserRequest;

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
    
    console.log('[create-invited-user] Creating auth user with email:', invitation.email);

    // Create user in auth.users using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: randomPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        username: invitation.username,
        organization_id: invitation.organization_id,
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

    // Get org slug for login display
    const { data: org } = await supabaseAdmin
      .from('organizacoes')
      .select('slug, nome')
      .eq('id', invitation.organization_id)
      .single();

    const loginFormat = org ? `${org.slug}.${invitation.username}` : invitation.email;

    console.log('[create-invited-user] User created successfully. Login:', loginFormat);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        login: loginFormat,
        password: randomPassword, // Return password so admin can share with user
        organization: org?.nome || 'Organização',
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
