// src/utils/cryptoUtils.js
const enc = new TextEncoder();
const dec = new TextDecoder();

// AES-GCM key derivation
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

export async function decryptPrivateKey(encryptedKeyBase64, password, salt, iv) {
  const aesKey = await deriveKey(password, salt);
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0));
  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    encryptedBytes
  );
  return crypto.subtle.importKey("pkcs8", pkcs8, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
}

export async function encryptMessage(text, publicKeyBase64) {
  const rawKey = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const publicKey = await crypto.subtle.importKey("spki", rawKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, enc.encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptMessage(encryptedBase64, privateKey) {
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encrypted);
  return dec.decode(decrypted);
}
