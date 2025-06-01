// src/contexts/CryptoContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { getUserKeys } from '../api/auth';
import { decryptPrivateKey } from '../utils/cryptoUtils';

const CryptoContext = createContext(null);

export function CryptoProvider({ children }) {
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadKeys = useCallback(async (password) => {
    try {
      const { encrypted_private_key, salt, iv, public_key } = await getUserKeys();
      
      const decryptedPrivateKey = await decryptPrivateKey(
        encrypted_private_key,
        password,
        salt,
        iv
      );
      
      setPrivateKey(decryptedPrivateKey);
      setPublicKey(public_key);
      setIsLoaded(true);
      
      // Store params for potential re-decryption
      sessionStorage.setItem("cryptoParams", JSON.stringify({
        encrypted_private_key,
        salt,
        iv,
        public_key
      }));
      
      return true;
    } catch (error) {
      console.error("Failed to load keys:", error);
      return false;
    }
  }, []);

  const clearKeys = useCallback(() => {
    setPrivateKey(null);
    setPublicKey(null);
    setIsLoaded(false);
    sessionStorage.removeItem("cryptoParams");
  }, []);

  const value = {
    privateKey,
    publicKey,
    isLoaded,
    loadKeys,
    clearKeys
  };

  return (
    <CryptoContext.Provider value={value}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
}