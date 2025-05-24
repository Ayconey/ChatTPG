// frontend/src/api/chat.js
const API_ROOT = "http://localhost:8000/chat";

async function callChat(path, opts = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) throw new Error(`Chat API ${path} failed: ${res.status}`);
  return res.json();
}

export function fetchRooms() {
  return callChat("/rooms/", { method: "GET" });
}

export function fetchMessages(roomId) {
  return callChat(`/messages/${roomId}/`, { method: "GET" });
}

// ZAKTUALIZOWANE - teraz wysyłamy zaszyfrowane wiadomości
export function createEncryptedMessage(roomId, encryptedData) {
  return callChat(`/messages/${roomId}/`, {
    method: "POST",
    body: JSON.stringify({
      encrypted_content_for_sender: encryptedData.encrypted_content_for_sender,
      encrypted_content_for_receiver: encryptedData.encrypted_content_for_receiver
    }),
  });
}