// App.js
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { refreshAccessToken } from "./api/auth"; // Import your refresh function
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleLogin = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setAuthView("login");
  };

  // AUTO-REFRESH TOKEN every 5 minutes if user is logged in
  useEffect(() => {
    // Only start interval if user is logged in
    if (!user) return;

    const intervalId = setInterval(async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          // Attempt to refresh
          await refreshAccessToken();
          console.log("Token refreshed automatically");
        } catch (err) {
          console.error("Auto-refresh failed, logging out", err);
          handleLogout();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup the interval on unmount or when user changes
    return () => clearInterval(intervalId);
  }, [user]);

  if (!user) {
    if (authView === "login") {
      return (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthView("register")}
        />
      );
    } else {
      return <RegisterForm onBackToLogin={() => setAuthView("login")} />;
    }
  }

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
