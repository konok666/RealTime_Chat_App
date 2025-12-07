import React, { useState, useRef } from "react";
import { FiMic, FiTrash2, FiSend } from "react-icons/fi";
import "../styles/AudioRecorder.css";

export default function AudioRecorder({ onSendAudio, onCancel }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [timer, setTimer] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  /** Start Recording */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        // Send to parent
        if (onSendAudio) onSendAudio(audioBlob);

        // Cleanup chunks
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone Blocked:", err);
      alert("Please allow microphone access.");
    }
  };

  /** Stop Recording */
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  /** Cancel Recording */
  const cancelRecording = () => {
    chunksRef.current = []; // discard
    stopRecording();
    if (onCancel) onCancel();
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="audio-recorder">
      {!recording ? (
        <button className="record-start" onClick={startRecording}>
          <FiMic />
          <span>Start Recording</span>
        </button>
      ) : (
        <div className="recording-ui">
          <div className="wave"></div>

          <div className="timer">{formatTime(timer)}</div>

          <button className="cancel-btn" onClick={cancelRecording}>
            <FiTrash2 />
          </button>

          <button className="send-btn" onClick={stopRecording}>
            <FiSend />
          </button>
        </div>
      )}
    </div>
  );
}
