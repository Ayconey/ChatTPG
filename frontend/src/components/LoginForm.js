// src/components/LoginForm.js

import React, { useState } from "react";
import { loginUser } from "../api/auth";

function LoginForm({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    try {
      // Attempt real login
      await loginUser(username, password);
      // If successful, let parent know we are logged in
      onLogin(username);
    } catch (err) {
      setErrorMsg("Invalid username or password.");
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setErrorMsg("");
              setUsername(e.target.value);
            }}
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setErrorMsg("");
              setPassword(e.target.value);
            }}
          />
        </div>

        <button type="submit">Login</button>

        <p>
          Don’t have an account yet?{" "}
          <button type="button" onClick={onSwitchToRegister}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
