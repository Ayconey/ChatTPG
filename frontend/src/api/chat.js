// src/api/chat.js

// Replace with your actual backend URL
const BASE_URL = "http://localhost:8000";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : undefined,
  };
}

/**
 * Fetch all chat rooms
 * GET /chat/rooms/
 */
export async function fetchRooms() {
  const res = await fetch(`${BASE_URL}/chat/rooms/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Could not fetch chat rooms");
  }

  return res.json();
}

/**
 * Fetch messages for a specific room
 * GET /chat/messages/<room_id>/
 */
export async function fetchMessages(roomId) {
  const res = await fetch(`${BASE_URL}/chat/messages/${roomId}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Could not fetch messages");
  }

  return res.json();
}

/**
 * Create (send) a new message in the specified room
 * POST /chat/messages/<room_id>/
 * body: { room: roomId, text: "...", sender: userID? }
 */
export async function createMessage(roomId, content, userId) {
    // The backend expects { user, content, room }
    const bodyData = {
      user: userId,     // integer user ID
      content: content, // actual text body
      room: roomId
    };

    console.log("userid:");
    console.log(userId);
  
    const res = await fetch(`${BASE_URL}/chat/messages/${roomId}/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyData),
    });
  
    if (!res.ok) {
      throw new Error("Could not create message");
    }
  
    return res.json();
}
  