// src/App.js
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import {
  refreshAccessToken,
  getCurrentUser,
  logoutUser,
} from "./api/auth";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [room, setRoom] = useState(null);

  // Clean up crypto data on logout
  const cleanupCrypto = () => {
    sessionStorage.removeItem("cryptoParams");
    delete window.userPrivateKey;
  };

  // Try to restore session on load
  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data.username))
      .catch(() => {
        setUser(null);
        setView("login");
        cleanupCrypto();
      });
  }, []);

  // Refresh token every 5 minutes
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => {
      refreshAccessToken().catch(() => {
        setUser(null);
        setView("login");
        cleanupCrypto();
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user]);

  if (!user) {
    return view === "login" ? (
      <LoginForm
        onLogin={() =>
          getCurrentUser()
            .then((data) => setUser(data.username))
            .catch(() => {})
        }
        switchToRegister={() => setView("register")}
      />
    ) : (
      <RegisterForm backToLogin={() => setView("login")} />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span>Welcome, {user}!</span>
        <button
          onClick={() => {
            logoutUser().finally(() => {
              setUser(null);
              setView("login");
              cleanupCrypto();
            });
          }}
        >
          Logout
        </button>
      </header>
      <main className="main">
        <Sidebar selected={room} onSelect={setRoom} />
        <ChatWindow user={user} room={room} />
      </main>
    </div>
  );
}