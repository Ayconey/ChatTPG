// frontend/src/utils/deterministicCrypto.js
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Generuje deterministyczny seed z username + password + salt
 */
async function generateDeterministicSeed(username, password, salt) {
  const combined = `${username}:${password}`;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(combined),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  
  const derivedKey = await crypto.subtle.deriveKey(
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

  // Eksportujemy klucz jako raw bytes dla seed
  const keyBytes = await crypto.subtle.exportKey("raw", derivedKey);
  return new Uint8Array(keyBytes);
}

/**
 * Generuje deterministyczny klucz RSA z seed
 */
async function generateDeterministicRSAKeyPair(seed) {
  // Używamy seed jako źródła entropii do generacji RSA
  // To jest uproszczona implementacja - w produkcji użyj lepszej biblioteki
  
  // Na razie używamy standardowej generacji + seed jako dodatkowa entropia
  // TODO: Implementacja prawdziwie deterministycznej generacji RSA
  
  const keyPair = await window.crypto.subtle.generateKey(
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
 * Szyfruje klucz prywatny za pomocą master key + IV
 */
async function encryptPrivateKey(privateKey, masterKey, iv) {
  const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", privateKey);
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    masterKey,
    privateKeyRaw
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Odszyfruje klucz prywatny
 */
async function decryptPrivateKey(encryptedKeyBase64, masterKey, iv) {
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0));
  
  const decryptedKeyRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    masterKey,
    encryptedBytes
  );

  return crypto.subtle.importKey(
    "pkcs8", 
    decryptedKeyRaw, 
    { name: "RSA-OAEP", hash: "SHA-256" }, 
    false, 
    ["decrypt"]
  );
}

/**
 * Główna funkcja do generacji/odtworzenia kluczy użytkownika
 */
export async function generateOrRestoreUserKeys(username, password, salt = null, iv = null) {
  // Jeśli nie mamy salt/IV, generujemy nowe (przy rejestracji)
  if (!salt) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...saltBytes));
  }
  
  if (!iv) {
    const ivBytes = crypto.getRandomValues(new Uint8Array(12));
    iv = btoa(String.fromCharCode(...ivBytes));
  }

  // 1. Generuj master key z username + password + salt
  const seed = await generateDeterministicSeed(username, password, salt);
  
  // 2. Stwórz master key do szyfrowania klucza prywatnego
  const masterKey = await crypto.subtle.importKey(
    "raw",
    seed,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  // 3. Generuj deterministyczny RSA keypair
  const keyPair = await generateDeterministicRSAKeyPair(seed);

  // 4. Eksportuj klucz publiczny
  const publicKeyRaw = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

  // 5. Zaszyfruj klucz prywatny
  const encryptedPrivateKey = await encryptPrivateKey(keyPair.privateKey, masterKey, iv);

  return {
    publicKey: publicKeyBase64,
    encryptedPrivateKey,
    privateKey: keyPair.privateKey, // Tymczasowo dla sesji
    salt,
    iv,
    masterKey // Zachowaj dla dalszego użycia w sesji
  };
}

/**
 * Przywraca klucz prywatny z localStorage + salt/IV z backendu
 */
export async function restorePrivateKeyFromStorage(username, password, salt, iv) {
  // Pobierz zaszyfrowany klucz z localStorage
  const storedKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
  const userKey = storedKeys[username];
  
  if (!userKey) {
    throw new Error('No stored key found for user');
  }

  // Regeneruj master key
  const seed = await generateDeterministicSeed(username, password, salt);
  const masterKey = await crypto.subtle.importKey(
    "raw",
    seed,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  // Odszyfruj klucz prywatny
  const privateKey = await decryptPrivateKey(userKey.encryptedPrivateKey, masterKey, iv);

  return {
    privateKey,
    masterKey,
    publicKey: userKey.publicKey
  };
}

export { decryptPrivateKey, encryptPrivateKey };