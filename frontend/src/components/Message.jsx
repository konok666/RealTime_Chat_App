import React, { useState } from "react";
import ReactionsBar from "./ReactionsBar";
import { FaSmile } from "react-icons/fa";
import "../styles/Message.css";

//const DEFAULT_EMOJIS = ["😀","😁","😂","😍","👍","👎","🙏","🔥","🎉"];

export default function Message({ message, meId, onReact }) {
  const isMe = message.from === meId || message.from === "me";

  const timeString = message.time
    ? new Date(message.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  //const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);

  const handleReact = (emoji) => {
    onReact(message.id, emoji);
    //setShowEmojiPicker(false);
    setShowReactionsBar(false);
  };

  return (
    <div className={`message-row ${isMe ? "me" : "other"}`}>

      <div className="message-bubble">

        {/* Message Meta */}
        <div className="message-meta">
          <span className="from">{isMe ? "You" : message.from}</span>
          <span className="time">{timeString}</span>
        </div>

        {/* Message Text */}
        <div className="message-text">{message.text}</div>

        {/* Private Tag */}
        {message.private && <div className="private-tag">private</div>}

        {/* Existing Reactions */}
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

        {/* Emoji Picker */}
        {/* {showEmojiPicker && (
          <div className="emoji-picker show">
            {DEFAULT_EMOJIS.map((emoji) => (
              <span
                key={emoji}
                className="emoji-item"
                onClick={() => handleReact(emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>
        )} */}

        {/* WhatsApp-like Reactions Bar */}
        {showReactionsBar && <ReactionsBar onPick={handleReact} />}

      </div>

      {/* Reaction Trigger Buttons */}
      <button
        className="emoji-trigger"
        onClick={() => setShowReactionsBar(!showReactionsBar)}
      >
        <FaSmile size={18} />
      </button>

      {/* <div
        className="emoji-toggle"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        😊
      </div> */}

    </div>
  );
}
