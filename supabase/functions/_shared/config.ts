// Configuração compartilhada entre edge functions
// Falha imediatamente se faltar env crítica

export function mustEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

// Hash para comparar chaves sem expor valor
export async function sha256hex(s: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Configurações do Supabase
export const SUPABASE_URL = mustEnv("SUPABASE_URL");
export const SERVICE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
export const ANON_KEY = mustEnv("SUPABASE_ANON_KEY");
export const CRYPTO_KEY = mustEnv("APP_ENCRYPTION_KEY"); // ÚNICA chave suportada