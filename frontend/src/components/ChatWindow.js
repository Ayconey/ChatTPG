// frontend/src/components/ChatWindow.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchMessages, createEncryptedMessage } from "../api/chat";
import { useChatSocket } from "../hooks/useChatSocket";
import { useCrypto } from "../contexts/CryptoContext";
import { 
  prepareEncryptedMessage, 
  decryptReceivedMessage 
} from "../utils/messageEncryption";

// Returns a consistent room name for two users
function getRoomName(user1, user2) {
  if (!user1 || !user2) return null;
  return [user1, user2].sort().join("");
}

export default function ChatWindow({ user, room }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [decryptionErrors, setDecryptionErrors] = useState({});
  const endRef = useRef();
  
  const { currentUserCrypto, getPublicKeyForUser, isReady } = useCrypto();

  // Extract partner from the room
  const partner = room?.name;
  const socketRoomName = getRoomName(user, partner);

  /**
   * Deszyfruje wiadomość i aktualizuje stan
   */
  const decryptAndAddMessage = useCallback(async (messageData) => {
    if (!currentUserCrypto) {
      console.warn('⚠️ No crypto keys available for decryption');
      return;
    }

    try {
      const decryptedContent = await decryptReceivedMessage(
        messageData, 
        currentUserCrypto.privateKey, 
        currentUserCrypto.username
      );
      
      setMessages(prev => [...prev, {
        ...messageData,
        content: decryptedContent,
        decrypted: true
      }]);
    } catch (error) {
      console.error('❌ Failed to decrypt message:', error);
      setMessages(prev => [...prev, {
        ...messageData,
        content: '[Failed to decrypt message]',
        decrypted: false,
        error: true
      }]);
    }
  }, [currentUserCrypto]);

  /**
   * Handler dla wiadomości z WebSocket
   */
  const handleIncoming = useCallback(({ message, username }) => {
    // WebSocket wysyła niezaszyfrowaną wiadomość - to jest dla real-time
    // Ale w bazie jest zapisana zaszyfrowana, więc tutaj dodajemy jako plaintext
    setMessages((prev) => [...prev, { 
      content: message, 
      username,
      fromWebSocket: true,
      decrypted: true
    }]);
  }, []);

  const { send } = useChatSocket(socketRoomName, handleIncoming);

  /**
   * Ładowanie wiadomości z bazy (zaszyfrowanych)
   */
  useEffect(() => {
    if (!room || !isReady) return;
    
    setLoading(true);
    fetchMessages(room.id)
      .then(async (data) => {
        setMessages([]); // Clear previous messages
        
        // Deszyfruj każdą wiadomość
        for (const messageData of data) {
          await decryptAndAddMessage(messageData);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [room, isReady, decryptAndAddMessage]);

  /**
   * Auto-scroll do końca
   */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Wysyłanie zaszyfrowanej wiadomości
   */
  const handleSend = async () => {
    if (!draft.trim() || !room || !isReady || !partner) return;
    
    const text = draft;
    setDraft("");
    setLoading(true);

    try {
      // 1. Pobierz klucz publiczny odbiorcy
      const receiverPublicKey = await getPublicKeyForUser(partner);
      if (!receiverPublicKey) {
        throw new Error('Could not get receiver public key');
      }

      // 2. Przygotuj zaszyfrowaną wiadomość
      const encryptedData = await prepareEncryptedMessage(
        text,
        receiverPublicKey,
        currentUserCrypto.publicKey
      );

      console.log('🔐 Sending encrypted message:', {
        receiver: partner,
        sender: currentUserCrypto.username,
        originalLength: text.length,
        encryptedLengths: {
          forReceiver: encryptedData.encrypted_content_for_receiver.length,
          forSender: encryptedData.encrypted_content_for_sender.length
        }
      });

      // 3. Zapisz w bazie (zaszyfrowane)
      await createEncryptedMessage(room.id, encryptedData);

      // 4. Wyślij przez WebSocket (niezaszyfrowane - dla real-time)
      send(text, user);

      console.log('✅ Message sent successfully');
    } catch (err) {
      console.error("❌ Failed to send encrypted message:", err);
      alert('Failed to send message: ' + err.message);
      setDraft(text); // Restore draft
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!room) {
    return <div className="chat-window">Select a room to start chatting.</div>;
  }

  if (!isReady) {
    return (
      <div className="chat-window">
        <div className="loading">🔐 Loading encryption keys...</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>🔒 Encrypted Chat with: {partner}</h3>
        {loading && <span className="loading-indicator">🔄</span>}
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => {
          const mine = m.username === user;
          return (
            <div key={i} className={`message ${mine ? "sent" : "recv"}`}>
              <small className="message-username">
                {m.username}
                {m.fromWebSocket && <span className="ws-indicator"> 📡</span>}
                {m.error && <span className="error-indicator"> ❌</span>}
                {m.decrypted && !m.fromWebSocket && <span className="encrypted-indicator"> 🔐</span>}
              </small>
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
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !draft.trim()}>
          {loading ? "🔐" : "Send"}
        </button>
      </div>
    </div>
  );
}