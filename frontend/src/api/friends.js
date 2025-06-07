// src/api/friends.js
import { BACKEND_ROOT } from "../conf";

const API_ROOT = BACKEND_ROOT + "/user/friends";

async function callFriends(path, opts = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
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

/** POST { to_user } → create friend request */
export function sendFriendRequest(to_user) {
  return callFriends("/../friend-requests/send/", {
    method: "POST",
    body: JSON.stringify({ to_user }),
  });
}

/** GET list of pending friend requests */
export function getFriendRequests() {
  return callFriends("/../friend-requests/", { method: "GET" });
}

/** POST to accept a friend request */
export function acceptFriendRequest(requestId) {
  return callFriends(`/../friend-requests/${requestId}/accept/`, {
    method: "POST",
  });
}
