import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchMessages, createMessage } from "../api/chat";
import { useChatSocket } from "../hooks/useChatSocket";

// Returns a consistent room name for two users
function getRoomName(user1, user2) {
  if (!user1 || !user2) return null;
  return [user1, user2].sort().join("");
}

export default function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef();

  // Extract partner from the room
  const partner = room?.name;
  const socketRoomName = getRoomName(user, partner);

  const handleIncoming = useCallback(({ message, username }) => {
    setMessages((prev) => [...prev, { content: message, username }]);
  }, []);

  const { send } = useChatSocket(socketRoomName, handleIncoming);

  useEffect(() => {
    if (!room) return;
    fetchMessages(room.id)
      .then((data) =>
        setMessages(
          data.map((m) => ({
            content: m.content,
            username: m.username,
          }))
        )
      )
      .catch(console.error);
  }, [room]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !room) return;
    const text = draft;
    setDraft("");
    try {
      // Save to backend
      await createMessage(room.id, text, user);
      // Broadcast to WebSocket
      send(text, user);
    } catch (err) {
      console.error("❌ Failed to send:", err);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  if (!room) {
    return <div className="chat-window">Select a room to start chatting.</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Chat with: {partner}</h3>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => {
          const mine = m.username === user;
          return (
            <div key={i} className={`message ${mine ? "sent" : "recv"}`}>
              <small className="message-username">{m.username}</small>
              <div className="bubble">{m.content}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
