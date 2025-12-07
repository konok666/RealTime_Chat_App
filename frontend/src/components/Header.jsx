import React, { useState } from "react";
import "../styles/Header.css";

export default function Header({ username, avatar, setUsername, setAvatar, theme, setTheme, pinCount }) {
  const [open, setOpen] = useState(false);
  const [nameVal, setNameVal] = useState(username);

  const saveProfile = () => {
    setUsername(nameVal);
    localStorage.setItem("chat_username", nameVal);
    setOpen(false);
  };

  return (
    <header className="chat-header">
      <div className="left">
        <div className="logo">ChatPro</div>
        <div className="search-mini">🔎</div>
      </div>

      <div className="center">
        <div className="title">Premium Chat • {pinCount} pinned</div>
      </div>

      <div className="right">
        <button className="theme-btn" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <div className="profile-menu">
          <img src={avatar} alt="avatar" className="avatar" onClick={() => setOpen((s) => !s)} />
          {open && (
            <div className="profile-popup">
              <label>
                Name
                <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} />
              </label>
              <label>
                Avatar URL
                <input onChange={(e) => setAvatar(e.target.value)} placeholder="paste image url" />
              </label>
              <div className="profile-actions">
                <button onClick={saveProfile}>Save</button>
                <button onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
