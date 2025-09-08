// supabase/functions/_shared/crypto.ts
// Criptografia padrão AES-GCM usado em integrations-store-secret
// Garantia de compatibilidade total entre store/get/unified-orders

export async function deriveAesKey(keyMaterial: string) {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(keyMaterial));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

// Helpers básicos de (de)serialização — idêntico ao store-secret
function normalizeB64(b64: string) {
  if (!b64) return b64;
  // Converter base64url para base64 e repor padding
  let s = b64.replace(/-/g, '+').replace(/_/g, '/').trim();
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return s;
}

function b64ToU8(b64: string) { 
  return Uint8Array.from(atob(normalizeB64(b64)), c => c.charCodeAt(0)); 
}

function u8ToB64(u8: Uint8Array) { 
  return btoa(String.fromCharCode(...u8)); 
}

export async function encryptAESGCM(plain: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return btoa(JSON.stringify({ iv: u8ToB64(iv), data: u8ToB64(new Uint8Array(cipher)) }));
}

export async function decryptAESGCM(payloadB64: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);

  // Aceitar tanto base64/base64url quanto JSON puro
  let parsed: { iv: string; data: string };
  const trimmed = (payloadB64 || '').trim();
  if (trimmed.startsWith('{')) {
    // Já é JSON serializado
    parsed = JSON.parse(trimmed);
  } else {
    // Normalizar e decodificar base64 (inclui base64url e padding ausente)
    const decoded = atob(normalizeB64(trimmed));
    parsed = JSON.parse(decoded);
  }

  const ivU8 = b64ToU8(parsed.iv);
  const dataU8 = b64ToU8(parsed.data);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivU8 }, key, dataU8);
  return new TextDecoder().decode(plain);
}

// Fallback para compatibilidade com métodos legados
export async function decryptCompat(
  payloadB64: string, 
  keyMaterial: string, 
  legacy?: (p: string, k: string) => Promise<string>
) {
  try { 
    return await decryptAESGCM(payloadB64, keyMaterial); 
  } catch (error) {
    console.warn('[crypto] AES-GCM decrypt failed, trying legacy fallback:', error);
    if (legacy) {
      try {
        return await legacy(payloadB64, keyMaterial);
      } catch (legacyError) {
        console.error('[crypto] Legacy decrypt also failed:', legacyError);
      }
    }
    throw new Error(`decrypt failed (AES-GCM): ${error}`);
  }
}