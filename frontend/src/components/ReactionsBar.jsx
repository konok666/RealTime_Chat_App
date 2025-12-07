import React from "react";
import "../styles/ReactionsBar.css";

const EMOJIS = ["❤️","😂","👍","🔥","😮","🙏","🎉"];

export default function ReactionsBar({ onPick }) {
  return (
    <div className="reactions-bar">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="reaction-btn"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
