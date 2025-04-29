const BASE_URL = "http://localhost:8000"; // adjust for prod

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
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
 * Create (send) a new message to a specific room
 * POST /chat/messages/<room_id>/
 * body: { username, content }
 */
export async function createMessage(roomId, content, username) {
  const bodyData = {
    username: username,
    content: content,
    room_id: roomId,
  };

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
