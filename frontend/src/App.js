// src/App.js
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { refreshAccessToken } from "./api/auth";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => {
      refreshAccessToken().catch(() => {
        localStorage.clear();
        setUser(null);
        setView("login");
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [user]);

  if (!user) {
    return view === "login" ? (
      <LoginForm
        onLogin={(u) => setUser(u)}
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
            localStorage.clear();
            setUser(null);
            setView("login");
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
