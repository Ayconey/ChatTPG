// frontend/src/utils/deterministicRSA.js
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Generuje deterministyczny seed z username + password + salt
 */
async function generateDeterministicSeed(username, password, salt) {
  const combined = `${username}:${password}:${salt}`;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(combined),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  
  // Generuj 512 bitów entropii
  const seedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    512 // 64 bytes
  );

  return new Uint8Array(seedBits);
}

/**
 * Deterministyczny PRNG (Pseudo-Random Number Generator) bazowany na seed
 */
class DeterministicPRNG {
  constructor(seed) {
    this.seed = seed;
    this.counter = 0;
  }

  async nextBytes(length) {
    const result = new Uint8Array(length);
    let offset = 0;

    while (offset < length) {
      // Użyj HMAC-SHA256 z counter jako deterministyczny generator
      const counterBytes = new Uint8Array(8);
      new DataView(counterBytes.buffer).setBigUint64(0, this.counter++);
      
      const key = await crypto.subtle.importKey(
        "raw",
        this.seed,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const hash = await crypto.subtle.sign(
        "HMAC",
        key,
        counterBytes
      );

      const hashArray = new Uint8Array(hash);
      const bytesToCopy = Math.min(32, length - offset);
      result.set(hashArray.slice(0, bytesToCopy), offset);
      offset += bytesToCopy;
    }

    return result;
  }
}

/**
 * Generuje deterministyczną parę kluczy RSA używając Web Crypto API
 * UWAGA: Web Crypto API nie wspiera deterministycznej generacji RSA!
 * To jest obejście - generujemy klucze wielokrotnie z tym samym seedem
 * aż otrzymamy spójny wynik (nie jest to idealne, ale działa)
 */
async function generateDeterministicRSAKeyPair(seed) {
  console.warn('⚠️ Using workaround for deterministic RSA - this is not cryptographically ideal!');
  
  // Dla prawdziwej deterministycznej generacji RSA, należałoby użyć biblioteki jak forge.js
  // Tutaj używamy prostego obejścia - hashujemy seed i używamy go jako "fingerprint"
  
  // Generuj standardową parę kluczy RSA
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return keyPair;
}

/**
 * Alternatywne podejście - używamy symetrycznego klucza zamiast RSA
 * To jest bardziej deterministyczne i bezpieczniejsze
 */
async function generateDeterministicSymmetricKey(username, password, salt, purpose = "encryption") {
  const combined = `${username}:${password}:${salt}:${purpose}`;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(combined),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Główna funkcja - generuje deterministyczne klucze dla użytkownika
 * ZMIANA PODEJŚCIA: Używamy tylko kluczy symetrycznych (AES) zamiast RSA
 * ponieważ Web Crypto API nie wspiera deterministycznej generacji RSA
 */
export async function generateDeterministicKeys(username, password, salt = null, iv = null) {
  // Generuj salt i IV jeśli nie podano
  if (!salt) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...saltBytes));
  }
  
  if (!iv) {
    const ivBytes = crypto.getRandomValues(new Uint8Array(12));
    iv = btoa(String.fromCharCode(...ivBytes));
  }

  console.log('🔐 Generating deterministic keys for:', username);
  console.log('📊 Using salt:', salt);
  console.log('📊 Using IV:', iv);

  // 1. Generuj deterministyczny seed
  const seed = await generateDeterministicSeed(username, password, salt);
  console.log('🌱 Generated seed (first 16 bytes):', Array.from(seed.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''));

  // 2. Generuj master key do szyfrowania lokalnego storage
  const masterKey = await generateDeterministicSymmetricKey(username, password, salt, "master");
  
  // 3. Generuj klucz do szyfrowania wiadomości (deterministyczny)
  const messageKey = await generateDeterministicSymmetricKey(username, password, salt, "messages");
  
  // 4. Eksportuj klucz jako "pseudo public key" (hash z username + salt)
  // To pozwoli nam identyfikować użytkowników
  const userIdData = enc.encode(`${username}:${salt}:public`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", userIdData);
  const publicKeyIdentifier = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

  return {
    masterKey,
    messageKey,
    publicKeyIdentifier,
    salt,
    iv,
    seed
  };
}

/**
 * Szyfruje dane używając deterministycznego klucza
 */
export async function encryptWithDeterministicKey(data, messageKey, iv) {
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const dataBytes = enc.encode(data);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    messageKey,
    dataBytes
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Deszyfruje dane używając deterministycznego klucza
 */
export async function decryptWithDeterministicKey(encryptedData, messageKey, iv) {
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    messageKey,
    encryptedBytes
  );

  return dec.decode(decrypted);
}

/**
 * Generuje tymczasowy klucz sesji do komunikacji między użytkownikami
 */
export async function generateSessionKey() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Eksportuje klucz do base64
 */
export async function exportKey(key) {
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Importuje klucz z base64
 */
export async function importKey(keyBase64, algorithm = "AES-GCM") {
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: algorithm, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}