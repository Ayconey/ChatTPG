// src/api/chat.js
import { BACKEND_ROOT } from "../conf";

const API_ROOT = BACKEND_ROOT + "/chat";

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

export function createMessage(roomId, content_for_sender, content_for_receiver, iv) {
  return callChat(`/messages/${roomId}/`, {
    method: "POST",
    body: JSON.stringify({ 
      content_for_sender: content_for_sender, 
      content_for_receiver: content_for_receiver,
      iv: iv
    }),
  });
}