// src/components/RegisterForm.js
import React, { useState } from "react";
import { registerUser } from "../api/auth";

export default function RegisterForm({ backToLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");

  async function generateCryptoMaterial(password) {
    const enc = new TextEncoder();

    // 1. Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    // 2. Export public key (SPKI)
    const publicKeyRaw = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

    // 3. Export private key (PKCS8)
    const privateKeyRaw = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // 4. Generate salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 5. Derive AES key from password
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"]
    );

    // 6. Encrypt private key
    const encryptedPrivateKeyRaw = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      privateKeyRaw
    );

    // Encode to base64
    const encryptedPrivateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedPrivateKeyRaw)));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      public_key: publicKeyBase64,
      encrypted_private_key: encryptedPrivateKeyBase64,
      salt: saltBase64,
      iv: ivBase64,
    };
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const cryptoData = await generateCryptoMaterial(p.trim());
      await registerUser({
        username: u.trim(),
        password: p.trim(),
        ...cryptoData,
      });
      setMsg("Success! Please log in.");
    } catch (err) {
      console.error(err);
      setMsg("Registration failed.");
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Register</h2>
        {msg && <div className="info">{msg}</div>}
        <label>Username</label>
        <input value={u} onChange={(e) => setU(e.target.value)} />
        <label>Password</label>
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        <button type="submit">Register</button>
        <p>
          Have account?{" "}
          <button type="button" onClick={backToLogin}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
