import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchMessages, createMessage } from "../api/chat";
import { fetchMutualFriends } from "../api/friends";
import { useChatSocket } from "../hooks/useChatSocket";
import { encryptMessage,decryptMessage } from "../utils/cryptoUtils";
function getRoomName(user1, user2) {
  if (!user1 || !user2) return null;
  return [user1, user2].sort().join("");
}

export default function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [partnerPublicKey, setPartnerPublicKey] = useState(null);
  const endRef = useRef();

  const partner = room?.name;
  const socketRoomName = getRoomName(user, partner);

  const handleIncoming = useCallback(async (data) => {
    const { content_for_sender, content_for_receiver, username, iv } = data;
    try {
      const myPublicKey = window.userPublicKey
      let decrypted;
      
      if (username === user) {
        decrypted = await decryptMessage(content_for_sender, iv, myPublicKey);
      } else {
        decrypted = await decryptMessage(content_for_receiver, iv, partnerPublicKey);
      }
      
      setMessages(prev => [...prev, { content: decrypted, username }]);
    } catch (err) {
      console.error("Decryption failed:", err);
      setMessages(prev => [...prev, { content: "[Decryption failed]", username }]);
    }
  }, [user, partnerPublicKey]);

  const { send } = useChatSocket(socketRoomName, handleIncoming);

  // Load partner's public key
  useEffect(() => {
    if (!partner) return;
    
    fetchMutualFriends()
      .then(data => {
        const friend = data.mutual_friends.find(f => f.username === partner);
        if (friend?.public_key) {
          setPartnerPublicKey(friend.public_key);
        }
      })
      .catch(console.error);
  }, [partner]);

  // Load messages
  useEffect(() => {
    if (!room || !partnerPublicKey) return;
    
    fetchMessages(room.id)
      .then(async (data) => {
        const myPublicKey = localStorage.getItem('publicKey');
        const decryptedMessages = await Promise.all(
          data.map(async (m) => {
            try {
              // Backend returns 'content' which is already the correct version
              const publicKey = m.username === user ? myPublicKey : partnerPublicKey;
              const decrypted = await decryptMessage(m.content, m.iv, publicKey);
              return { content: decrypted, username: m.username };
            } catch (err) {
              console.error("Decrypt error:", err);
              return { content: "[Cannot decrypt]", username: m.username };
            }
          })
        );
        setMessages(decryptedMessages);
      })
      .catch(console.error);
  }, [room, user, partnerPublicKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !room || !partnerPublicKey) return;
    const text = draft;
    setDraft("");
    
    try {
      const myPublicKey = localStorage.getItem('publicKey');
      const encrypted = await encryptMessage(text, partnerPublicKey, myPublicKey);
      
      await createMessage(room.id, encrypted);
      send(encrypted, user);
    } catch (err) {
      console.error("Failed to send:", err);
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

  if (!partnerPublicKey) {
    return <div className="chat-window">Loading encryption keys...</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>🔒 Encrypted chat with: {partner}</h3>
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
          placeholder="Type your encrypted message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button onClick={handleSend}>Send 🔒</button>
      </div>
    </div>
  );
}