import React, { useState } from "react";
import "../styles/SettingsPanel.css";

export default function SettingsPanel({ theme, setTheme, setWallpaper }) {
  const [wallUrl, setWallUrl] = useState("");

  return (
    <aside className="settings-panel">
      <h4>Settings</h4>

      <div className="setting-row">
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="setting-row">
        <label>Wallpaper URL</label>
        <input
          value={wallUrl}
          placeholder="Paste wallpaper URL"
          onChange={(e) => setWallUrl(e.target.value)}
        />

        {/* APPLY BUTTON WITH CSS CLASS */}
        <button
          className="apply-wallpaper-btn"
          onClick={() => {
            setWallpaper(wallUrl);
            setWallUrl("");
          }}
        >
          Apply
        </button>
      </div>

      <div className="setting-row small">
        <em>Tip: open another tab and set different username to simulate other user.</em>
      </div>
    </aside>
  );
}
