import React, { useState } from "react";
import { loginUser, getCurrentUser } from "../api/auth";

export default function LoginForm({ onLogin, switchToRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  async function regenerateKeys(username, password, salt) {
    const enc = new TextEncoder();
    const seedData = enc.encode(username + ":" + password + ":" + salt);
    const seed = await crypto.subtle.digest("SHA-256", seedData);
    
    const privateKey = Array.from(new Uint8Array(seed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const publicKeyData = await crypto.subtle.digest("SHA-256", enc.encode(privateKey));
    const publicKey = Array.from(new Uint8Array(publicKeyData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem('privateKey', privateKey);
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('username', username);
    
    return { privateKey, publicKey };
  }

  async function submit(e) {
    e.preventDefault();
    try {
      await loginUser(u.trim(), p.trim());
      
      const userData = await getCurrentUser();
      
      const keys = await regenerateKeys(u.trim(), p.trim(), userData.profile_salt);
      
      if (keys.publicKey !== userData.profile_public_key) {
        throw new Error("Invalid keys!");
      }
      
      onLogin(u.trim());
    } catch {
      setErr("Invalid credentials");
      localStorage.clear();
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Login</h2>
        {err && <div className="error">{err}</div>}
        <label>Username</label>
        <input value={u} onChange={(e) => setU(e.target.value)} />
        <label>Password</label>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} />
        <button type="submit">Login</button>
        <p>
          No account? <button type="button" onClick={switchToRegister}>Register</button>
        </p>
      </form>
    </div>
  );
}