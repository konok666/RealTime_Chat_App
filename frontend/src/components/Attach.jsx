import React from "react";
import { FiImage, FiFileText, FiMusic, FiMoreHorizontal } from "react-icons/fi";
import "../styles/Attach.css";

export default function Attach({ onSelectFile }) {
  const options = [
    { name: "Photos & Videos", icon: <FiImage />, accept: "image/*,video/*" },
    { name: "Document", icon: <FiFileText />, accept: ".pdf,.doc,.docx,.txt" },
    { name: "Audio", icon: <FiMusic />, accept: "audio/*" },
    { name: "Others", icon: <FiMoreHorizontal />, accept: "*" },
  ];

  const handleFileSelect = (accept) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      if (onSelectFile) onSelectFile(e.target.files);
    };
    input.click();
  };

  return (
    <div className="attach-page">
      <h2>Select file type to send</h2>
      <div className="attach-list">
        {options.map((opt) => (
          <div
            key={opt.name}
            className="attach-item"
            onClick={() => handleFileSelect(opt.accept)}
          >
            <div className="icon">{opt.icon}</div>
            <span>{opt.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
