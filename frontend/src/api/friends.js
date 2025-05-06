// src/api/friends.js
import { refreshAccessToken } from "./auth";

const API_ROOT = "http://localhost:8000/user/friends";

/** get headers, refresh once on 401 */
async function getAuthHeaders() {
  let token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function callFriends(path, opts = {}) {
  let headers = await getAuthHeaders();
  let res = await fetch(`${API_ROOT}${path}`, { headers, ...opts });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    headers.Authorization = `Bearer ${newToken}`;
    res = await fetch(`${API_ROOT}${path}`, { headers, ...opts });
  }
  if (!res.ok) throw new Error(`Friends API ${path} failed: ${res.status}`);
  return res.json();
}

/** POST { username } → { success: true } */
export function addFriend(username) {
  return callFriends("/add/", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

/** GET → { mutual_friends: [ { username, room_id }, … ] } */
export function fetchMutualFriends() {
  return callFriends("/mutual/", { method: "GET" });
}
