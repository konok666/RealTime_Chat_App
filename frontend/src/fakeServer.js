// fakeServer.js
// Simple pub/sub using localStorage to simulate multiple tabs/users.
// Also provides helper APIs to emulate server behavior.

const LS_CHANNEL = "__fake_chat_channel__";

function broadcast(event, payload) {
  const msg = { id: Date.now() + "_" + Math.random(), event, payload };
  localStorage.setItem(LS_CHANNEL, JSON.stringify(msg));
  // some browsers may not trigger storage event in same tab, but other tabs will get it.
}

function listen(handler) {
  const onStorage = (e) => {
    if (e.key !== LS_CHANNEL) return;
    try {
      const data = JSON.parse(e.newValue);
      handler(data.event, data.payload);
    } catch (err) {}
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function createFakeServerClient({ username, avatar }) {
  // client object with id and local event handlers
  const id = "u_" + Math.floor(Math.random() * 1000000);
  const client = {
    id,
    username,
    avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
      username
    )}`,
    handlers: {},
    emitLocal(event, payload) {
      // emulates client sending event to server
      broadcast(event, { ...payload, fromClient: id, username });
    },
    on(event, fn) {
      client.handlers[event] = client.handlers[event] || [];
      client.handlers[event].push(fn);
    },
    trigger(event, payload) {
      (client.handlers[event] || []).forEach((h) => h(payload));
    },
  };

  // notify others that we connected
  client.emitLocal("server__user_connected", { id, username, avatar: client.avatar });
  // also request current state
  client.emitLocal("server__request_state", {});

  // listen to LS channel and dispatch to handlers (except messages from self where appropriate)
  const off = listen((event, payload) => {
    // ignore own raw echoes (but allow certain direct messages)
    // deliver events to client handlers
    client.trigger(event, payload);
  });

  // cleanup
  client.disconnect = () => {
    client.emitLocal("server__user_disconnected", { id, username });
    off();
  };

  return client;
}

// server-side simulator: listens to events on localStorage and maintains state
export function startFakeServer() {
  // server state
  const state = {
    users: {}, // id -> {id, username, avatar, lastSeen, online}
    rooms: {
      General: [],
      Random: [],
    },
    messages: {}, // roomId -> [messages]
    privateRooms: {}, // roomId -> [ids]
  };

  // apply events by listening to LS channel
  const off = listen((event, payload) => {
    if (!payload) return;
    // server-only events start with "server__" prefix
    // client events: join_room, room_message, join_private, private_message, typing, request_state, user_connected/disconnected
    switch (event) {
      case "server__user_connected": {
        state.users[payload.id] = { ...payload, online: true, lastSeen: Date.now() };
        // broadcast updated user list
        broadcast("server__online_users", Object.values(state.users));
        break;
      }
      case "server__user_disconnected": {
        if (state.users[payload.id]) {
          state.users[payload.id].online = false;
          state.users[payload.id].lastSeen = Date.now();
          broadcast("server__online_users", Object.values(state.users));
        }
        break;
      }
      case "server__request_state": {
        // reply by broadcasting full state (all clients will get it; they can filter)
        broadcast("server__state", {
          users: Object.values(state.users),
          rooms: Object.keys(state.rooms),
          messages: state.messages,
        });
        break;
      }
      case "join_room": {
        const { room, fromClient } = payload;
        if (!state.rooms[room]) state.rooms[room] = [];
        // server does not store sockets here; we keep messages array
        state.messages[room] = state.messages[room] || [];
        // notify clients that room joined (for demo)
        broadcast("joined_room", { room, client: fromClient });
        break;
      }
      case "room_message": {
        const { room, from, text, time, fromClient } = payload;
        const msg = { id: Date.now() + "_" + Math.random(), room, from, text, time, type: "room" };
        state.messages[room] = state.messages[room] || [];
        state.messages[room].push(msg);
        broadcast("room_message", msg);
        break;
      }
      case "join_private": {
        const { roomId, to, fromClient } = payload;
        state.privateRooms[roomId] = state.privateRooms[roomId] || new Set();
        state.privateRooms[roomId].add(fromClient);
        state.privateRooms[roomId].add(to);
        broadcast("joined_private", { roomId, members: Array.from(state.privateRooms[roomId]) });
        break;
      }
      case "private_message": {
        const { roomId, from, text, time, fromClient } = payload;
        const msg = { id: Date.now() + "_" + Math.random(), roomId, from, text, time, type: "private" };
        state.messages[roomId] = state.messages[roomId] || [];
        state.messages[roomId].push(msg);
        broadcast("private_message", msg);
        break;
      }
      case "typing": {
        const { roomId, username } = payload;
        broadcast("typing", { roomId, username });
        break;
      }
      case "reaction": {
        // payload: { messageId, emoji, from }
        broadcast("reaction", payload);
        break;
      }
      case "edit_message": {
        broadcast("edit_message", payload);
        break;
      }
      case "delete_message": {
        broadcast("delete_message", payload);
        break;
      }
      case "pin_message": {
        broadcast("pin_message", payload);
        break;
      }
      case "request_search": {
        const { q, roomId } = payload;
        const all = state.messages[roomId] || [];
        const res = all.filter((m) => (m.text || "").toLowerCase().includes(q.toLowerCase()));
        broadcast("search_results", { roomId, q, results: res.slice(-200) });
        break;
      }
      // other events (gifs, audio) are just broadcast to clients
      default:
        break;
    }
  });

  return () => off();
}
