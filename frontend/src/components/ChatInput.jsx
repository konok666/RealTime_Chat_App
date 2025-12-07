import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiSmile, FiMic, FiPlus } from "react-icons/fi";
import EmojiPicker from "./EmojiPicker";
import Attach from "./Attach";
import AudioRecorder from "./AudioRecorder";
import "../styles/ChatInput.css";

export default function ChatInput({ onSend, onAttach, onSendAudio }) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [animateAttach, setAnimateAttach] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);

  /** Auto resize text area */
  useEffect(() => {
    const ta = textareaRef.current;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [message]);

  /** Close emoji or attach when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowEmoji(false);
        setShowRecorder(false);
        if (showAttach) closeAttach();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttach]);

  /** Send Text Message */
  const handleSend = () => {
    if (message.trim() === "") return;
    onSend(message);
    setMessage("");
  };

  /** Enter = send */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** Add emoji */
  const handleEmojiPick = (emoji) => {
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    const newText = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newText);

    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length;
      ta.focus();
    }, 0);
  };

  /** Attach panel open/close */
  const toggleAttach = () => {
    if (showAttach) {
      closeAttach();
    } else {
      setShowAttach(true);
      setAnimateAttach(true);
    }
  };

  const closeAttach = () => {
    setAnimateAttach(false);
    setTimeout(() => setShowAttach(false), 200);
  };

  /** Mic clicked → open Audio Recorder */
  const openRecorder = () => {
    setShowRecorder(true);
    setShowEmoji(false);
    closeAttach();
  };

  return (
    <div className="chat-input-wrapper" ref={wrapperRef}>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="emoji-picker-container">
          <EmojiPicker onPick={handleEmojiPick} />
        </div>
      )}

      {/* Attach Panel */}
      {showAttach && (
        <div
          className={`attach-panel ${
            animateAttach ? "attach-panel-open" : "attach-panel-close"
          }`}
        >
          <Attach onSelectFile={(f) => onAttach(f)} />
        </div>
      )}

      {/* Audio Recorder */}
      {showRecorder && (
        <div className="audio-recorder-popup">
          <AudioRecorder
            onSendAudio={(blob) => {
              onSendAudio(blob);
              setShowRecorder(false);
            }}
            onCancel={() => setShowRecorder(false)}
          />
        </div>
      )}

      {/* Main Input Bar */}
      <div className="chat-input">
        <div className="left-controls">
          <button className="attach-btn" onClick={toggleAttach}>
            <FiPlus />
          </button>

          <button
            className="emoji-btn"
            onClick={() => setShowEmoji((p) => !p)}
          >
            <FiSmile />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
        />

        <div className="right-controls">
          {message ? (
            <button className="send-btn" onClick={handleSend}>
              <FiSend />
            </button>
          ) : (
            <button className="mic-btn" onClick={openRecorder}>
              <FiMic />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
