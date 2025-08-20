import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Log the deprecated function call
  console.warn('[DEPRECATED] integrations-get-secret function called - this function has been deprecated');
  console.warn('[DEPRECATED] Use encrypt_integration_secret/get_integration_secret_secure RPCs instead');
  console.warn('[DEPRECATED] Request details:', {
    method: req.method,
    headers: Object.fromEntries(req.headers),
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
  });

  try {
    const body = await req.text();
    console.warn('[DEPRECATED] Request body:', body);
  } catch (e) {
    console.warn('[DEPRECATED] Could not read request body:', e);
  }

  // Return 410 Gone status
  return new Response(JSON.stringify({
    ok: false,
    error: 'This function has been deprecated and removed',
    code: 'FUNCTION_DEPRECATED',
    message: 'integrations-get-secret has been replaced with database RPCs. Use get_integration_secret_secure() instead.',
    timestamp: new Date().toISOString()
  }), {
    status: 410,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
});