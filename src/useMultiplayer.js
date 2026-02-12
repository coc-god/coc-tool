import { useState, useRef, useEffect, useCallback } from "react";
import Peer from "peerjs";

const CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
function randomCode() {
  let s = "coc-";
  for (let i = 0; i < 4; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export default function useMultiplayer({ onStateSync, onRemoteCommand, onNewChar, onAddLog, addLog, t }) {
  const [mode, setMode] = useState("offline");       // "offline" | "host" | "player"
  const [roomCode, setRoomCode] = useState(null);
  const [myPeerId, setMyPeerId] = useState(null);
  const [players, setPlayers] = useState(new Map());  // peerId -> { name, charId, lastSeen }
  const [connected, setConnected] = useState(false);
  const [scene, setSceneState] = useState(null);
  const [locked, setLockedState] = useState(false);

  const peerRef = useRef(null);
  const connsRef = useRef(new Map());  // host: peerId -> conn; player: "host" -> conn
  const heartbeatRef = useRef(null);
  const staleCheckRef = useRef(null);

  // Cleanup helper
  const cleanup = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (staleCheckRef.current) clearInterval(staleCheckRef.current);
    heartbeatRef.current = null;
    staleCheckRef.current = null;
    connsRef.current.forEach(c => { try { c.close(); } catch {} });
    connsRef.current = new Map();
    if (peerRef.current) { try { peerRef.current.destroy(); } catch {} }
    peerRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // ── HOST ──
  const host = useCallback((name) => {
    cleanup();
    const code = randomCode();
    let retries = 0;
    const tryCreate = (c) => {
      const peer = new Peer(c);
      peer.on("open", (id) => {
        peerRef.current = peer;
        setMode("host");
        setRoomCode(c);
        setMyPeerId(id);
        setPlayers(new Map());
        setConnected(true);
        setSceneState(null);
        setLockedState(false);
        addLog({ type: "connect", text: t.lg.hosted.replace("{code}", c) });

        // Heartbeat sender
        heartbeatRef.current = setInterval(() => {
          connsRef.current.forEach(conn => {
            try { conn.send({ type: "heartbeat" }); } catch {}
          });
        }, 5000);

        // Stale player detection
        staleCheckRef.current = setInterval(() => {
          const now = Date.now();
          setPlayers(prev => {
            const next = new Map(prev);
            let changed = false;
            for (const [pid, info] of next) {
              if (now - info.lastSeen > 15000) {
                next.delete(pid);
                changed = true;
                const conn = connsRef.current.get(pid);
                if (conn) { try { conn.close(); } catch {} connsRef.current.delete(pid); }
                addLog({ type: "connect", text: t.lg.playerLeft.replace("{name}", info.name) });
              }
            }
            return changed ? next : prev;
          });
        }, 5000);
      });

      peer.on("error", (err) => {
        if (err.type === "unavailable-id" && retries < 5) {
          retries++;
          tryCreate(randomCode());
        }
      });

      peer.on("connection", (conn) => {
        conn.on("open", () => {
          conn.on("data", (msg) => {
            if (!msg || !msg.type) return;
            if (msg.type === "join-request") {
              const peerId = conn.peer;
              connsRef.current.set(peerId, conn);
              setPlayers(prev => {
                const next = new Map(prev);
                next.set(peerId, { name: msg.playerName, charId: null, lastSeen: Date.now() });
                return next;
              });
              addLog({ type: "connect", text: t.lg.playerJoined.replace("{name}", msg.playerName) });
              // Trigger initial state sync via callback from App
              setTimeout(() => {
                if (typeof onRemoteCommand === "function") {
                  onRemoteCommand("__sync__", peerId, null, msg.playerName);
                }
              }, 100);
            } else if (msg.type === "command") {
              if (typeof onRemoteCommand === "function") {
                onRemoteCommand(msg.text, conn.peer, msg.charId, msg.playerName);
              }
            } else if (msg.type === "new-char") {
              if (typeof onNewChar === "function") {
                onNewChar(msg.char, conn.peer);
              }
            } else if (msg.type === "add-log") {
              if (typeof onAddLog === "function") {
                onAddLog(msg.entries);
              }
            } else if (msg.type === "heartbeat") {
              setPlayers(prev => {
                const next = new Map(prev);
                const info = next.get(conn.peer);
                if (info) next.set(conn.peer, { ...info, lastSeen: Date.now() });
                return next;
              });
            }
          });
        });

        conn.on("close", () => {
          const peerId = conn.peer;
          connsRef.current.delete(peerId);
          setPlayers(prev => {
            const next = new Map(prev);
            const info = next.get(peerId);
            if (info) {
              addLog({ type: "connect", text: t.lg.playerLeft.replace("{name}", info.name) });
            }
            next.delete(peerId);
            return next;
          });
        });
      });
    };
    tryCreate(code);
  }, [cleanup, addLog, t, onRemoteCommand, onNewChar, onAddLog]);

  // ── JOIN ──
  const join = useCallback((code, name) => {
    cleanup();
    const peer = new Peer();
    peer.on("open", (id) => {
      peerRef.current = peer;
      setMyPeerId(id);
      setMode("player");
      setRoomCode(code);

      const conn = peer.connect(code, { reliable: true });
      conn.on("open", () => {
        connsRef.current.set("host", conn);
        setConnected(true);
        conn.send({ type: "join-request", playerName: name });

        // Heartbeat
        heartbeatRef.current = setInterval(() => {
          try { conn.send({ type: "heartbeat" }); } catch {}
        }, 5000);
      });

      conn.on("data", (msg) => {
        if (!msg || !msg.type) return;
        if (msg.type === "state-sync") {
          if (typeof onStateSync === "function") onStateSync(msg);
        } else if (msg.type === "heartbeat") {
          // host is alive
        }
      });

      conn.on("close", () => {
        setConnected(false);
        addLog({ type: "connect", text: t.lg.disconnected });
      });

      conn.on("error", () => {
        setConnected(false);
        addLog({ type: "err", text: t.lg.roomNotFound.replace("{code}", code) });
      });
    });

    peer.on("error", (err) => {
      if (err.type === "peer-unavailable") {
        addLog({ type: "err", text: t.lg.roomNotFound.replace("{code}", code) });
        cleanup();
        setMode("offline");
        setRoomCode(null);
        setMyPeerId(null);
        setConnected(false);
      }
    });
  }, [cleanup, addLog, t, onStateSync]);

  // ── LEAVE ──
  const leave = useCallback(() => {
    cleanup();
    addLog({ type: "connect", text: t.lg.leftRoom });
    setMode("offline");
    setRoomCode(null);
    setMyPeerId(null);
    setPlayers(new Map());
    setConnected(false);
    setSceneState(null);
    setLockedState(false);
  }, [cleanup, addLog, t]);

  // ── SEND COMMAND (player → KP) ──
  const sendCommand = useCallback((text, charId, playerName) => {
    const conn = connsRef.current.get("host");
    if (conn) {
      try { conn.send({ type: "command", text, charId, playerName }); } catch {}
    }
  }, []);

  // ── SEND NEW CHAR (player → KP, for .pick) ──
  const sendNewChar = useCallback((charData) => {
    const conn = connsRef.current.get("host");
    if (conn) {
      try { conn.send({ type: "new-char", char: charData }); } catch {}
    }
  }, []);

  // ── SEND LOG ENTRIES (player → KP, for locally generated entries) ──
  const sendLog = useCallback((entries) => {
    const conn = connsRef.current.get("host");
    if (conn) {
      try { conn.send({ type: "add-log", entries }); } catch {}
    }
  }, []);

  // ── BROADCAST STATE (KP → all players) ──
  const broadcastState = useCallback((payload) => {
    connsRef.current.forEach((conn) => {
      try { conn.send({ type: "state-sync", ...payload }); } catch {}
    });
  }, []);

  // ── SET SCENE (KP only) ──
  const setScene = useCallback((text) => {
    setSceneState(text);
  }, []);

  // ── SET LOCKED (KP only) ──
  const setLocked = useCallback((val) => {
    setLockedState(val);
  }, []);

  return {
    mode,
    roomCode,
    myPeerId,
    players,
    connected,
    scene,
    locked,
    host,
    join,
    leave,
    sendCommand,
    sendNewChar,
    sendLog,
    broadcastState,
    setScene,
    setLocked,
  };
}
