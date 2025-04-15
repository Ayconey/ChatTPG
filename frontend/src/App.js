// src/App.js

import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fake "login" that just sets the user in state
  const handleLogin = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    // Clear tokens if you’re using them
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setAuthView("login");
  };

  // If no user, show login/register forms
  if (!user) {
    if (authView === "login") {
      return (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthView("register")}
        />
      );
    } else {
      return (
        <RegisterForm onBackToLogin={() => setAuthView("login")} />
      );
    }
  }

  // If user is logged in, show the chat UI
  return (
    <div className="app-container">
      <div className="header">
        <h2>Welcome, {user}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="main-content">
        <Sidebar
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
        />
        <ChatWindow user={user} room={selectedRoom} />
      </div>
    </div>
  );
}

export default App;
