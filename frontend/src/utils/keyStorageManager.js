// frontend/src/utils/keyStorageManager.js

const STORAGE_KEY = 'userKeys';
const PUBLIC_KEYS_CACHE = 'publicKeysCache';

/**
 * Zapisuje klucze użytkownika w localStorage
 */
export function storeUserKeys(username, keys) {
  const storedKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  storedKeys[username] = {
    encryptedPrivateKey: keys.encryptedPrivateKey,
    publicKey: keys.publicKey,
    timestamp: Date.now()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
  console.log(`🔐 Stored keys for user: ${username}`);
}

/**
 * Pobiera klucze użytkownika z localStorage
 */
export function getUserKeys(username) {
  const storedKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return storedKeys[username] || null;
}

/**
 * Usuwa klucze użytkownika z localStorage
 */
export function removeUserKeys(username) {
  const storedKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  delete storedKeys[username];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
  console.log(`🗑️ Removed keys for user: ${username}`);
}

/**
 * Czyści wszystkie klucze (przy wylogowaniu)
 */
export function clearAllKeys() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PUBLIC_KEYS_CACHE);
  console.log('🧹 Cleared all stored keys');
}

/**
 * Cache dla kluczy publicznych innych użytkowników
 */
export function cachePublicKey(username, publicKey) {
  const cache = JSON.parse(localStorage.getItem(PUBLIC_KEYS_CACHE) || '{}');
  cache[username] = {
    publicKey,
    timestamp: Date.now()
  };
  localStorage.setItem(PUBLIC_KEYS_CACHE, JSON.stringify(cache));
}

/**
 * Pobiera klucz publiczny z cache
 */
export function getCachedPublicKey(username) {
  const cache = JSON.parse(localStorage.getItem(PUBLIC_KEYS_CACHE) || '{}');
  const cached = cache[username];
  
  // Cache ważny przez 1 godzinę
  if (cached && (Date.now() - cached.timestamp) < 3600000) {
    return cached.publicKey;
  }
  
  return null;
}

/**
 * Sprawdza czy użytkownik ma zapisane klucze
 */
export function hasStoredKeys(username) {
  const keys = getUserKeys(username);
  return keys && keys.encryptedPrivateKey && keys.publicKey;
}

/**
 * Debug: wyświetla informacje o przechowywanych kluczach
 */
export function debugStoredKeys() {
  const storedKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const publicKeysCache = JSON.parse(localStorage.getItem(PUBLIC_KEYS_CACHE) || '{}');
  
  console.log('📊 Stored Keys Debug:', {
    userKeys: Object.keys(storedKeys),
    cachedPublicKeys: Object.keys(publicKeysCache),
    totalSize: new Blob([JSON.stringify(storedKeys)]).size + new Blob([JSON.stringify(publicKeysCache)]).size
  });
  
  return { storedKeys, publicKeysCache };
}