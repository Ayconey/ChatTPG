// src/components/RegisterForm.js

import React, { useState } from "react";
import { registerUser } from "../api/auth";

function RegisterForm({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (username.trim() === "" || password.trim() === "") {
      setMsg("Username and password are required.");
      return;
    }

    try {
      // Call our register API
      const data = await registerUser(username, password);
      console.log("Registration response:", data);
      setMsg("Registration successful! You can now log in.");
    } catch (err) {
      console.error(err);
      setMsg("Registration failed. Try a different username.");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Register</button>
        <p>{msg}</p>

        <p>
          Already have an account?{" "}
          <button type="button" onClick={onBackToLogin}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

export default RegisterForm;
