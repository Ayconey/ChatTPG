import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchMessages, createMessage } from "../api/chat";
import { useChatSocket } from "../hooks/useChatSocket";

function getRoomName(user1, user2) {
  if (!user1 || !user2) return null;
  return [user1, user2].sort().join("");
}

async function deriveSharedSecret(privateKeyHex, publicKeyHex) {
  const enc = new TextEncoder();
  const combined = privateKeyHex + publicKeyHex;
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(combined));
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptMessage(text, recipientPublicKey, myPublicKey) {
  const enc = new TextEncoder();
  const privateKey = localStorage.getItem('privateKey');
  
  // Shared secret for recipient
  const sharedSecretRecipient = await deriveSharedSecret(privateKey, recipientPublicKey);
  
  // Shared secret for myself (to read my own messages)
  const sharedSecretSender = await deriveSharedSecret(privateKey, myPublicKey);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt for recipient
  const encryptedForRecipient = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedSecretRecipient,
    enc.encode(text)
  );
  
  // Encrypt for sender (myself)
  const encryptedForSender = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedSecretSender,
    enc.encode(text)
  );
  
  return {
    content_for_sender: btoa(String.fromCharCode(...new Uint8Array(encryptedForSender))),
    content_for_receiver: btoa(String.fromCharCode(...new Uint8Array(encryptedForRecipient))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

async function decryptMessage(encryptedContent, iv, senderPublicKey) {
  const dec = new TextDecoder();
  const privateKey = localStorage.getItem('privateKey');
  const sharedSecret = await deriveSharedSecret(privateKey, senderPublicKey);
  
  const encryptedData = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivData },
    sharedSecret,
    encryptedData
  );
  
  return dec.decode(decrypted);
}

export default function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [partnerPublicKey, setPartnerPublicKey] = useState(null);
  const endRef = useRef();

  const partner = room?.name;
  const socketRoomName = getRoomName(user, partner);

  const handleIncoming = useCallback(async ({ content_for_sender, content_for_receiver, username, iv }) => {
    try {
      const myPublicKey = localStorage.getItem('publicKey');
      let decrypted;
      
      if (username === user) {
        // I sent this message - decrypt using sender version
        decrypted = await decryptMessage(content_for_sender, iv, myPublicKey);
      } else {
        // I received this message - decrypt using receiver version
        decrypted = await decryptMessage(content_for_receiver, iv, partnerPublicKey);
      }
      
      setMessages(prev => [...prev, { content: decrypted, username }]);
    } catch (err) {
      console.error("Decryption failed:", err);
      setMessages(prev => [...prev, { content: "[Decryption failed]", username }]);
    }
  }, [user, partnerPublicKey]);

  const { send } = useChatSocket(socketRoomName, handleIncoming);

  useEffect(() => {
    if (!partner) return;
    
    fetch(`http://localhost:8000/user/me/`, { credentials: "include" })
      .then(r => r.json())
      .then(async userData => {
        const allUsers = await fetch(`http://localhost:8000/user/friends/mutual/`, { 
          credentials: "include" 
        }).then(r => r.json());
        
        const partnerData = allUsers.mutual_friends.find(f => f.username === partner);
        if (partnerData?.public_key) {
          setPartnerPublicKey(partnerData.public_key);
        }
      })
      .catch(console.error);
  }, [partner]);

  useEffect(() => {
    if (!room || !partnerPublicKey) return;
    
    fetchMessages(room.id)
      .then(async (data) => {
        const decryptedMessages = await Promise.all(
          data.map(async (m) => {
            try {
              const myPublicKey = localStorage.getItem('publicKey');
              let content;
              
              if (m.username === user) {
                // My message - use content_for_sender
                content = await decryptMessage(m.content_for_sender, m.iv, myPublicKey);
              } else {
                // Partner's message - use content_for_receiver
                content = await decryptMessage(m.content_for_receiver, m.iv, partnerPublicKey);
              }
              
              return { content, username: m.username };
            } catch {
              return { content: "[Old message - cannot decrypt]", username: m.username };
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
      
      await createMessage(room.id, encrypted, user);
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