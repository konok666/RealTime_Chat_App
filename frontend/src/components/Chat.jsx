import React, { useEffect, useRef, useState } from "react";
import { createFakeServerClient, startFakeServer } from "../fakeServer";
import { saveChats, loadChats } from "../utils/storage";

import Header from "./Header";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

import "../styles/Chat.css";

let serverStarted = false;

export default function Chat() {
  const [username, setUsername] = useState(
    () => localStorage.getItem("chat_username") || `User${Math.floor(Math.random() * 1000)}`
  );

  const [avatar, setAvatar] = useState(
    () => localStorage.getItem("chat_avatar") || ""
  );

  const [client, setClient] = useState(null);
  const clientRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState(["General", "Random"]);
  const [currentRoom, setCurrentRoom] = useState(
    localStorage.getItem("chat_current_room") || "General"
  );

  const [messagesMap, setMessagesMap] = useState(() => {
    const saved = loadChats("chat_messages") || {};
    return { General: [], Random: [], ...saved };
  });

  const [typingMap, setTypingMap] = useState({});
  const [pinnedMessages, setPinnedMessages] = useState(
    () => loadChats("pinned_messages") || []
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem("chat_theme") || "light"
  );

  const [wallpaper, setWallpaper] = useState(
    () => localStorage.getItem("chat_wallpaper") || ""
  );

  // --- Startup ---
  useEffect(() => {
    if (!serverStarted) {
      startFakeServer();
      serverStarted = true;
    }

    const c = createFakeServerClient({ username, avatar });
    clientRef.current = c;
    setClient(c);

    c.on("server__online_users", setOnlineUsers);

    c.on("server__state", (payload) => {
      if (payload.rooms)
        setRooms((prev) => Array.from(new Set([...prev, ...payload.rooms])));
      if (payload.messages)
        setMessagesMap((prev) => ({ ...prev, ...payload.messages }));
    });

    c.on("joined_room", ({ room }) => {
      setMessagesMap((prev) => ({ ...prev, [room]: prev[room] || [] }));
    });

    c.on("room_message", (msg) => {
      setMessagesMap((prev) => {
        const copy = { ...prev };
        copy[msg.room] = [...(copy[msg.room] || []), msg];
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    c.on("private_message", (msg) => {
      setMessagesMap((prev) => {
        const copy = { ...prev };
        copy[msg.roomId] = [...(copy[msg.roomId] || []), msg];
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    c.on("typing", ({ roomId, username }) => {
      setTypingMap((prev) => ({ ...prev, [roomId]: username }));
      setTimeout(() => {
        setTypingMap((prev) => {
          const cp = { ...prev };
          delete cp[roomId];
          return cp;
        });
      }, 1500);
    });

    c.on("reaction", (payload) => {
      setMessagesMap((prev) => {
        const copy = { ...prev };
        for (const roomId in copy) {
          copy[roomId] = copy[roomId].map((m) => {
            if (m.id === payload.messageId) {
              m.reactions = m.reactions || {};
              m.reactions[payload.emoji] = m.reactions[payload.emoji] || [];
              if (!m.reactions[payload.emoji].includes(payload.from)) {
                m.reactions[payload.emoji].push(payload.from);
              }
            }
            return m;
          });
        }
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    c.on("edit_message", ({ messageId, newText }) => {
      setMessagesMap((prev) => {
        const copy = { ...prev };
        for (const r in copy) {
          copy[r] = copy[r].map((m) =>
            m.id === messageId ? { ...m, text: newText, edited: true } : m
          );
        }
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    c.on("delete_message", ({ messageId }) => {
      setMessagesMap((prev) => {
        const copy = { ...prev };
        for (const r in copy) {
          copy[r] = copy[r].filter((m) => m.id !== messageId);
        }
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    c.on("pin_message", (msg) => {
      setPinnedMessages((prev) => {
        const next = [msg, ...prev.filter((p) => p.id !== msg.id)].slice(0, 20);
        saveChats("pinned_messages", next);
        return next;
      });
    });

    c.emitLocal("server__request_state", {});
    c.emitLocal("join_room", { room: currentRoom, fromClient: c.id });

    localStorage.setItem("chat_username", username);

    return () => c.disconnect();
  }, [username, avatar, currentRoom]);

  // Persist theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chat_theme", theme);
  }, [theme]);

  // Persist wallpaper
  useEffect(() => {
    if (wallpaper) {
      localStorage.setItem("chat_wallpaper", wallpaper);
    } else {
      localStorage.removeItem("chat_wallpaper");
    }
  }, [wallpaper]);

  useEffect(() => {
    localStorage.setItem("chat_current_room", currentRoom);
  }, [currentRoom]);

  // Actions
  const joinRoom = (room) => {
    if (!clientRef.current) return;
    clientRef.current.emitLocal("join_room", {
      room,
      fromClient: clientRef.current.id,
    });
    setCurrentRoom(room);
  };

  const openPrivateChat = (user) => {
    if (!clientRef.current) return;
    const myId = clientRef.current.id;
    const otherId = user.id;
    const roomId = [myId, otherId].sort().join("_private_");

    clientRef.current.emitLocal("join_private", {
      roomId,
      to: otherId,
      fromClient: myId,
    });

    setMessagesMap((prev) => ({ ...prev, [roomId]: prev[roomId] || [] }));
    setCurrentRoom(roomId);
  };

  const sendMessage = ({ text, type = "text" }) => {
    if (!clientRef.current) return;

    const payload = {
      id: `${Date.now()}_${Math.random()}`,
      from: username || "Guest",
      text,
      time: Date.now(),
      type,
    };

    if (currentRoom.includes("_private_")) {
      payload.roomId = currentRoom;
      clientRef.current.emitLocal("private_message", {
        ...payload,
        fromClient: clientRef.current.id,
      });
    } else {
      payload.room = currentRoom;
      clientRef.current.emitLocal("room_message", {
        ...payload,
        fromClient: clientRef.current.id,
      });
    }
  };

  const emitTyping = () => {
    if (!clientRef.current) return;
    clientRef.current.emitLocal("typing", {
      roomId: currentRoom,
      username: username || "Guest",
    });
  };

  // UI
  const safeUsername = username || "Guest";
  const safeAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(safeUsername)}`;

  return (
    <div
      className="chat-root"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : "none",
      }}
    >
      <Header
        username={safeUsername}
        avatar={safeAvatar}
        setUsername={setUsername}
        setAvatar={setAvatar}
        theme={theme}
        setTheme={setTheme}
        pinCount={pinnedMessages.length}
      />

      <div className="chat-frame">
        <Sidebar
          username={safeUsername}
          avatar={safeAvatar}
          onlineUsers={onlineUsers}
          rooms={rooms}
          currentRoom={currentRoom}
          joinRoom={joinRoom}
          openPrivateChat={openPrivateChat}
          pinnedMessages={pinnedMessages}
          theme={theme}
          setTheme={setTheme}
          setWallpaper={setWallpaper}
        />

        <div className="chat-area">
          <MessageList messages={messagesMap[currentRoom] || []} me={safeUsername} />

          <div className="typing-row">
            {typingMap[currentRoom] && <em>{typingMap[currentRoom]} is typing…</em>}
          </div>

          <ChatInput sendMessage={sendMessage} emitTyping={emitTyping} />
        </div>
      </div>
    </div>
  );
}
