// src/components/LoginForm.js
import React, { useState } from "react";
import { loginUser, getUserKeys } from "../api/auth";
import { decryptPrivateKey,encryptMessage,decryptMessage } from "../utils/cryptoUtils";

export default function LoginForm({ onLogin, switchToRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      // 1. Login user
      await loginUser(u.trim(), p.trim());
      
      // 2. Get encrypted private key and crypto params
      const { encrypted_private_key, salt, iv, public_key } = await getUserKeys();
      
      // 3. Decrypt private key using password
      const privateKey = await decryptPrivateKey(
        encrypted_private_key,
        p.trim(),
        salt,
        iv
      );
      console.log(privateKey);

// 3. Test szyfrowania/odszyfrowywania
async function testCrypto() {
  const testMessage = "Test message 123";
  
  // Zaszyfruj swoim kluczem publicznym
  const encrypted = await encryptMessage(testMessage, window.userPublicKey);
  console.log("Encrypted:", encrypted);
  
  // Odszyfruj swoim kluczem prywatnym
  const decrypted = await decryptMessage(encrypted, window.userPrivateKey);
  console.log("Decrypted:", decrypted);
  console.log("Match:", testMessage === decrypted);
}

    // 4. Store keys in sessionStorage (temporary storage during session)
    // Note: In production, consider more secure storage methods
    sessionStorage.setItem("cryptoParams", JSON.stringify({
      encrypted_private_key,
      salt,
      iv,
      public_key
    }));
      
      // 5. Store the decrypted key in memory (we'll need a better solution later)
      window.userPublicKey = public_key;
      window.userPrivateKey = privateKey;
            // 1. Sprawdź czy klucz istnieje
console.log("Private key exists:", !!window.userPrivateKey);
console.log("Public key (base64):", window.userPublicKey);

// 2. Sprawdź właściwości klucza
if (window.userPrivateKey) {
  console.log("Private key type:", window.userPrivateKey.type); // "private"
  console.log("Private key algorithm:", window.userPrivateKey.algorithm); // RSA-OAEP
  console.log("Private key usages:", window.userPrivateKey.usages); // ["decrypt"]
  console.log("Private key extractable:", window.userPrivateKey.extractable); // false
}
testCrypto();
      onLogin(u.trim());
    } catch (error) {
      console.error("Login error:", error);
      setErr("Invalid credentials or decryption failed");
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
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          No account?{" "}
          <button type="button" onClick={switchToRegister}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}