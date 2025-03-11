import React, { useState } from "react";

function ChatWindow({ contact }) {
  const [messages, setMessages] = useState([
    { text: "Hello! How are you?", sender: "received" },
    { text: "I'm good, thanks! And you?", sender: "sent" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim() === "") return;
    setMessages([...messages, { text: newMessage, sender: "sent" }]);
    setNewMessage("");
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat with {contact}</h3>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;
