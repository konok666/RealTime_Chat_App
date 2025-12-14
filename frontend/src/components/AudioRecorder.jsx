import React, { useState, useRef, useEffect } from "react";
import { FiTrash2, FiPause, FiPlay, FiSend } from "react-icons/fi";
import "../styles/AudioRecorder.css";

export default function AudioRecorder({ onSendAudio, onCancel }) {
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  /** Auto-start on mount */
  useEffect(() => {
    startRecording();
    return () => stopTimer();
  }, []);

  /** ✅ UPDATED startRecording() */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!stream) {
        alert("Microphone not accessible.");
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      startTimer();   // timer starts safely now
    } catch (err) {
      console.error("Mic error:", err);

      if (err.name === "NotAllowedError") {
        alert("Please enable microphone access in browser settings.");
      } else {
        alert("Microphone not available.");
      }
    }
  };

  /** Pause / Resume */
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (paused) {
      mediaRecorderRef.current.resume();
      startTimer();
    } else {
      mediaRecorderRef.current.pause();
      stopTimer();
    }

    setPaused((p) => !p);
  };

  /** Timer Start */
  const startTimer = () => {
    stopTimer(); // avoid double intervals
    timerRef.current = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);
  };

  /** Timer Stop */
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  /** Cancel Recording */
  const cancelRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    if (onCancel) onCancel();
  };

  /** Send Audio */
  const sendAudio = () => {
    stopTimer();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setTimeout(() => {
      if (audioBlob && onSendAudio) {
        onSendAudio(audioBlob);
      }
    }, 200);
  };

  /** Format Time */
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audio-recorder">
      {/* Delete */}
      <button className="delete-btn" onClick={cancelRecording}>
        <FiTrash2 size={22} />
      </button>

      {/* Timer */}
      <div className="timer">
        <span className="red-dot"></span>
        <span className="time-text">{formatTime(time)}</span>
      </div>

      {/* Waveform animation */}
      <div className="waveform">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="wave-bar"
            style={{
              height: `${Math.random() * 20 + 10}px`,
              animationDelay: `${i * 0.05}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Pause / Resume */}
      <button className="pause-btn" onClick={togglePause}>
        {paused ? <FiPlay size={22} /> : <FiPause size={22} />}
      </button>

      {/* Send */}
      <button className="send-btn" onClick={sendAudio}>
        <FiSend size={22} color="#fff" />
      </button>
    </div>
  );
}
