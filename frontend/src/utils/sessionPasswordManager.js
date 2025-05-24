// frontend/src/utils/sessionPasswordManager.js

const SESSION_PASSWORD_KEY = 'tempUserPassword';

/**
 * Zapisuje hasło w sessionStorage (tylko na czas sesji)
 */
export function storeSessionPassword(username, password) {
  const sessionData = {
    username,
    password,
    timestamp: Date.now()
  };
  sessionStorage.setItem(SESSION_PASSWORD_KEY, JSON.stringify(sessionData));
  console.log('🔐 Password stored in session for crypto key restoration');
}

/**
 * Pobiera hasło z sessionStorage
 */
export function getSessionPassword(username) {
  try {
    const stored = sessionStorage.getItem(SESSION_PASSWORD_KEY);
    if (!stored) return null;
    
    const sessionData = JSON.parse(stored);
    
    // Sprawdź czy to dla tego samego użytkownika
    if (sessionData.username !== username) {
      clearSessionPassword();
      return null;
    }
    
    // Sprawdź czy nie jest zbyt stare (max 1 godzina)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - sessionData.timestamp > maxAge) {
      clearSessionPassword();
      return null;
    }
    
    return sessionData.password;
  } catch (error) {
    console.error('Error reading session password:', error);
    clearSessionPassword();
    return null;
  }
}

/**
 * Usuwa hasło z sessionStorage
 */
export function clearSessionPassword() {
  sessionStorage.removeItem(SESSION_PASSWORD_KEY);
  console.log('🧹 Session password cleared');
}

/**
 * Sprawdza czy mamy hasło w sesji
 */
export function hasSessionPassword(username) {
  return !!getSessionPassword(username);
}