// src/components/RegisterForm.js
import React, { useState } from "react";
import { registerUser } from "../api/auth";

export default function RegisterForm({ backToLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await registerUser(u.trim(), p.trim());
      setMsg("Success! Please log in.");
    } catch {
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
