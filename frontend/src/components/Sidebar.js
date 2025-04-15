// src/components/Sidebar.js

import React, { useEffect, useState } from "react";
import { fetchRooms } from "../api/chat";

function Sidebar({ selectedRoom, onSelectRoom }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // Fetch room list once on component mount
    fetchRooms()
      .then((data) => {
        setRooms(data); // data should be an array of rooms: [{id, name}, ...]
      })
      .catch((err) => {
        console.error("Failed to fetch rooms:", err);
      });
  }, []);

  return (
    <div className="sidebar">
      <h3>Chat Rooms</h3>
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`contact ${selectedRoom && selectedRoom.id === room.id ? "active" : ""}`}
          onClick={() => onSelectRoom(room)}
        >
          {room.name}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;
