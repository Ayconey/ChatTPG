// frontend/src/components/RegisterForm.js
import React, { useState } from "react";
import { registerUser } from "../api/auth";
import { generateOrRestoreUserKeys } from "../utils/simpleDeterministicCrypto";
import { storeUserKeys } from "../utils/keyStorageManager";

export default function RegisterForm({ backToLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!u.trim() || !p.trim()) {
      setMsg("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      console.log("🔐 Generating crypto material for registration...");
      
      // Generuj deterministyczne klucze (nowe salt i IV dla nowego użytkownika)
      const cryptoData = await generateOrRestoreUserKeys(u.trim(), p.trim());
      
      console.log("✅ Crypto material generated:", {
        publicKey: cryptoData.publicKey.substring(0, 50) + "...",
        salt: cryptoData.salt,
        iv: cryptoData.iv
      });

      // Rejestruj użytkownika w backendzie
      await registerUser({
        username: u.trim(),
        password: p.trim(),
        public_key: cryptoData.publicKey,
        salt: cryptoData.salt,
        iv: cryptoData.iv,
      });

      // Zapisz zaszyfrowany klucz prywatny w localStorage
      storeUserKeys(u.trim(), {
        encryptedPrivateKey: cryptoData.encryptedPrivateKey,
        publicKey: cryptoData.publicKey
      });

      console.log("🎉 Registration successful!");
      setMsg("Success! Please log in.");
    } catch (err) {
      console.error("❌ Registration failed:", err);
      setMsg("Registration failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Register</h2>
        {msg && <div className={msg.includes("Success") ? "info" : "error"}>{msg}</div>}
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
          {loading ? "Generating keys..." : "Register"}
        </button>
        <p>
          Have account?{" "}
          <button type="button" onClick={backToLogin} disabled={loading}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}