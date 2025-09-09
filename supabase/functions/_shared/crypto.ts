// Padrão único AES-GCM com chave derivada via SHA-256
// Usado por todas as edge functions para garantir compatibilidade
import { CRYPTO_KEY } from "./config.ts";

const b64ToU8 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const u8ToB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));

async function deriveKey() {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(CRYPTO_KEY));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

// Versão nova (usando config compartilhada)
export async function encryptAESGCM(plain: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return btoa(JSON.stringify({ iv: u8ToB64(iv), data: u8ToB64(new Uint8Array(data)) }));
}

export async function decryptAESGCM(payloadB64: string): Promise<string> {
  const { iv, data } = JSON.parse(atob(payloadB64));
  const key = await deriveKey();
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToU8(iv) }, key, b64ToU8(data));
  return new TextDecoder().decode(plain);
}

// Versões legacy (mantidas para compatibilidade com código existente)
export async function deriveAesKey(keyMaterial: string) {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(keyMaterial));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptAESGCMLegacy(plain: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return btoa(JSON.stringify({ iv: u8ToB64(iv), data: u8ToB64(new Uint8Array(dataBuf)) }));
}

export async function decryptAESGCMLegacy(payloadB64: string, keyMaterial: string) {
  const key = await deriveAesKey(keyMaterial);
  const { iv, data } = JSON.parse(atob(payloadB64));
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToU8(iv) }, key, b64ToU8(data));
  return new TextDecoder().decode(plainBuf);
}