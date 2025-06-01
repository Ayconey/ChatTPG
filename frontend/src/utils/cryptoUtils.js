// src/utils/cryptoUtils.js
const enc = new TextEncoder();
const dec = new TextDecoder();

// Derive AES key from password and salt (same as in registration)
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

// Decrypt private key using password
export async function decryptPrivateKey(encryptedKeyBase64, password, salt, iv) {
  // Derive the same AES key
  const aesKey = await deriveKey(password, salt);
  
  // Convert from base64
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0));
  
  // Decrypt to get PKCS8 format
  const privateKeyRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    encryptedBytes
  );
  console.log(privateKeyRaw);
  // Import as RSA private key
  return crypto.subtle.importKey(
    "pkcs8",
    privateKeyRaw,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );
}

// Encrypt message with public key
export async function encryptMessage(plaintext, publicKeyBase64) {
  // Convert public key from base64
  const publicKeyRaw = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  
  // Import public key
  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyRaw,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
  
  // Encrypt message
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    enc.encode(plaintext)
  );
  
  // Return as base64
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Decrypt message with private key
export async function decryptMessage(encryptedBase64, privateKey) {
  // Convert from base64
  const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBytes
  );
  
  // Return as string
  return dec.decode(decrypted);
}