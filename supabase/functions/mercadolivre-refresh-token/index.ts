import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { makeClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefreshTokenRequest {
  integration_account_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const client = makeClient(authHeader);
    const { integration_account_id }: RefreshTokenRequest = await req.json();

    if (!integration_account_id) {
      throw new Error('integration_account_id is required');
    }

    // Get current user from JWT
    const userId = JSON.parse(atob(authHeader.replace('Bearer ', '').split('.')[1])).sub;

    // Get organization ID securely via RPC (bypasses RLS safely)
    const serviceClient = makeClient(null);
    const { data: organizationId, error: orgError } = await serviceClient
      .rpc('get_user_organization_id', { target_user_id: userId });
    if (orgError) {
      console.error('Organization lookup error (refresh):', orgError);
      throw new Error('User organization not found');
    }
    if (!organizationId) {
      throw new Error('User organization not found');
    }

    // Get ML credentials
    const ML_CLIENT_ID = Deno.env.get('ML_CLIENT_ID');
    const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET');
    
    if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
      throw new Error('ML credentials not configured');
    }

    // Get current tokens using secure function
    const { data: tokenData, error: tokenError } = await client
      .rpc('get_integration_secret_secure', {
        account_id: integration_account_id,
        provider_name: 'mercadolivre',
        requesting_function: 'refresh_token'
      })
      .single();

    if (tokenError || !tokenData?.refresh_token) {
      console.error('Failed to get refresh token:', tokenError);
      throw new Error('Refresh token not available or expired');
    }

    console.log('Refreshing ML token:', {
      account_id: integration_account_id,
      has_refresh_token: !!tokenData.refresh_token,
      expires_at: tokenData.expires_at,
    });

    // Call ML refresh token endpoint
    const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        refresh_token: tokenData.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Token refresh failed:', {
        status: refreshResponse.status,
        statusText: refreshResponse.statusText,
        error: errorText,
        account_id: integration_account_id,
      });
      
      // Handle specific refresh errors
      if (refreshResponse.status === 400) {
        if (errorText.includes('invalid_grant')) {
          throw new Error('REFRESH_TOKEN_EXPIRED');
        }
        if (errorText.includes('invalid_client')) {
          throw new Error('INVALID_CLIENT_CREDENTIALS');
        }
      }
      
      if (refreshResponse.status === 401) {
        throw new Error('UNAUTHORIZED_CLIENT');
      }
      
      throw new Error(`Token refresh failed: ${refreshResponse.status} - ${errorText}`);
    }

    const newTokenData = await refreshResponse.json();
    
    if (!newTokenData.access_token) {
      throw new Error('Invalid refresh response - no access token');
    }

    // Calculate new expiration
    const expiresAt = newTokenData.expires_in 
      ? new Date(Date.now() + newTokenData.expires_in * 1000)
      : new Date(Date.now() + 6 * 60 * 60 * 1000); // Default 6 hours

    // Update stored tokens
    const { error: updateError } = await client.rpc('encrypt_integration_secret', {
      p_account_id: integration_account_id,
      p_provider: 'mercadolivre',
      p_client_id: ML_CLIENT_ID,
      p_client_secret: ML_CLIENT_SECRET,
      p_access_token: newTokenData.access_token,
      p_refresh_token: newTokenData.refresh_token || tokenData.refresh_token, // Keep old refresh token if not renewed
      p_expires_at: expiresAt.toISOString(),
      p_payload: {
        ...tokenData.payload,
        scope: newTokenData.scope || tokenData.payload?.scope,
        token_type: newTokenData.token_type || 'Bearer',
        refreshed_at: new Date().toISOString(),
      },
      p_encryption_key: Deno.env.get('APP_ENCRYPTION_KEY'),
    });

    if (updateError) {
      console.error('Failed to update refreshed tokens:', updateError);
      throw new Error('Failed to store refreshed tokens');
    }

    console.log('ML token refreshed successfully:', {
      account_id: integration_account_id,
      new_expires_at: expiresAt.toISOString(),
      has_new_refresh_token: !!newTokenData.refresh_token,
    });

    return new Response(JSON.stringify({
      success: true,
      access_token: newTokenData.access_token,
      expires_at: expiresAt.toISOString(),
      refreshed_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to refresh token',
      code: error.message === 'REFRESH_TOKEN_EXPIRED' ? 'REFRESH_TOKEN_EXPIRED' : 'REFRESH_FAILED',
    }), {
      status: error.message === 'REFRESH_TOKEN_EXPIRED' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});