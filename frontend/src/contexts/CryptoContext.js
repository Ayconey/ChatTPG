// frontend/src/contexts/CryptoContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserPublicKey } from '../api/auth';
import { getCachedPublicKey, cachePublicKey } from '../utils/keyStorageManager';

const CryptoContext = createContext();

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within CryptoProvider');
  }
  return context;
}

export function CryptoProvider({ children }) {
  const [currentUserCrypto, setCurrentUserCrypto] = useState(null);
  const [publicKeysCache, setPublicKeysCache] = useState({});

  // Inicjalizacja z window.currentUserCrypto (ustawiane przy logowaniu)
  useEffect(() => {
    if (window.currentUserCrypto) {
      setCurrentUserCrypto(window.currentUserCrypto);
      console.log('🔐 Crypto context initialized for user:', window.currentUserCrypto.username);
    }
  }, []);

  /**
   * Pobiera klucz publiczny użytkownika (z cache lub z API)
   */
  const getPublicKeyForUser = async (username) => {
    if (!username) {
      console.error('❌ getPublicKeyForUser: username is empty');
      return null;
    }
    
    console.log(`🔍 Getting public key for: ${username}`);
    
    // Sprawdź cache w state
    if (publicKeysCache[username]) {
      console.log(`💾 Found public key in state cache for: ${username}`);
      return publicKeysCache[username];
    }
    
    // Sprawdź localStorage cache
    const cachedKey = getCachedPublicKey(username);
    if (cachedKey) {
      console.log(`💾 Found public key in localStorage cache for: ${username}`);
      setPublicKeysCache(prev => ({ ...prev, [username]: cachedKey }));
      return cachedKey;
    }
    
    try {
      // Pobierz z API
      console.log(`📥 Fetching public key from API for: ${username}`);
      const response = await getUserPublicKey(username);
      
      if (!response || !response.public_key) {
        console.error(`❌ No public key in response for ${username}:`, response);
        return null;
      }
      
      const publicKey = response.public_key;
      
      // Zapisz w cache
      cachePublicKey(username, publicKey);
      setPublicKeysCache(prev => ({ ...prev, [username]: publicKey }));
      
      console.log(`✅ Public key cached for: ${username}`);
      console.log(`🔑 Public key preview: ${publicKey.substring(0, 50)}...`);
      return publicKey;
    } catch (error) {
      console.error(`❌ Failed to get public key for ${username}:`, error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack
      });
      return null;
    }
  };

  /**
   * Czyści stan kryptograficzny (przy wylogowaniu)
   */
  const clearCryptoState = () => {
    setCurrentUserCrypto(null);
    setPublicKeysCache({});
    window.currentUserCrypto = null;
    console.log('🧹 Crypto state cleared');
  };

  /**
   * Ustawia dane kryptograficzne dla aktualnego użytkownika
   */
  const setCryptoForUser = (cryptoData) => {
    setCurrentUserCrypto(cryptoData);
    window.currentUserCrypto = cryptoData;
    console.log('🔐 Crypto data set for user:', cryptoData.username);
  };

  const value = {
    currentUserCrypto,
    getPublicKeyForUser,
    clearCryptoState,
    setCryptoForUser,
    isReady: !!currentUserCrypto
  };

  return (
    <CryptoContext.Provider value={value}>
      {children}
    </CryptoContext.Provider>
  );
}