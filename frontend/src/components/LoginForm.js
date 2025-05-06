// src/components/LoginForm.js
import React, { useState } from "react";
import { loginUser } from "../api/auth";

export default function LoginForm({ onLogin, switchToRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await loginUser(u.trim(), p.trim());
      onLogin(u.trim());
    } catch {
      setErr("Invalid credentials");
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
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
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
