import React, { useState } from "react";
import { registerUser } from "../api/auth";

export default function RegisterForm({ backToLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");

  async function generateKeys(username, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    const seedData = enc.encode(username + ":" + password + ":" + saltBase64);
    const seed = await crypto.subtle.digest("SHA-256", seedData);
    
    const privateKey = Array.from(new Uint8Array(seed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const publicKeyData = await crypto.subtle.digest("SHA-256", enc.encode(privateKey));
    const publicKey = Array.from(new Uint8Array(publicKeyData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // i tak ziomek musi się zalogować to niepotrzebne, dlatestów: 8ea4295cc23381a7486d039c5e6db35c35f0df45d2807d3705539ecb564bce35
    // localStorage.setItem('privateKey', privateKey);
    // localStorage.setItem('publicKey', publicKey);
    
    return { public_key: publicKey, salt: saltBase64};
  }

  async function submit(e) {
    e.preventDefault();
    if (!u.trim() || !p.trim()) {
      setMsg("All fields required");
      return;
    }
    try {
      const keys = await generateKeys(u.trim(), p.trim());
      await registerUser({
        username: u.trim(),
        password: p.trim(),
        public_key: keys.public_key,
        salt: keys.salt
      });
      setMsg("Success! Please log in.");
    } catch (err) {
      setMsg("Registration failed");
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Register</h2>
        {msg && <div className={msg.includes("Success") ? "info" : "error"}>{msg}</div>}
        <label>Username</label>
        <input value={u} onChange={(e) => setU(e.target.value)} />
        <label>Password</label>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} />
        <button type="submit">Register</button>
        <p>
          Have account? <button type="button" onClick={backToLogin}>Login</button>
        </p>
      </form>
    </div>
  );
}