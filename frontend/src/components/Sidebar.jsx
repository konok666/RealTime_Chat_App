import React, { useState } from "react";
import { FiSettings, FiRefreshCcw } from "react-icons/fi";
import "../styles/Sidebar.css";

export default function Sidebar({
  username,
  avatar,
  onlineUsers,
  rooms,
  currentRoom,
  joinRoom,
  openPrivateChat,
  pinnedMessages,
  theme,
  setTheme,
  setWallpaper
}) {
  const [newRoom, setNewRoom] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [wallpaperInput, setWallpaperInput] = useState("");

  // --- Built-in gallery ---
  const galleryWallpapers = [
    "https://i.imgur.com/3ZQ3Z6v.jpeg",
    "https://i.imgur.com/n9zDHkn.jpeg",
    "https://i.imgur.com/1iQKJ8j.jpeg",
    "https://i.imgur.com/k2rQQbE.jpeg",
    "https://i.imgur.com/pJjWJgR.jpeg",
    "https://i.imgur.com/V7pxYjZ.jpeg",
    "https://i.imgur.com/hRk2cZe.jpeg",
    "https://i.imgur.com/3VWmE9l.jpeg",
  ];

  // --- Gradient themes ---
  const gradients = [
    { name: "Sunset", css: "linear-gradient(120deg,#ff9a9e,#fad0c4)" },
    { name: "Ocean", css: "linear-gradient(120deg,#2193b0,#6dd5ed)" },
    { name: "Neon Purple", css: "linear-gradient(120deg,#8e2de2,#4a00e0)" },
    { name: "Dark Fade", css: "linear-gradient(120deg,#232526,#414345)" },
    { name: "Pastel", css: "linear-gradient(120deg,#b3ffab,#12fff7)" },
  ];

  // --- Animated themes ---
  const animatedThemes = [
    { name: "Wave", css: "url('https://i.imgur.com/NIcC1gr.gif')" },
    { name: "Particles", css: "url('https://i.imgur.com/o7CJZ8y.gif')" },
    { name: "Dark Motion", css: "url('https://i.imgur.com/zS0d0RN.gif')" }
  ];

  return (
    <aside className="sidebar">
      {/* USER */}
      <div className="sidebar-top">
        <div className="me">
          <img src={avatar} alt="me" className="avatar-sm" />
          <div>
            <div className="me-name">{username}</div>
            <div className="me-status">Online</div>
          </div>
        </div>
      </div>

      {/* SCROLL CONTENT */}
      <div className="sidebar-content">
        {/* ROOMS */}
        <div className="rooms">
          <h5>Rooms</h5>
          <ul>
            {rooms.map((room) => (
              <li
                key={room}
                className={room === currentRoom ? "active" : ""}
                onClick={() => joinRoom(room)}
              >
                {room}
              </li>
            ))}
          </ul>

          <div className="newroom">
            <input
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="New room"
            />
            <button
              onClick={() => {
                if (newRoom.trim()) {
                  joinRoom(newRoom);
                  setNewRoom("");
                }
              }}
            >
              Create
            </button>
          </div>
        </div>

        {/* ONLINE USERS */}
        <div className="online">
          <h5>Online</h5>
          <ul>
            {onlineUsers.length === 0 ? (
              <li className="muted">No one online</li>
            ) : (
              onlineUsers.map((u) => (
                <li key={u.id}>
                  <button className="user-btn" onClick={() => openPrivateChat(u)}>
                    <img src={u.avatar} className="avatar-xs" alt="" />
                    {u.username}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* PINNED */}
        <div className="pinned">
          <h5>Pinned</h5>
          <ul>
            {pinnedMessages.length === 0 ? (
              <li className="muted">No pinned messages</li>
            ) : (
              pinnedMessages.map((p) => (
                <li key={p.id}>{p.text}</li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* SETTINGS BUTTON */}
      <div className="sidebar-bottom">
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          <FiSettings size={18} /> Settings
        </button>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="sidebar-settings-panel">
          {/* THEME */}
          <div className="setting-row">
            <label>Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* WALLPAPER URL + APPLY */}
          <div className="setting-row">
            <label>Wallpaper URL</label>
            <input
              type="text"
              placeholder="Paste an image URL"
              value={wallpaperInput}
              onChange={(e) => setWallpaperInput(e.target.value)}
            />
            <button
              className="apply-wall-btn"
              onClick={() => setWallpaper(wallpaperInput)}
            >
              Apply
            </button>
          </div>

          {/* UPLOAD IMAGE */}
          <div className="setting-row">
            <label>Upload Wallpaper</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setWallpaper(url);
                }
              }}
            />
          </div>

          {/* GALLERY */}
          <div className="gallery-section">
            <label>Wallpaper Gallery</label>
            <div className="gallery-grid">
              {galleryWallpapers.map((img) => (
                <img
                  key={img}
                  src={img}
                  className="gallery-thumb"
                  onClick={() => setWallpaper(img)}
                  alt=""
                />
              ))}
            </div>
          </div>

          {/* GRADIENTS */}
          <div className="gradient-section">
            <label>Gradient Backgrounds</label>
            <div className="gradient-grid">
              {gradients.map((g) => (
                <div
                  key={g.name}
                  className="gradient-box"
                  style={{ background: g.css }}
                  onClick={() => setWallpaper(g.css)}
                >
                  {g.name}
                </div>
              ))}
            </div>
          </div>

          {/* ANIMATED THEMES */}
          <div className="animated-section">
            <label>Animated Themes</label>
            <div className="animated-grid">
              {animatedThemes.map((a) => (
                <div
                  key={a.name}
                  className="animated-box"
                  style={{
                    backgroundImage: a.css,
                    backgroundSize: "cover"
                  }}
                  onClick={() => setWallpaper(a.css)}
                >
                  {a.name}
                </div>
              ))}
            </div>
          </div>

          {/* RESET BUTTON */}
          <button
            className="reset-btn"
            onClick={() => {
              setWallpaper("");       // remove wallpaper
              setWallpaperInput("");  // clear input
            }}
          >
            <FiRefreshCcw /> Reset Wallpaper
          </button>
        </div>
      )}
    </aside>
  );
}
