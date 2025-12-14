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

  const clientRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState(["General", "Random"]);
  const [currentRoom, setCurrentRoom] = useState(
    () => localStorage.getItem("chat_current_room") || "General"
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

  // ------------------- Functions -------------------
  const joinRoom = (room) => {
    setCurrentRoom(room);
    clientRef.current?.emitLocal("join_room", {
      room,
      fromClient: clientRef.current.id,
    });
  };

  const openPrivateChat = (user) => {
    const privateId = `${username}_private_${user}`;
    setCurrentRoom(privateId);

    clientRef.current?.emitLocal("join_room", {
      room: privateId,
      fromClient: clientRef.current.id,
    });
  };

  const sendMessage = ({ text, type = "text", audioBlob, file }) => {
    if (!clientRef.current) return;

    const payload = {
      id: `${Date.now()}_${Math.random()}`,
      from: username || "Guest",
      time: Date.now(),
      type,
    };

    if (type === "audio") payload.audioBlob = audioBlob;
    else if (type === "file") payload.file = file;
    else payload.text = text;

    // Instant local update
    setMessagesMap((prev) => {
      const copy = { ...prev };
      if (currentRoom.includes("_private_")) {
        copy[currentRoom] = [...(copy[currentRoom] || []), { ...payload, roomId: currentRoom }];
      } else {
        copy[currentRoom] = [...(copy[currentRoom] || []), { ...payload, room: currentRoom }];
      }
      saveChats("chat_messages", copy);
      return copy;
    });

    // Emit to server
    if (currentRoom.includes("_private_")) {
      payload.roomId = currentRoom;
      clientRef.current.emitLocal("private_message", { ...payload, fromClient: clientRef.current.id });
    } else {
      payload.room = currentRoom;
      clientRef.current.emitLocal("room_message", { ...payload, fromClient: clientRef.current.id });
    }
  };

  const emitTyping = () => {
    clientRef.current?.emitLocal("typing", {
      roomId: currentRoom,
      username: username || "Guest",
    });
  };

  // Edit / Delete / Pin / React handlers (update local state immediately and emit)
  const editMessage = (msgId, newText) => {
    setMessagesMap(prev => {
      const copy = { ...prev };
      for (const room in copy) {
        copy[room] = copy[room].map(m => m.id === msgId ? { ...m, text: newText, edited: true } : m);
      }
      saveChats("chat_messages", copy);
      return copy;
    });
    clientRef.current?.emitLocal("edit_message", { messageId: msgId, newText, from: username });
  };

  const deleteMessage = (msgId) => {
    setMessagesMap(prev => {
      const copy = { ...prev };
      for (const room in copy) {
        copy[room] = copy[room].filter(m => m.id !== msgId);
      }
      saveChats("chat_messages", copy);
      return copy;
    });
    clientRef.current?.emitLocal("delete_message", { messageId: msgId, from: username });
  };

  const pinMessage = (msg) => {
    setPinnedMessages(prev => {
      const next = [msg, ...prev.filter(p => p.id !== msg.id)].slice(0, 20);
      saveChats("pinned_messages", next);
      return next;
    });
    clientRef.current?.emitLocal("pin_message", msg);
  };

  const reactToMessage = (messageId, emoji) => {
    // Update local reactions map
    setMessagesMap(prev => {
      const copy = { ...prev };
      for (const r in copy) {
        copy[r] = copy[r].map(m => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };
            reactions[emoji] = reactions[emoji] || [];
            if (!reactions[emoji].includes(username)) reactions[emoji].push(username);
            return { ...m, reactions };
          }
          return m;
        });
      }
      saveChats("chat_messages", copy);
      return copy;
    });

    clientRef.current?.emitLocal("reaction", { messageId, emoji, from: username });
  };

  // ------------------- Startup -------------------
  useEffect(() => {
    if (!serverStarted) {
      startFakeServer();
      serverStarted = true;
    }

    const client = createFakeServerClient({ username, avatar });
    clientRef.current = client;

    client.on("server__online_users", setOnlineUsers);

    client.on("server__state", (payload) => {
      if (payload.rooms) setRooms(prev => Array.from(new Set([...prev, ...payload.rooms])));
      if (payload.messages) setMessagesMap(prev => ({ ...prev, ...payload.messages }));
    });

    client.on("joined_room", ({ room }) => {
      setMessagesMap(prev => ({ ...prev, [room]: prev[room] || [] }));
    });

    client.on("room_message", (msg) => {
      setMessagesMap(prev => {
        const copy = { ...prev };
        copy[msg.room] = [...(copy[msg.room] || []), msg];
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    client.on("private_message", (msg) => {
      setMessagesMap(prev => {
        const copy = { ...prev };
        copy[msg.roomId] = [...(copy[msg.roomId] || []), msg];
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    client.on("typing", ({ roomId, username }) => {
      setTypingMap(prev => ({ ...prev, [roomId]: username }));
      setTimeout(() => {
        setTypingMap(prev => {
          const cp = { ...prev };
          delete cp[roomId];
          return cp;
        });
      }, 1500);
    });

    client.on("reaction", ({ messageId, emoji, from }) => {
      // merge reactions from server to local
      setMessagesMap(prev => {
        const copy = { ...prev };
        for (const r in copy) {
          copy[r] = copy[r].map(m => {
            if (m.id === messageId) {
              const reactions = { ...(m.reactions || {}) };
              reactions[emoji] = reactions[emoji] || [];
              if (!reactions[emoji].includes(from)) reactions[emoji].push(from);
              return { ...m, reactions };
            }
            return m;
          });
        }
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    client.on("edit_message", ({ messageId, newText }) => {
      setMessagesMap(prev => {
        const copy = { ...prev };
        for (const r in copy) {
          copy[r] = copy[r].map(m => m.id === messageId ? { ...m, text: newText, edited: true } : m);
        }
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    client.on("delete_message", ({ messageId }) => {
      setMessagesMap(prev => {
        const copy = { ...prev };
        for (const r in copy) {
          copy[r] = copy[r].filter(m => m.id !== messageId);
        }
        saveChats("chat_messages", copy);
        return copy;
      });
    });

    client.on("pin_message", (msg) => {
      setPinnedMessages(prev => {
        const next = [msg, ...prev.filter(p => p.id !== msg.id)].slice(0, 20);
        saveChats("pinned_messages", next);
        return next;
      });
    });

    client.emitLocal("server__request_state", {});
    client.emitLocal("join_room", { room: currentRoom, fromClient: client.id });

    localStorage.setItem("chat_username", username);

    return () => client.disconnect();
  }, [username, avatar]);

  const safeUsername = username || "Guest";
  const safeAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(safeUsername)}`;

  return (
    <div className={`chat-root ${theme}`} style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : "none" }}>
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
          <MessageList
            messages={messagesMap[currentRoom] || []}
            me={safeUsername}
            onReact={reactToMessage}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onPin={pinMessage}
          />

          <div className="typing-row">
            {typingMap[currentRoom] && <em>{typingMap[currentRoom]} is typing…</em>}
          </div>

          <ChatInput
            onSend={(msg) => sendMessage({ text: msg, type: "text" })}
            onSendAudio={(blob) => sendMessage({ audioBlob: blob, type: "audio" })}
            onAttach={(file) => sendMessage({ file, type: "file" })}
            emitTyping={emitTyping}
          />
        </div>
      </div>
    </div>
  );
}
