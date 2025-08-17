import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: { headers: { Authorization: authHeader ?? "" } }
  });
}

export const ENC_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;