import React, { useState } from "react";
import { registerUser } from "../api/auth";

export default function RegisterForm({ backToLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [errors, setErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  async function generateCryptoMaterial(password) {
    const enc = new TextEncoder();

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

    const publicKeyRaw = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

    const privateKeyRaw = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

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

    const encryptedPrivateKeyRaw = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      privateKeyRaw
    );

    return {
      public_key: publicKeyBase64,
      encrypted_private_key: btoa(String.fromCharCode(...new Uint8Array(encryptedPrivateKeyRaw))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }

  async function submit(e) {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg("");
    try {
      const cryptoData = await generateCryptoMaterial(p.trim());
      await registerUser({
        username: u.trim(),
        password: p.trim(),
        ...cryptoData,
      });
      setSuccessMsg("Success! Please log in.");
    } catch (err) {
      console.log("Registration error:", err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        const allErrors = [];
        for (const field in data) {
          if (Array.isArray(data[field])) {
            allErrors.push(...data[field]);
          }
        }
        setErrors(allErrors);
      } else {
        setErrors(["Registration failed."]);
      }
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Register</h2>

        {successMsg && <div className="info">{successMsg}</div>}
        {errors.length > 0 && (
          <ul style={{ color: "red", padding: 0, listStyle: "none" }}>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <label>Username</label>
        <input value={u} onChange={(e) => setU(e.target.value)} />

        <label>Password</label>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} />

        <small style={{ display: "block", marginBottom: "1em" }}>
          Password must be at least 8 characters long.
        </small>

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
