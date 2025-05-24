// frontend/src/utils/simpleDeterministicCrypto.js
import { generateDeterministicKeys, exportKey } from './deterministicRSA';

/**
 * Główna funkcja do generacji/odtworzenia kluczy użytkownika
 * Używa w pełni deterministycznego podejścia z kluczami symetrycznymi
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

  console.log('🔐 Generating deterministic keys for:', username);
  console.log('📊 Salt:', salt);
  console.log('📊 IV:', iv);

  try {
    // Generuj deterministyczne klucze
    const keys = await generateDeterministicKeys(username, password, salt, iv);
    
    // Eksportuj klucze do przechowywania
    const masterKeyExported = await exportKey(keys.masterKey);
    const messageKeyExported = await exportKey(keys.messageKey);
    
    // Stwórz "zaszyfrowany klucz prywatny" - w rzeczywistości to zaszyfrowany message key
    const encryptedPrivateKey = await encryptPrivateKeyData({
      messageKey: messageKeyExported,
      identifier: keys.publicKeyIdentifier
    }, keys.masterKey, iv);

    console.log('✅ Keys generated successfully:', {
      publicKeyIdentifier: keys.publicKeyIdentifier.substring(0, 20) + '...',
      hasEncryptedKey: !!encryptedPrivateKey
    });

    return {
      publicKey: keys.publicKeyIdentifier, // Używamy identyfikatora jako "public key"
      encryptedPrivateKey,
      privateKey: keys.messageKey, // Tymczasowo dla sesji
      masterKey: keys.masterKey,
      salt,
      iv
    };
  } catch (error) {
    console.error('❌ Error generating keys:', error);
    throw error;
  }
}

/**
 * Szyfruje dane klucza prywatnego
 */
async function encryptPrivateKeyData(keyData, masterKey, iv) {
  const enc = new TextEncoder();
  const dataStr = JSON.stringify(keyData);
  const dataBytes = enc.encode(dataStr);
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    masterKey,
    dataBytes
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Deszyfruje dane klucza prywatnego
 */
async function decryptPrivateKeyData(encryptedData, masterKey, iv) {
  const dec = new TextDecoder();
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    masterKey,
    encryptedBytes
  );

  const dataStr = dec.decode(decrypted);
  return JSON.parse(dataStr);
}

/**
 * Przywraca klucz prywatny z localStorage + salt/IV z backendu
 */
export async function restorePrivateKeyFromStorage(username, password, salt, iv) {
  console.log('🔄 Restoring keys from storage for:', username);
  
  // Pobierz zaszyfrowany klucz z localStorage
  const storedKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
  const userKey = storedKeys[username];
  
  if (!userKey) {
    throw new Error('No stored key found for user');
  }

  // Regeneruj klucze deterministycznie
  const keys = await generateDeterministicKeys(username, password, salt, iv);
  
  // Odszyfruj dane klucza
  const keyData = await decryptPrivateKeyData(userKey.encryptedPrivateKey, keys.masterKey, iv);
  
  console.log('✅ Keys restored successfully');
  
  return {
    privateKey: keys.messageKey,
    masterKey: keys.masterKey,
    publicKey: userKey.publicKey
  };
}

// Eksportuj funkcje dla kompatybilności wstecznej
export { 
  encryptPrivateKeyData as encryptPrivateKey, 
  decryptPrivateKeyData as decryptPrivateKey 
};