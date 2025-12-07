import React from "react";
import "../styles/EmojiPicker.css";

const EMOJI_LIST = ["😀","😁","😂","🤣","😊","😍","😎","🤔","🙌","👍","👎","🙏","🔥","🎉","🤖"];

export default function EmojiPicker({ onPick }) {
  return (
    <div className="emoji-picker">
      {EMOJI_LIST.map(e => <button key={e} onClick={() => onPick(e)} className="emoji-btn">{e}</button>)}
    </div>
  );
}
