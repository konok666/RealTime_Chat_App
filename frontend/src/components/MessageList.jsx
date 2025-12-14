import React, { useEffect, useRef } from "react";
import Message from "./Message";
import "../styles/MessageList.css";

export default function MessageList({ messages, me, onReact, onEdit, onDelete, onPin }) {
  const ref = useRef();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div className="message-list" ref={ref}>
      {messages.length === 0 && (
        <div className="empty-msg">No messages yet — say hi 👋</div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`message-container ${msg.from === me ? "me" : "other"}`}>
          {/* Message Bubble */}
          <Message
            message={msg}
            meId={me}
            onReact={onReact}
          />

          {/* Action Buttons */}
          <div className="message-actions">
            <button onClick={() => onPin(msg)} title="Pin message">📌</button>

            <button
              onClick={() => {
                const newText = prompt("Edit message:", msg.text);
                if (newText !== null && newText.trim() !== "") {
                  onEdit(msg.id, newText);
                }
              }}
              title="Edit message"
            >
              ✏️
            </button>

            <button onClick={() => onDelete(msg.id)} title="Delete message">🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
