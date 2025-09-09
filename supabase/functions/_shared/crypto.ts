// Padrão único AES-GCM com chave derivada via SHA-256
// Usado por todas as edge functions para garantir compatibilidade

export async function deriveAesKey(keyMaterial: string) {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(keyMaterial));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

const b64ToU8 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const u8ToB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));

export async function encryptAESGCM(plain: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return btoa(JSON.stringify({ iv: u8ToB64(iv), data: u8ToB64(new Uint8Array(dataBuf)) }));
}

export async function decryptAESGCM(payloadB64: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);
  const { iv, data } = JSON.parse(atob(payloadB64));
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToU8(iv) }, key, b64ToU8(data));
  return new TextDecoder().decode(plainBuf);
}