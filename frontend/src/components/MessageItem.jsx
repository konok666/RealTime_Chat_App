import React, { useState } from "react";
import "../styles/MessageItem.css";
import ReactionsBar from "./ReactionsBar";

export default function MessageItem({ message, me, onReact, onEdit, onDelete, onPin }) {
  const isMe = message.from === me;
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(message.text);

  function handleReact(emoji) {
    onReact(message.id, emoji);
    setShowReactions(false);
  }

  function saveEdit() {
    onEdit(message.id, val);
    setEditing(false);
  }

  return (
    <div className={`msg-row ${isMe ? "me" : "other"}`}>
      <div className="msg-bubble">
        <div className="meta">
          <span className="from">{isMe ? "You" : message.from}</span>
          <span className="time">{message.time ? new Date(message.time).toLocaleTimeString() : ""} {message.edited ? "(edited)" : ""}</span>
        </div>

        {!editing ? (
          <div className="text">{message.text}</div>
        ) : (
          <div className="edit-area">
            <input value={val} onChange={(e) => setVal(e.target.value)} />
            <button onClick={saveEdit}>Save</button>
          </div>
        )}

        {message.reactions && (
          <div className="reactions">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <span key={emoji} className="reaction-pill">{emoji} {users.length}</span>
            ))}
          </div>
        )}

        <div className="msg-actions">
          <button onClick={() => setShowReactions((s) => !s)}>😊</button>
          <button onClick={() => setEditing((s) => !s)}>✏️</button>
          <button onClick={() => onDelete(message.id)}>🗑</button>
          <button onClick={() => onPin(message)}>📌</button>
        </div>

        {showReactions && <ReactionsBar onPick={handleReact} />}
      </div>
    </div>
  );
}
