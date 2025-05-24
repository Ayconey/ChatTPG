// src/hooks/useCryptoKeys.js
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../api/auth';
import { reconstructPrivateKey, encryptMessage, decryptMessage } from '../utils/cryptoUtils';

export function useCryptoKeys(password) {
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [cryptoParams, setCryptoParams] = useState(null);
  const [keyCache, setKeyCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ładuj dane kryptograficzne z serwera
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const userData = await getCurrentUser();

        if (userData.public_key && userData.salt && userData.iv) {
          setCryptoParams({
            publicKey: userData.public_key,
            salt: userData.salt,
            iv: userData.iv
          });
          setPublicKey(userData.public_key);
        } else {
          setError('Missing cryptographic data for user');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Odtwórz klucz prywatny po załadowaniu danych i podaniu hasła
  useEffect(() => {
    if (!password || !cryptoParams) return;

    async function reconstructKey() {
      try {
        setLoading(true);
        const derivedPrivateKey = await reconstructPrivateKey(
          password,
          cryptoParams.salt,
          cryptoParams.iv
        );
        setPrivateKey(derivedPrivateKey);
        setLoading(false);
      } catch (err) {
        console.error('Failed to reconstruct private key:', err);
        setError('Failed to reconstruct private key. Wrong password?');
        setLoading(false);
      }
    }

    reconstructKey();
  }, [password, cryptoParams]);

  // Pobierz publiczny klucz innego użytkownika
  async function getRecipientPublicKey(username) {
    // Użyj z cache jeśli dostępny
    if (keyCache[username]) {
      return keyCache[username];
    }

    try {
      // Pobierz dane publiczne innego użytkownika
      const response = await fetch(`http://localhost:8000/user/user-data/${username}/`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }
      
      const data = await response.json();
      const publicKey = data.public_key;
      
      // Zapisz w cache
      setKeyCache(prev => ({
        ...prev,
        [username]: publicKey
      }));
      
      return publicKey;
    } catch (err) {
      console.error(`Failed to get public key for ${username}:`, err);
      throw new Error(`Could not get public key for ${username}`);
    }
  }

  // Zaszyfruj wiadomość dla określonego odbiorcy
  async function encryptForRecipient(message, recipientUsername) {
    const recipientPublicKey = await getRecipientPublicKey(recipientUsername);
    return encryptMessage(message, recipientPublicKey);
  }

  // Odszyfruj wiadomość używając własnego klucza prywatnego
  async function decrypt(encryptedMessage) {
    if (!privateKey) {
      throw new Error('Private key not available');
    }
    
    return decryptMessage(encryptedMessage, privateKey);
  }

  return {
    privateKey,
    publicKey,
    loading,
    error,
    encryptForRecipient,
    decrypt,
    getRecipientPublicKey
  };
}