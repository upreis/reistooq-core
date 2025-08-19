import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

export const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;

export function ok(data: any) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    headers: { "Content-Type": "application/json" }
  });
}

export function fail(error: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export function getMlConfig() {
  const clientId = Deno.env.get('ML_CLIENT_ID');
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET');
  const redirectUri = Deno.env.get('ML_REDIRECT_URI');
  const siteId = Deno.env.get('ML_SITE_ID') || 'MLB';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing ML secrets: ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI are required');
  }

  return { clientId, clientSecret, redirectUri, siteId };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export { corsHeaders };