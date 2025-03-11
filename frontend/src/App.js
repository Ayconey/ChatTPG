import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoginForm from "./components/LoginForm";
import "./index.css";

const contacts = ["Alice", "Bob", "Charlie"];

function App() {
  const [user, setUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(contacts[0]);

  const handleLogin = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="header">
        <h2>Welcome, {user}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="main-content">
        <Sidebar
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
        />
        <ChatWindow contact={selectedContact} />
      </div>
    </div>
  );
}

export default App;
