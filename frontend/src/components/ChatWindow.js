import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchMessages, createMessage } from "../api/chat";
import { useChatSocket } from "../hooks/useChatSocket";
import { encryptMessage, decryptMessage } from "../utils/cryptoUtils";

// Returns a consistent room name for two users
function getRoomName(user1, user2) {
  if (!user1 || !user2) return null;
  return [user1, user2].sort().join("");
}

export default function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [partnerPublicKey, setPartnerPublicKey] = useState(null);
  const endRef = useRef();

  // Extract partner from the room
  const partner = room?.name;
  const socketRoomName = getRoomName(user, partner);

  // Fetch partner's public key when room changes
  useEffect(() => {
    if (!partner) return;
    
    fetch(`http://localhost:8000/user/public-key/${partner}/`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setPartnerPublicKey(data.public_key))
      .catch(err => console.error("Failed to fetch partner's public key:", err));
  }, [partner]);

  // Decrypt message helper
  const decryptMessageContent = async (encryptedContent) => {
    try {
      return await decryptMessage(encryptedContent, window.userPrivateKey);
    } catch (err) {
      console.error("Failed to decrypt message:", err);
      return "[Unable to decrypt]";
    }
  };

  const handleIncoming = useCallback(async ({ content_for_sender, content_for_receiver, username, iv }) => {
    console.log("🔔 Incoming message from:", username);
    console.log("📦 Current user:", user);
    console.log("📦 Is my message:", username === user);
    console.log("📦 Content for sender length:", content_for_sender?.length);
    console.log("📦 Content for receiver length:", content_for_receiver?.length);
    
    const isMyMessage = username === user;
    const encryptedContent = isMyMessage ? content_for_sender : content_for_receiver;
    
    console.log("🔐 Using encrypted content:", isMyMessage ? "sender" : "receiver");
    console.log("🔐 Encrypted content preview:", encryptedContent?.substring(0, 50) + "...");
    
    const decryptedContent = await decryptMessageContent(encryptedContent);
    console.log("✅ Decrypted content:", decryptedContent);
    
    setMessages(prev => [...prev, { 
      content: decryptedContent,
      username
    }]);
  }, [user]);

  const { send } = useChatSocket(socketRoomName, handleIncoming);

  // Load and decrypt messages when room changes
  useEffect(() => {
    if (!room) return;
    
    fetchMessages(room.id)
      .then(async (data) => {
        const decryptedMessages = await Promise.all(
          data.map(async (m) => {
            const isMyMessage = m.username === user;
            const encryptedContent = isMyMessage ? m.content_for_sender : m.content_for_receiver;
            
            return {
              content: await decryptMessageContent(encryptedContent),
              username: m.username
            };
          })
        );
        setMessages(decryptedMessages);
      })
      .catch(console.error);
  }, [room, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !room || !partnerPublicKey || !window.userPublicKey) {  
      alert("Couldn't send message: missing draft, room, or keys.");
      return;
    }
    
    const text = draft;
    setDraft("");
    
    try {
      // Generate IV for this message
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      // Encrypt message for both users
      const content_for_receiver = await encryptMessage(text, partnerPublicKey);
      const content_for_sender = await encryptMessage(text, window.userPublicKey);
      
      // Save to backend
      await createMessage(room.id, content_for_sender, content_for_receiver, ivBase64);
      
      // Broadcast via WebSocket
      send({
        content_for_sender,
        content_for_receiver,
        username: user,
        iv: ivBase64
      });
    } catch (err) {
      console.error("❌ Failed to send:", err);
      setDraft(text); // Restore draft on error
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
        {!partnerPublicKey && <small style={{color: '#f66'}}>Loading encryption keys...</small>}
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
          disabled={!partnerPublicKey}
        />
        <button onClick={handleSend} disabled={!partnerPublicKey}>
          Send
        </button>
      </div>
    </div>
  );
}