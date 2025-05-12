// src/components/Sidebar.js
import React, { useEffect, useState } from "react";
import { fetchRooms } from "../api/chat";
import { fetchMutualFriends, addFriend } from "../api/friends";

export default function Sidebar({ selected, onSelect }) {
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [err, setErr] = useState("");

  // load chat rooms
  useEffect(() => {
    fetchRooms().then(setRooms).catch(console.error);
  }, []);

  const loadFriends = () =>
    fetchMutualFriends()
      .then((data) => setFriends(data.mutual_friends))
      .catch(console.error);
  
  // wrap it in a no-return callback
  useEffect(() => {
    loadFriends();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFriend.trim()) return;
    try {
      await addFriend(newFriend.trim());
      setNewFriend("");
      setErr("");
      // reload both lists
      fetchRooms().then(setRooms).catch(console.error);
      loadFriends();
    } catch (e) {
      setErr("Could not add friend");
      console.error(e);
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
          <button type="submit">Add</button>
        </form>
        {err && <div className="error">{err}</div>}
      </section>

      <section className="sidebar-section">
        <h4>Friends (Direct Chats)</h4>
        {friends.map((f) => (
          <div
            key={f.room_id}
            className={`room ${
              selected?.id === f.room_id ? "active" : ""
            }`}
            onClick={() =>
              onSelect({ id: f.room_id, name: f.username })
            }
          >
            {f.username}
          </div>
        ))}
      </section>

      <section className="sidebar-section">
        <h4>Other Rooms</h4>
        {rooms.map((r) => (
          <div
            key={r.id}
            className={`room ${selected?.id === r.id ? "active" : ""}`}
            onClick={() => onSelect(r)}
          >
            {r.name}
          </div>
        ))}
      </section>
    </aside>
  );
}
