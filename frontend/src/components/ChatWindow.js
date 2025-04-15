// src/components/ChatWindow.js

import React, { useEffect, useState } from "react";
import { fetchMessages, createMessage } from "../api/chat";

function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!room) return;
    fetchMessages(room.id)
      .then((data) => setMessages(data))
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [room]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!user || !room) return;

    try {
      const createdMsg = await createMessage(room.id, newMessage, user.id);
      setMessages((prev) => [...prev, createdMsg]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (!room) {
    return <div className="chat-window">Select a room to start chatting.</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat: {room.name}</h3>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${
              msg.user === user.id ? "sent" : "received"
            }`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;
