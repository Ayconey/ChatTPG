// frontend/src/components/LoginForm.js
import React, { useState } from "react";
import { loginUser, getUserCryptoKeys } from "../api/auth";
import { generateOrRestoreUserKeys } from "../utils/simpleDeterministicCrypto";
import { storeUserKeys, hasStoredKeys } from "../utils/keyStorageManager";
import { storeSessionPassword } from "../utils/sessionPasswordManager";
import { useCrypto } from "../contexts/CryptoContext";

// API call do aktualizacji klucza publicznego
async function updatePublicKey(publicKey) {
  const res = await fetch("http://localhost:8000/user/crypto/update-public-key/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ public_key: publicKey }),
  });
  if (!res.ok) throw new Error(`Failed to update public key: ${res.status}`);
  return res.json();
}

export default function LoginForm({ onLogin, switchToRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { setCryptoForUser } = useCrypto();

  async function submit(e) {
    e.preventDefault();
    if (!u.trim() || !p.trim()) {
      setErr("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      console.log("🔐 Attempting login...");
      
      // 1. Zaloguj się do backendu
      await loginUser(u.trim(), p.trim());
      console.log("✅ Backend login successful");

      // 2. Pobierz salt i IV z backendu
      const cryptoKeys = await getUserCryptoKeys();
      console.log("📥 Retrieved crypto keys from backend:", {
        salt: cryptoKeys.salt,
        iv: cryptoKeys.iv,
        hasPublicKey: !!cryptoKeys.public_key
      });

      // 3. Sprawdź czy mamy klucze w localStorage
      const hasKeys = hasStoredKeys(u.trim());
      console.log("💾 Has stored keys in localStorage:", hasKeys);

      let privateKey, masterKey;

      if (hasKeys) {
        try {
          // 4a. Spróbuj przywrócić klucze z localStorage
          console.log("🔄 Restoring keys from localStorage...");
          const restoredKeys = await generateOrRestoreUserKeys(
            u.trim(), 
            p.trim(), 
            cryptoKeys.salt, 
            cryptoKeys.iv
          );
          privateKey = restoredKeys.privateKey;
          masterKey = restoredKeys.masterKey;
          console.log("✅ Keys restored from localStorage");
        } catch (error) {
          console.warn("⚠️ Failed to restore from localStorage, regenerating...", error);
          hasKeys = false; // Fallback do regeneracji
        }
      }

      if (!hasKeys) {
        // 4b. Regeneruj klucze deterministycznie
        console.log("🔄 Regenerating keys deterministically...");
        const regeneratedKeys = await generateOrRestoreUserKeys(
          u.trim(), 
          p.trim(), 
          cryptoKeys.salt, 
          cryptoKeys.iv
        );
        
        // Zapisz klucz publiczny w backendzie
        try {
          await updatePublicKey(regeneratedKeys.publicKey);
          console.log("✅ Public key updated in backend");
        } catch (error) {
          console.warn("⚠️ Failed to update public key in backend:", error);
        }
        
        // Zapisz w localStorage
        storeUserKeys(u.trim(), {
          encryptedPrivateKey: regeneratedKeys.encryptedPrivateKey,
          publicKey: regeneratedKeys.publicKey
        });
        
        privateKey = regeneratedKeys.privateKey;
        masterKey = regeneratedKeys.masterKey;
        console.log("✅ Keys regenerated and stored");
      }

      // 5. Zapisz klucze w CryptoContext dla sesji
      setCryptoForUser({
        privateKey,
        masterKey,
        publicKey: cryptoKeys.public_key,
        username: u.trim()
      });

      // 6. Zapisz hasło w sessionStorage do odzyskiwania kluczy
      storeSessionPassword(u.trim(), p.trim());

      console.log("🎉 Login successful with crypto keys ready!");
      onLogin(u.trim());
    } catch (error) {
      console.error("❌ Login failed:", error);
      setErr("Login failed: " + (error.message || "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Login</h2>
        {err && <div className="error">{err}</div>}
        <label>Username</label>
        <input 
          value={u} 
          onChange={(e) => setU(e.target.value)}
          disabled={loading}
        />
        <label>Password</label>
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p>
          No account?{" "}
          <button type="button" onClick={switchToRegister} disabled={loading}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}