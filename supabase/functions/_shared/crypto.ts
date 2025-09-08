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

function hexToU8(hex: string) {
  const clean = hex.replace(/^\\x/i, '').replace(/^0x/i, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return out;
}

function strToU8(str: string) {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i);
  return out;
}

export async function encryptAESGCM(plain: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return btoa(JSON.stringify({ iv: u8ToB64(iv), data: u8ToB64(new Uint8Array(cipher)) }));
}

export async function decryptAESGCM(payload: any, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);

  // Aceitar múltiplos formatos de entrada:
  // - Objeto { iv, data }
  // - JSON direto (string)
  // - JSON com aspas (string contendo "{...}")
  // - base64/base64url de um JSON
  // - base64 do buffer (iv||cipher) — usado por integrations-store-secret
  // - hex do buffer ("\\x...") — quando bytea vem em formato hex
  let parsed: { iv: string; data: string } | null = null;
  let packedU8: Uint8Array | null = null;
  let decryptPath = 'unknown';

  const tryJsonParseEnvelope = (str: string) => {
    try {
      const j = JSON.parse(str);
      if (j && typeof j === 'object' && 'iv' in j && 'data' in j) {
        parsed = j as any;
        decryptPath = decryptPath === 'unknown' ? 'direct-json' : decryptPath;
        return true;
      }
      if (typeof j === 'string') {
        const inner = j.trim();
        if (inner.startsWith('{')) {
          try {
            const j2 = JSON.parse(inner);
            if (j2 && typeof j2 === 'object' && 'iv' in j2 && 'data' in j2) {
              parsed = j2 as any;
              decryptPath = 'json-quoted';
              return true;
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    return false;
  };

  try {
    if (payload && typeof payload === 'object') {
      // Já veio como objeto
      parsed = payload as any;
      decryptPath = 'object';
    } else {
      let s = String(payload ?? '').trim();

      // Caso bytea em hex ("\\x...")
      if (!parsed && (s.startsWith('\\x') || s.startsWith('0x'))) {
        try {
          const u8 = hexToU8(s);
          if (u8.length > 12) {
            packedU8 = u8;
            decryptPath = 'packed-hex';
          }
        } catch { /* ignore */ }
      }

      // Tentar JSON direto (inclui caso com aspas)
      if (!parsed && !packedU8 && (s.startsWith('{') || s.startsWith('"'))) {
        tryJsonParseEnvelope(s);
      }

      // Tentar base64
      if (!parsed && !packedU8) {
        try {
          const decoded = atob(normalizeB64(s));
          // Primeiro, tentar interpretar como JSON
          if (!tryJsonParseEnvelope(decoded)) {
            // Alguns sistemas duplamente codificam o JSON em string
            try {
              const maybe = JSON.parse(decoded);
              if (typeof maybe === 'string') {
                tryJsonParseEnvelope(maybe);
                if (parsed) decryptPath = 'base64-json-quoted';
              }
            } catch { /* ignore */ }
            // Se ainda não deu, pode ser o formato (iv||cipher)
            if (!parsed) {
              const u8 = strToU8(decoded);
              if (u8.length > 12) {
                packedU8 = u8;
                decryptPath = 'packed-b64';
              } else {
                decryptPath = 'base64-normalized';
              }
            }
          }
        } catch { /* ignore */ }
      }
    }
  } catch (e) {
    console.warn('[crypto] decrypt input parse failed:', e);
  }

  // Caminho 1: envelope JSON
  if (parsed && parsed.iv && parsed.data) {
    const ivU8 = b64ToU8(parsed.iv);
    const dataU8 = b64ToU8(parsed.data);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivU8 }, key, dataU8);
    console.log(`[crypto] Decrypt path: ${decryptPath}, ivLen=${parsed.iv.length}, dataLen=${parsed.data.length}`);
    return new TextDecoder().decode(plain);
  }

  // Caminho 2: buffer pack (iv||cipher)
  if (packedU8 && packedU8.length > 12) {
    const ivU8 = packedU8.slice(0, 12);
    const dataU8 = packedU8.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivU8 }, key, dataU8);
    console.log(`[crypto] Decrypt path: ${decryptPath}, ivBytes=12, dataBytes=${dataU8.length}`);
    return new TextDecoder().decode(plain);
  }

  throw new Error('Invalid encrypted payload format (expected {iv,data} or packed iv||cipher)');
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
