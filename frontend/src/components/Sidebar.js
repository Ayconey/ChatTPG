import React from "react";

function Sidebar({ contacts, selectedContact, onSelectContact }) {
  return (
    <div className="sidebar">
      {contacts.map((contact) => (
        <div
          key={contact}
          className={`contact ${selectedContact === contact ? "active" : ""}`}
          onClick={() => onSelectContact(contact)}
        >
          {contact}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;
