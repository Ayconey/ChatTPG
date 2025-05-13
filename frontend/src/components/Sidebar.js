// src/components/Sidebar.js
import React, { useEffect, useState } from "react";
import {
  fetchRooms
} from "../api/chat";
import {
  fetchMutualFriends,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
} from "../api/friends";

export default function Sidebar({ selected, onSelect }) {
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [err, setErr] = useState("");

  // Load mutual friends
  const loadFriends = () =>
    fetchMutualFriends()
      .then((data) => setFriends(data.mutual_friends))
      .catch(console.error);

  // Load incoming friend requests
  const loadRequests = () =>
    getFriendRequests()
      .then(setRequests)
      .catch(console.error);

  // Load chat rooms
  const loadRooms = () =>
    fetchRooms()
      .then(setRooms)
      .catch(console.error);

  useEffect(() => {
    loadFriends();
    loadRequests();
    loadRooms();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFriend.trim()) return;
    try {
      await sendFriendRequest(newFriend.trim());
      setNewFriend("");
      setErr("");
      loadRequests(); // refresh pending requests
    } catch (e) {
      setErr("Could not send request");
      console.error(e);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      await loadFriends();
      await loadRooms();
      await loadRequests(); // remove request
    } catch (e) {
      console.error("Failed to accept request:", e);
    }
  };

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h4>New Friend</h4>
        <form onSubmit={handleAdd} className="add-friend-form">
          <input
            placeholder="username…"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
          />
          <button type="submit">Send Request</button>
        </form>
        {err && <div className="error">{err}</div>}
      </section>

      <section className="sidebar-section">
        <h4>Pending Friend Requests</h4>
        {requests.length === 0 && <div>No requests</div>}
        {requests.map((req) => (
          <div key={req.id} className="friend-request">
            {req.from_user_username}
            <button onClick={() => handleAccept(req.id)}>Accept</button>
          </div>
        ))}
      </section>

      <section className="sidebar-section">
        <h4>Friends (Direct Chats)</h4>
        {friends.map((f) => (
          <div
            key={f.room_id}
            className={`room ${selected?.id === f.room_id ? "active" : ""}`}
            onClick={() =>
              onSelect({ id: f.room_id, name: f.username })
            }
          >
            {f.username}
          </div>
        ))}
      </section>
    </aside>
  );
}
