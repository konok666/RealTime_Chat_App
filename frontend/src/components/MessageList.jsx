import React, { useEffect, useRef } from "react";
import Message from "./Message";
import "../styles/MessageList.css";

export default function MessageList({ messages, me, onReact, onEdit, onDelete, onPin }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div className="message-list" ref={ref}>
      {messages.length === 0 && (
        <div className="empty-msg">No messages yet — say hi 👋</div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message-container ${msg.from === me ? "me" : "other"}`}
        >
          {/* Message bubble */}
          <Message
            message={msg}
            meId={me}
            onReact={(id, emoji) => onReact(id, emoji)}  // FIXED
          />

          {/* Action buttons */}
          <div className="message-actions">
            <button onClick={() => onPin(msg)}>📌</button>

            <button
              onClick={() => {
                const newText = prompt("Edit message:", msg.text);
                if (newText !== null) onEdit(msg.id, newText);
              }}
            >
              ✏️
            </button>

            <button onClick={() => onDelete(msg.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
