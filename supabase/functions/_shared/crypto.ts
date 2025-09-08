// supabase/functions/_shared/crypto.ts
// Criptografia padrão AES-GCM usado em integrations-store-secret
// Garantia de compatibilidade total entre store/get/unified-orders

export async function deriveAesKey(keyMaterial: string) {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(keyMaterial));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

// Helpers básicos de (de)serialização — idêntico ao store-secret
function b64ToU8(b64: string) { 
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); 
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
  const { iv, data } = JSON.parse(atob(payloadB64));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToU8(iv) }, key, b64ToU8(data));
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