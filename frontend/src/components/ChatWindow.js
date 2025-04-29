import React, { useEffect, useState, useRef } from "react";
import { fetchMessages, createMessage } from "../api/chat";

function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!room) return;

    fetchMessages(room.id)
      .then((data) => setMessages(data))
      .catch((err) => console.error("Failed to fetch messages:", err));

    const backendHost = "localhost:8000"; // Django server
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = `${ws_scheme}://${backendHost}/ws/chat/${room.name}/`;

    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.message) {
        setMessages((prev) => [...prev, { content: data.message, username: data.username }]);
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      socketRef.current.close();
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!user || !room) return;

    try {
      await createMessage(room.id, newMessage, user);
      socketRef.current.send(JSON.stringify({ message: newMessage }));
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
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.username === user.username ? "sent" : "received"
            }`}
          >
            <small className="message-username">{msg.username}</small>
            <p>{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
