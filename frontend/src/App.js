// frontend/src/App.js
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { CryptoProvider, useCrypto } from "./contexts/CryptoContext";
import {
  refreshAccessToken,
  getCurrentUser,
  logoutUser,
} from "./api/auth";
import { clearAllKeys } from "./utils/keyStorageManager";
import { getSessionPassword, clearSessionPassword } from "./utils/sessionPasswordManager";
import "./index.css";

function AppContent() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [room, setRoom] = useState(null);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);
  const { clearCryptoState, setCryptoForUser, isReady } = useCrypto();

  // Try to restore session on load
  useEffect(() => {
    getCurrentUser()
      .then(async (data) => {
        setUser(data.username);
        // Po odzyskaniu sesji, spróbuj odzyskać klucze kryptograficzne
        await restoreCryptoKeysForUser(data.username);
      })
      .catch(() => {
        setUser(null);
        setView("login");
      });
  }, []);

  // Funkcja do odzyskiwania kluczy po odświeżeniu strony
  const restoreCryptoKeysForUser = async (username) => {
    if (window.currentUserCrypto && window.currentUserCrypto.username === username) {
      console.log('🔐 Crypto keys already loaded');
      return;
    }

    setIsLoadingCrypto(true);
    try {
      console.log('🔄 Attempting to restore crypto keys after page refresh...');
      
      // Sprawdź czy mamy klucze w localStorage
      const storedKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
      const userKey = storedKeys[username];
      
      if (!userKey) {
        console.warn('⚠️ No stored keys found, user needs to re-login');
        handleLogout();
        return;
      }

      // Pobierz salt i IV z backendu - import wewnątrz funkcji
      const { getUserCryptoKeys } = await import('./api/auth');
      const cryptoKeys = await getUserCryptoKeys();
      
      // Spróbuj pobrać hasło z sessionStorage
      let password = getSessionPassword(username);
      
      if (!password) {
        // Jeśli nie ma hasła w sesji, poproś użytkownika
        password = prompt(`🔐 Enter password to unlock encryption keys for ${username}:`);
        if (!password) {
          console.log('❌ Password required for encryption');
          handleLogout();
          return;
        }
      }

      // Odzyskaj klucze
      const { generateOrRestoreUserKeys } = await import('./utils/simpleDeterministicCrypto');
      const restoredKeys = await generateOrRestoreUserKeys(
        username, 
        password, 
        cryptoKeys.salt, 
        cryptoKeys.iv
      );

      // Ustaw klucze w kontekście
      setCryptoForUser({
        privateKey: restoredKeys.privateKey,
        masterKey: restoredKeys.masterKey,
        publicKey: cryptoKeys.public_key,
        username: username
      });

      console.log('✅ Crypto keys restored successfully');
    } catch (error) {
      console.error('❌ Failed to restore crypto keys:', error);
      alert('Failed to restore encryption keys. Please log in again.');
      handleLogout();
    } finally {
      setIsLoadingCrypto(false);
    }
  };

  // Refresh token every 5 minutes
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => {
      refreshAccessToken().catch(() => {
        handleLogout();
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => {
    logoutUser().finally(() => {
      // Wyczyść stan kryptograficzny
      clearCryptoState();
      // Wyczyść localStorage
      clearAllKeys();
      // Wyczyść hasło z sessionStorage
      clearSessionPassword();
      // Reset UI
      setUser(null);
      setView("login");
      setRoom(null);
      console.log('🔐 Complete logout with crypto cleanup');
    });
  };

  if (!user) {
    return view === "login" ? (
      <LoginForm
        onLogin={(username) => {
          setUser(username);
          console.log('✅ User logged in:', username);
        }}
        switchToRegister={() => setView("register")}
      />
    ) : (
      <RegisterForm backToLogin={() => setView("login")} />
    );
  }

  // Jeśli user jest zalogowany ale klucze się ładują
  if (isLoadingCrypto) {
    return (
      <div className="loading-screen">
        <h2>🔐 Restoring Encryption Keys...</h2>
        <p>Please wait while we restore your encryption keys.</p>
      </div>
    );
  }

  // Jeśli user jest zalogowany ale nie ma kluczy crypto
  if (!isReady) {
    return (
      <div className="loading-screen">
        <h2>🔐 Encryption Keys Required</h2>
        <p>Your encryption keys are not loaded.</p>
        <button onClick={() => restoreCryptoKeysForUser(user)}>
          🔓 Unlock Encryption Keys
        </button>
        <button onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span>🔐 Welcome, {user}!</span>
        <div className="header-crypto-status">
          {window.currentUserCrypto ? (
            <span className="crypto-ready">🟢 Encryption Ready</span>
          ) : (
            <span className="crypto-loading">🟡 Loading Keys...</span>
          )}
        </div>
        <button onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className="main">
        <Sidebar selected={room} onSelect={setRoom} />
        <ChatWindow user={user} room={room} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CryptoProvider>
      <AppContent />
    </CryptoProvider>
  );
}