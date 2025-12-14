import React, { useState } from "react";
import ReactionsBar from "./ReactionsBar";
import { FaSmile } from "react-icons/fa";
import "../styles/Message.css";

export default function Message({ message, meId, onReact }) {
  const isMe = message.from === meId;

  const timeString = message.time
    ? new Date(message.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const [showReactionsBar, setShowReactionsBar] = useState(false);

  const handleReact = (emoji) => {
    onReact(message.id, emoji);
    setShowReactionsBar(false);
  };

  return (
    <div className={`message-row ${isMe ? "me" : "other"}`}>

      {/* Reaction emoji button — LEFT for me, RIGHT for others */}
      {!isMe && (
        <button
          className="emoji-trigger right"
          onClick={() => setShowReactionsBar(!showReactionsBar)}
        >
          <FaSmile size={18} />
        </button>
      )}

      <div className="message-bubble">
        <div className="message-meta">
          <span className="from">{isMe ? "You" : message.from}</span>
          <span className="time">{timeString}</span>
        </div>

        <div className="message-text">
          {message.type === "audio" ? (
            <audio
              controls
              src={URL.createObjectURL(message.audioBlob)}
              style={{ width: "100%" }}
            />
          ) : (
            message.text
          )}
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="reactions">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="reaction"
                onClick={() => handleReact(emoji)}
              >
                {emoji} {users.length}
              </div>
            ))}
          </div>
        )}

        {showReactionsBar && <ReactionsBar onPick={handleReact} />}
      </div>

      {/* LEFT side for my messages */}
      {isMe && (
        <button
          className="emoji-trigger left"
          onClick={() => setShowReactionsBar(!showReactionsBar)}
        >
          <FaSmile size={18} />
        </button>
      )}
    </div>
  );
}
