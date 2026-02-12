import { useState, useEffect, useRef, useCallback } from "react";
import useMultiplayer from "./useMultiplayer.js";

/* ═══════════ i18n ═══════════ */
const T = {
  en: {
    title: "Call of Cthulhu 7e", subtitle: "Session Playground",
    langSwitch: "中文",
    tabs: { chars: "Characters", session: "Session" },
    cp: {
      add: "+ New Investigator", none: "No investigators yet. Create one to begin.",
      name: "Name", hp: "HP", san: "SAN", skills: "Skills",
      addSkill: "+ Skill", save: "Save", cancel: "Cancel",
      del: "Delete", edit: "Edit", confirmDel: "Remove this investigator?",
      max: "max",
    },
    sp: {
      pickChar: "Pick your investigator",
      inputPh: "Type a message or command (.help for list)",
      noChars: "Create investigators on the Characters tab first.",
      empty: "Session hasn't started yet. Pick a character and type something!",
      export: "Export", clear: "Clear", clearConfirm: "Clear all session log?",
    },
    help: {
      title: "── Commands ──",
      lines: [
        ".rc <skill>        — Skill check  (e.g. .rc Spot Hidden)",
        ".rc <number>       — Custom check  (e.g. .rc 65)",
        ".rc <skill> b2     — With 2 bonus dice",
        ".rc <skill> p1     — With 1 penalty die",
        ".push              — Push your last failed roll",
        ".hp -3  /  .hp +2  — Adjust your HP",
        ".san -5 / .san +1  — Adjust your SAN",
        ".gen <total>       — Generate 5 random attribute sets",
        ".pick <1-5> [name] — Create character from a generated set",
        ".host [name]       — Host a multiplayer room as Keeper",
        ".join <code> [name]— Join a room as player",
        ".leave             — Disconnect from room",
        ".scene <text>      — (KP) Set scene description",
        ".npc <name> [hp]   — (KP) Create NPC",
        ".secret <skill> [b/p] — (KP) Secret roll (only you see)",
        ".lock / .unlock    — (KP) Lock/unlock player input",
        ".adj <name> hp/san ±N — (KP) Adjust any character's stats",
        "(text)             — Out-of-character comment",
        "anything else      — In-character message",
      ],
    },
    lv: {
      CRITICAL: "Critical!", EXTREME: "Extreme Success",
      HARD: "Hard Success", REGULAR: "Regular Success",
      FAILURE: "Failure", FUMBLE: "Fumble!",
    },
    lg: {
      rolled: "rolled", push: "(Pushed)", vs: "vs",
      joined: "joined the session", removed: "left the session",
      a: "→", noSkill: "Skill not found", noChar: "Select a character first",
      pushFail: "Nothing to push", pushNone: "No previous failed roll to push",
      gen: "Generated attribute sets", genTotal: "Total", genSet: "Set",
      genPick: "Pick a set", genRange: "Total must be 210\u2013810 (multiple of 5)",
      genBadTotal: "Invalid total", genNoPending: "No pending sets \u2014 use .gen first",
      genBadIdx: "Invalid set number (1\u20135)", attrs: "Attributes",
      hosted: "Room created: {code}", playerJoined: "{name} joined the room",
      playerLeft: "{name} disconnected", disconnected: "Disconnected from host",
      leftRoom: "Left the room", roomNotFound: "Room not found: {code}",
      npcCreated: "NPC created: {name}", secretRoll: "Secret",
      locked: "Input locked", unlocked: "Input unlocked",
      inputLocked: "Input locked by Keeper", charNotFound: "Character not found: {name}",
      sceneLabel: "Scene", kpBadge: "KP", npcBadge: "NPC", copyCode: "Copy", copied: "Copied!",
    },
    connBar: {
      offline: "Offline", hosting: "Hosting", connected: "Connected",
      players: "Players", roomCode: "Room",
    },
  },
  zh: {
    title: "克苏鲁的呼唤 7版", subtitle: "跑团场景",
    langSwitch: "EN",
    tabs: { chars: "角色", session: "跑团" },
    cp: {
      add: "+ 新调查员", none: "暂无调查员，请先创建角色。",
      name: "姓名", hp: "生命值", san: "理智值", skills: "技能",
      addSkill: "+ 技能", save: "保存", cancel: "取消",
      del: "删除", edit: "编辑", confirmDel: "确定移除此调查员？",
      max: "上限",
    },
    sp: {
      pickChar: "选择你的调查员",
      inputPh: "输入消息或指令（.help 查看列表）",
      noChars: "请先在角色页创建调查员。",
      empty: "场景尚未开始。选择角色后输入内容吧！",
      export: "导出", clear: "清空", clearConfirm: "确定清空所有日志？",
    },
    help: {
      title: "── 指令列表 ──",
      lines: [
        ".rc <技能>         — 技能检定（如 .rc 侦查）",
        ".rc <数字>         — 自定义检定（如 .rc 65）",
        ".rc <技能> b2      — 附带2个奖励骰",
        ".rc <技能> p1      — 附带1个惩罚骰",
        ".push              — 孤注一掷（上次失败的检定）",
        ".hp -3  /  .hp +2  — 调整生命值",
        ".san -5 / .san +1  — 调整理智值",
        ".gen <总数>        — 随机生成5组属性",
        ".pick <1-5> [名字] — 从生成的属性组创建角色",
        ".host [名字]       — 以守密人身份创建多人房间",
        ".join <代码> [名字]— 以玩家身份加入房间",
        ".leave             — 断开连接",
        ".scene <文字>      — (守密人) 设置场景描述",
        ".npc <名字> [hp]   — (守密人) 创建NPC",
        ".secret <技能> [b/p] — (守密人) 暗骰（仅自己可见）",
        ".lock / .unlock    — (守密人) 锁定/解锁玩家输入",
        ".adj <名字> hp/san ±N — (守密人) 调整任意角色属性",
        "(文字)             — 题外话 / OOC",
        "其他文字            — 角色扮演 / 叙述",
      ],
    },
    lv: {
      CRITICAL: "大成功！", EXTREME: "极难成功",
      HARD: "困难成功", REGULAR: "成功",
      FAILURE: "失败", FUMBLE: "大失败！",
    },
    lg: {
      rolled: "检定", push: "(孤注一掷)", vs: "对抗",
      joined: "加入了场景", removed: "离开了场景",
      a: "→", noSkill: "未找到该技能", noChar: "请先选择角色",
      pushFail: "没有可孤注一掷的检定", pushNone: "没有上次失败的检定可以孤注一掷",
      gen: "已生成属性组", genTotal: "总数", genSet: "组",
      genPick: "选择一组", genRange: "总数必须为210\u2013810（5的倍数）",
      genBadTotal: "无效总数", genNoPending: "没有待选属性组——请先使用 .gen",
      genBadIdx: "无效编号（1\u20135）", attrs: "属性",
      hosted: "房间已创建：{code}", playerJoined: "{name} 加入了房间",
      playerLeft: "{name} 已断开连接", disconnected: "与主持人断开连接",
      leftRoom: "已离开房间", roomNotFound: "未找到房间：{code}",
      npcCreated: "NPC 已创建：{name}", secretRoll: "暗骰",
      locked: "输入已锁定", unlocked: "输入已解锁",
      inputLocked: "守密人已锁定输入", charNotFound: "未找到角色：{name}",
      sceneLabel: "场景", kpBadge: "守密人", npcBadge: "NPC", copyCode: "复制", copied: "已复制！",
    },
    connBar: {
      offline: "离线", hosting: "主持中", connected: "已连接",
      players: "玩家", roomCode: "房间",
    },
  },
};

const SKILL_DEFAULTS = [
  { en: "Spot Hidden", zh: "侦查", v: 25 },
  { en: "Listen", zh: "聆听", v: 20 },
  { en: "Library Use", zh: "图书馆使用", v: 20 },
  { en: "Psychology", zh: "心理学", v: 10 },
  { en: "Stealth", zh: "潜行", v: 20 },
  { en: "Dodge", zh: "闪避", v: 0 },
  { en: "First Aid", zh: "急救", v: 30 },
  { en: "Persuade", zh: "说服", v: 10 },
  { en: "Fighting (Brawl)", zh: "格斗(斗殴)", v: 25 },
  { en: "Firearms (Handgun)", zh: "射击(手枪)", v: 20 },
  { en: "Occult", zh: "神秘学", v: 5 },
  { en: "Cthulhu Mythos", zh: "克苏鲁神话", v: 0 },
  { en: "Drive Auto", zh: "驾驶(汽车)", v: 20 },
  { en: "Climb", zh: "攀爬", v: 20 },
  { en: "Swim", zh: "游泳", v: 20 },
];
function defaultSkills(lang) {
  const o = {};
  SKILL_DEFAULTS.forEach(s => { o[s[lang]] = s.v; });
  return o;
}

/* ═══════════ Attributes ═══════════ */
const ATTRS = [
  { key: "STR", en: "STR", zh: "力量", min: 15, max: 90 },
  { key: "CON", en: "CON", zh: "体质", min: 15, max: 90 },
  { key: "SIZ", en: "SIZ", zh: "体型", min: 40, max: 90 },
  { key: "DEX", en: "DEX", zh: "敏捷", min: 15, max: 90 },
  { key: "APP", en: "APP", zh: "外貌", min: 15, max: 90 },
  { key: "INT", en: "INT", zh: "智力", min: 40, max: 90 },
  { key: "POW", en: "POW", zh: "意志", min: 15, max: 90 },
  { key: "EDU", en: "EDU", zh: "教育", min: 40, max: 90 },
  { key: "LCK", en: "LCK", zh: "幸运", min: 15, max: 90 },
];
const ATTR_MIN = ATTRS.reduce((s, a) => s + a.min, 0);
const ATTR_MAX = ATTRS.reduce((s, a) => s + a.max, 0);

function genAttrSet(total) {
  const vals = ATTRS.map(a => a.min);
  let remaining = total - ATTR_MIN;
  const indices = ATTRS.map((_, i) => i);
  let safety = 10000;
  while (remaining > 0 && --safety > 0) {
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    let distributed = false;
    for (const idx of indices) {
      if (remaining <= 0) break;
      const room = ATTRS[idx].max - vals[idx];
      if (room >= 5) { vals[idx] += 5; remaining -= 5; distributed = true; }
    }
    if (!distributed) break;
  }
  const o = {};
  ATTRS.forEach((a, i) => { o[a.key] = vals[i]; });
  return o;
}

function genAttrSets(total, n) {
  const sets = [];
  for (let i = 0; i < n; i++) sets.push(genAttrSet(total));
  return sets;
}

/* ═══════════ Dice ═══════════ */
function rD10() { return Math.floor(Math.random() * 10); }
function resolveRoll(bp) {
  const units = rD10();
  const n = Math.abs(bp);
  const tens = [];
  for (let i = 0; i <= n; i++) tens.push(rD10());
  let chosen;
  if (bp > 0) chosen = Math.min(...tens);
  else if (bp < 0) chosen = Math.max(...tens);
  else chosen = tens[0];
  let result = chosen * 10 + units;
  if (result === 0) result = 100;
  return { result, units, tens, chosen };
}
function getLevel(roll, skill) {
  if (roll === 1) return "CRITICAL";
  if (roll === 100) return "FUMBLE";
  if (skill < 50 && roll >= 96) return "FUMBLE";
  if (roll <= Math.floor(skill / 5)) return "EXTREME";
  if (roll <= Math.floor(skill / 2)) return "HARD";
  if (roll <= skill) return "REGULAR";
  return "FAILURE";
}

const LS = {
  CRITICAL: { c: "#d4aa3e", bg: "rgba(212,170,62,0.10)", i: "✦" },
  EXTREME:  { c: "#6aaa5a", bg: "rgba(106,170,90,0.08)", i: "◆" },
  HARD:     { c: "#5a8abb", bg: "rgba(90,138,187,0.08)", i: "◇" },
  REGULAR:  { c: "#9a9a88", bg: "rgba(154,154,136,0.06)", i: "●" },
  FAILURE:  { c: "#8a6a5a", bg: "rgba(138,106,90,0.06)", i: "✕" },
  FUMBLE:   { c: "#c83a3a", bg: "rgba(200,58,58,0.10)", i: "☠" },
};

let _id = Date.now();
function uid() { return String(++_id); }
function now() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

/* ═══════════ Storage ═══════════ */
const SK = "coc7e-playground";
function ld() { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } }
function sv(d) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} }

/* ═══════════ Theme ═══════════ */
const P = {
  bg: "#0d0d0b", s1: "#141412", s2: "#1a1a17",
  b: "#282824", bl: "#383832",
  t: "#c8bfa0", td: "#6a6558", tb: "#e0d8c0",
  ac: "#c9a84c", acd: "#8a7a3a",
  r: "#a84040", g: "#5a8a50", bl2: "#5a7a9a",
};
const inp = {
  background: P.s1, border: `1px solid ${P.b}`, borderRadius: 6,
  color: P.t, padding: "6px 10px", fontFamily: "'Crimson Text',serif",
  fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
};
const bt = {
  background: P.s2, border: `1px solid ${P.b}`, borderRadius: 6,
  color: P.t, padding: "7px 14px", fontFamily: "'Cinzel',serif",
  fontSize: 13, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.03em",
};
const abt = {
  ...bt, background: "linear-gradient(145deg,#2a2518,#1e1a10)",
  border: `1px solid ${P.acd}`, color: P.ac,
};

const CCOLS = ["#c9a84c","#6aaa8a","#aa6a8a","#7a9aca","#ca8a4a","#8a6aca","#5aba7a","#ca5a5a"];
function cc(i) { return CCOLS[i % CCOLS.length]; }

/* ═══════════ Inline Dice ═══════════ */
function DiceInline({ tens, chosen, units }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center", verticalAlign: "middle", margin: "0 4px" }}>
      {tens.map((v, i) => {
        const on = tens.length > 1 ? (i === tens.indexOf(chosen) && v === chosen) : true;
        return (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700,
            fontFamily: "'Cinzel',serif",
            background: on ? "rgba(201,168,76,0.15)" : "rgba(80,80,70,0.2)",
            border: `1px solid ${on ? "rgba(201,168,76,0.4)" : "rgba(80,80,70,0.3)"}`,
            color: on ? P.ac : "#555", opacity: on ? 1 : 0.5,
          }}>{v === 0 ? "00" : v * 10}</span>
        );
      })}
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700,
        fontFamily: "'Cinzel',serif",
        background: "rgba(180,170,140,0.1)", border: "1px solid rgba(180,170,140,0.25)", color: P.tb,
      }}>{units}</span>
    </span>
  );
}

/* ═══════════ Stat Bar ═══════════ */
function Bar({ label, cur, max, color, onAdj }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: P.td, width: 30, textAlign: "right" }}>{label}</span>
      <button onClick={() => onAdj(-1)} style={{ ...bt, padding: "1px 7px", fontSize: 14, borderRadius: 4, lineHeight: 1 }}>−</button>
      <div style={{ flex: 1, height: 18, background: P.s1, borderRadius: 9, border: `1px solid ${P.b}`, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color}77,${color})`, borderRadius: 9, transition: "width 0.4s" }} />
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Cinzel',serif", color: P.tb, textShadow: "0 1px 3px #000" }}>{cur}/{max}</span>
      </div>
      <button onClick={() => onAdj(1)} style={{ ...bt, padding: "1px 7px", fontSize: 14, borderRadius: 4, lineHeight: 1 }}>+</button>
    </div>
  );
}

/* ═════════════════════ MAIN ═════════════════════ */
export default function App() {
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState("chars");
  const [chars, setChars] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [log, setLog] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [logIn, setLogIn] = useState("");
  const [lastRolls, setLastRolls] = useState({});
  const [pendingSets, setPendingSets] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const [editing, setEditing] = useState(null);
  const [fn, setFn] = useState(""); const [fhp, setFhp] = useState(10); const [fhpM, setFhpM] = useState(10);
  const [fsan, setFsan] = useState(50); const [fsanM, setFsanM] = useState(99);
  const [fsk, setFsk] = useState({}); const [nsn, setNsn] = useState(""); const [nsv, setNsv] = useState(10);
  const [fAttrs, setFAttrs] = useState(null);

  const logEnd = useRef(null);
  const inputRef = useRef(null);
  const broadcastTimerRef = useRef(null);
  const t = T[lang];
  const active = chars.find(c => c.id === activeId) || null;
  const aIdx = chars.findIndex(c => c.id === activeId);

  const addLog = useCallback((e) => setLog(prev => [...prev, { id: uid(), time: now(), ...e }]), []);

  // ── State sync handler (player receives from KP) ──
  const handleStateSync = useCallback((msg) => {
    setChars(msg.chars || []);
    setLog(msg.log || []);
    setLastRolls(msg.lastRolls || {});
    // Preserve activeId if char still exists, else auto-pick own char
    setActiveId(prev => {
      if (msg.chars?.some(c => c.id === prev)) return prev;
      const own = msg.chars?.find(c => c.ownerId === msg._myPeerId);
      return own ? own.id : prev;
    });
  }, []);

  // ── Remote command handler (KP receives from player) ──
  const handleRemoteCommand = useCallback((text, fromPeerId, charId, playerName) => {
    // __sync__ is a special signal to trigger broadcast after join
    if (text === "__sync__") return;
    // Find the char — may be null for commands like .gen/.pick/OOC
    setChars(curChars => {
      setLog(curLog => {
        setLastRolls(curRolls => {
          const char = charId ? curChars.find(c => c.id === charId) : null;
          const charIdx = char ? curChars.findIndex(c => c.id === charId) : -1;
          // For char-bound commands, verify ownership
          if (char && char.ownerId !== fromPeerId) return curRolls;
          processCommandFromRemote(text, char, charIdx, playerName, curChars, curLog, curRolls, fromPeerId);
          return curRolls;
        });
        return curLog;
      });
      return curChars;
    });
  }, []);

  // ── Multiplayer hook ──
  const mp = useMultiplayer({ onStateSync: handleStateSync, onRemoteCommand: handleRemoteCommand, addLog, t });

  useEffect(() => { const d = ld(); if (d) { d.chars && setChars(d.chars); d.log && setLog(d.log); d.activeId && setActiveId(d.activeId); d.lang && setLang(d.lang); d.lastRolls && setLastRolls(d.lastRolls); } setLoaded(true); }, []);
  useEffect(() => {
    if (!loaded) return;
    // Player mode: only persist lang and activeId
    if (mp.mode === "player") {
      const h = setTimeout(() => sv({ lang, activeId }), 400);
      return () => clearTimeout(h);
    }
    const h = setTimeout(() => sv({ chars, log: log.slice(-500), activeId, lang, lastRolls }), 400);
    return () => clearTimeout(h);
  }, [chars, log, activeId, lang, lastRolls, loaded, mp.mode]);
  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  // ── Auto-broadcast (KP side) ──
  useEffect(() => {
    if (mp.mode !== "host") return;
    if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);
    broadcastTimerRef.current = setTimeout(() => {
      // Filter secret entries from log before sending
      const filteredLog = log.filter(e => e.type !== "secret");
      const playersArr = [];
      mp.players.forEach((v, k) => playersArr.push({ peerId: k, ...v }));
      mp.broadcastState({
        chars,
        log: filteredLog.slice(-500),
        scene: mp.scene,
        locked: mp.locked,
        lastRolls,
        players: playersArr,
      });
    }, 100);
    return () => { if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current); };
  }, [chars, log, mp.scene, mp.locked, lastRolls, mp.mode, mp.broadcastState, mp.players]);

  // ── Char ops ──
  function startNew() { setEditing("new"); setFn(""); setFhp(10); setFhpM(10); setFsan(50); setFsanM(99); setFsk({ ...defaultSkills(lang) }); setFAttrs(null); }
  function startEdit(c) { setEditing(c.id); setFn(c.name); setFhp(c.hp); setFhpM(c.hpMax); setFsan(c.san); setFsanM(c.sanMax); setFsk({ ...c.skills }); setFAttrs(c.attrs || null); }
  function saveChar() {
    if (!fn.trim()) return;
    const ownerId = mp.mode === "host" ? "kp" : mp.mode === "player" ? mp.myPeerId : null;
    if (editing === "new") {
      const id = uid();
      setChars(p => [...p, { id, name: fn.trim(), hp: fhp, hpMax: fhpM, san: fsan, sanMax: fsanM, skills: { ...fsk }, attrs: fAttrs, ownerId }]);
      setActiveId(id);
      addLog({ type: "sys", cn: fn.trim(), text: t.lg.joined });
    } else {
      setChars(p => p.map(c => {
        if (c.id !== editing) return c;
        Object.keys(fsk).forEach(sk => { if (c.skills[sk] !== undefined && c.skills[sk] !== fsk[sk]) addLog({ type: "skill", cn: c.name, text: `${sk} ${c.skills[sk]} ${t.lg.a} ${fsk[sk]}`, cIdx: chars.findIndex(x => x.id === c.id) }); });
        if (c.hp !== fhp || c.hpMax !== fhpM) addLog({ type: "hp", cn: c.name, text: `HP ${c.hp}/${c.hpMax} ${t.lg.a} ${fhp}/${fhpM}`, cIdx: chars.findIndex(x => x.id === c.id) });
        if (c.san !== fsan || c.sanMax !== fsanM) addLog({ type: "san", cn: c.name, text: `SAN ${c.san}/${c.sanMax} ${t.lg.a} ${fsan}/${fsanM}`, cIdx: chars.findIndex(x => x.id === c.id) });
        return { ...c, name: fn.trim(), hp: fhp, hpMax: fhpM, san: fsan, sanMax: fsanM, skills: { ...fsk }, attrs: fAttrs };
      }));
    }
    setEditing(null);
  }
  function delChar(id) { if (!window.confirm(t.cp.confirmDel)) return; const c = chars.find(x => x.id === id); if (c) addLog({ type: "sys", cn: c.name, text: t.lg.removed }); setChars(p => p.filter(x => x.id !== id)); if (activeId === id) setActiveId(null); setEditing(null); }
  function adjStat(cid, stat, d) {
    // Player mode: send command to KP instead of local mutation
    if (mp.mode === "player") {
      const c = chars.find(x => x.id === cid);
      if (c) mp.sendCommand(`.${stat} ${d > 0 ? "+" : ""}${d}`, cid, displayName || c.name);
      return;
    }
    setChars(p => p.map(c => {
      if (c.id !== cid) return c;
      const nv = Math.max(0, Math.min(c[stat + "Max"], c[stat] + d));
      if (nv !== c[stat]) addLog({ type: stat === "hp" ? "hp" : "san", cn: c.name, text: `${stat.toUpperCase()} ${c[stat]} ${t.lg.a} ${nv} (${d > 0 ? "+" : ""}${d})`, cIdx: chars.findIndex(x => x.id === cid) });
      return { ...c, [stat]: nv };
    }));
  }

  // ── Extracted command logic (shared by local + remote) ──
  function processCommand(raw, char, charIdx, senderName, fromPeerId) {
    const cIdx = charIdx;
    const cn = char?.name || senderName;

    // OOC
    if (raw.startsWith("(")) { addLog({ type: "ooc", cn, text: raw, cIdx }); return; }
    // .help
    if (raw.toLowerCase() === ".help") { addLog({ type: "help", text: t.help.title + "\n" + t.help.lines.join("\n") }); return; }
    // .gen <total>
    const genM = raw.match(/^\.gen\s+(\d+)$/i);
    if (genM) {
      const total = parseInt(genM[1], 10);
      if (total < ATTR_MIN || total > ATTR_MAX || total % 5 !== 0) {
        addLog({ type: "err", text: `${t.lg.genBadTotal}: ${total}. ${t.lg.genRange}` });
        return;
      }
      const sets = genAttrSets(total, 5);
      setPendingSets({ total, sets });
      addLog({ type: "gen", total, sets });
      return;
    }

    // .pick <1-5> [name]
    const pickM = raw.match(/^\.pick\s+(\d+)(?:\s+(.+))?$/i);
    if (pickM) {
      if (!pendingSets) { addLog({ type: "err", text: t.lg.genNoPending }); return; }
      const idx = parseInt(pickM[1], 10);
      if (idx < 1 || idx > pendingSets.sets.length) { addLog({ type: "err", text: `${t.lg.genBadIdx}: ${idx}` }); return; }
      const chosen = pendingSets.sets[idx - 1];
      const name = (pickM[2] || "").trim() || (lang === "zh" ? "\u8C03\u67E5\u5458" : "Investigator");
      const hp = Math.floor((chosen.CON + chosen.SIZ) / 10);
      const id = uid();
      const ownerId = fromPeerId || (mp.mode === "host" ? "kp" : mp.mode === "player" ? mp.myPeerId : null);
      setChars(p => [...p, { id, name, hp, hpMax: hp, san: chosen.POW, sanMax: 99, skills: { ...defaultSkills(lang) }, attrs: { ...chosen }, ownerId }]);
      if (!fromPeerId) setActiveId(id);
      setPendingSets(null);
      addLog({ type: "pick", cn: name, idx, attrs: chosen });
      addLog({ type: "sys", cn: name, text: t.lg.joined });
      return;
    }

    // Need char for remaining commands
    if (raw.startsWith(".") && !char) { addLog({ type: "err", text: t.lg.noChar }); return; }

    // .hp / .san
    const sm = raw.match(/^\.(hp|san)\s+([+-]?\d+)$/i);
    if (sm && char) {
      const stat = sm[1].toLowerCase();
      const d = parseInt(sm[2], 10);
      setChars(p => p.map(c => {
        if (c.id !== char.id) return c;
        const nv = Math.max(0, Math.min(c[stat + "Max"], c[stat] + d));
        if (nv !== c[stat]) addLog({ type: stat === "hp" ? "hp" : "san", cn: c.name, text: `${stat.toUpperCase()} ${c[stat]} ${t.lg.a} ${nv} (${d > 0 ? "+" : ""}${d})`, cIdx });
        return { ...c, [stat]: nv };
      }));
      return;
    }

    // .push
    if (raw.toLowerCase() === ".push" && char) {
      const lr = lastRolls[char.id];
      if (!lr || lr.level !== "FAILURE") { addLog({ type: "err", cn: char.name, text: t.lg.pushNone, cIdx }); return; }
      const roll = resolveRoll(lr.bp);
      const level = getLevel(roll.result, lr.sv);
      setLastRolls(prev => ({ ...prev, [char.id]: { ...lr, level, pushed: true } }));
      addLog({ type: "roll", cn: char.name, cIdx, text: `${t.lg.rolled} ${lr.sn}(${lr.sv}): `, roll: { ...roll, level }, suffix: ` \u2014 ${LS[level].i} ${t.lv[level]} ${t.lg.push}` });
      return;
    }

    // .rc <skill_or_number> [b<n>|p<n>]
    const rm = raw.match(/^\.rc\s+(.+?)(?:\s+([bp])(\d+))?$/i);
    if (rm && char) {
      const target = rm[1].trim();
      const bpType = rm[2]?.toLowerCase();
      const bpN = rm[3] ? Math.min(3, parseInt(rm[3], 10)) : 0;
      const bp = bpType === "b" ? bpN : bpType === "p" ? -bpN : 0;

      let skillVal, skillName;
      if (/^\d+$/.test(target)) {
        skillVal = Math.max(1, Math.min(100, parseInt(target, 10)));
        skillName = lang === "zh" ? "\u81EA\u5B9A\u4E49" : "Custom";
      } else {
        const key = Object.keys(char.skills).find(k => k.toLowerCase() === target.toLowerCase());
        if (key) {
          skillVal = char.skills[key];
          skillName = key;
        } else {
          const attrDef = ATTRS.find(a => a.key.toLowerCase() === target.toLowerCase() || a.en.toLowerCase() === target.toLowerCase() || a.zh === target);
          if (attrDef && char.attrs) {
            skillVal = char.attrs[attrDef.key];
            skillName = lang === "zh" ? attrDef.zh : attrDef.en;
          } else {
            addLog({ type: "err", cn: char.name, text: `${t.lg.noSkill}: "${target}"`, cIdx }); return;
          }
        }
      }

      const roll = resolveRoll(bp);
      const level = getLevel(roll.result, skillVal);
      setLastRolls(prev => ({ ...prev, [char.id]: { sv: skillVal, sn: skillName, bp, level, pushed: false } }));

      const hard = Math.floor(skillVal / 2);
      const ext = Math.floor(skillVal / 5);
      const thresholds = `[${skillVal}/${hard}/${ext}]`;
      const bpLabel = bp > 0 ? ` B\u00D7${bp}` : bp < 0 ? ` P\u00D7${Math.abs(bp)}` : "";

      addLog({
        type: "roll", cn: char.name, cIdx,
        text: `${t.lg.rolled} ${skillName}${thresholds}${bpLabel}: `,
        roll: { ...roll, level },
        suffix: ` \u2014 ${LS[level].i} ${t.lv[level]}`,
      });
      return;
    }

    // IC message
    if (char) addLog({ type: "ic", cn: char.name, text: raw, cIdx });
    else addLog({ type: "ooc", cn: senderName || null, text: raw });
  }

  // Process remote commands from players (KP side) — uses functional state access
  function processCommandFromRemote(text, char, charIdx, playerName, curChars, curLog, curRolls, fromPeerId) {
    processCommand(text, char, charIdx, playerName, fromPeerId);
  }

  // ── Form handler (with multiplayer routing) ──
  function handleSubmit(e) {
    e.preventDefault();
    const raw = logIn.trim();
    if (!raw) return;
    setLogIn("");

    // ── Player mode ──
    if (mp.mode === "player") {
      // Local-only commands
      if (raw.toLowerCase() === ".help") { addLog({ type: "help", text: t.help.title + "\n" + t.help.lines.join("\n") }); return; }
      if (raw.toLowerCase() === ".leave") { mp.leave(); return; }
      // Locked?
      if (mp.locked) { addLog({ type: "err", text: t.lg.inputLocked }); return; }
      // Everything else goes to KP
      mp.sendCommand(raw, activeId, displayName || active?.name || "Player");
      // Show locally as pending IC for non-commands
      if (!raw.startsWith(".")) {
        if (raw.startsWith("(")) addLog({ type: "ooc", cn: active?.name || displayName, text: raw, cIdx: aIdx });
        else if (active) addLog({ type: "ic", cn: active.name, text: raw, cIdx: aIdx });
      }
      return;
    }

    // ── Offline / Host mode ──
    // Connection commands
    const hostM = raw.match(/^\.host(?:\s+(.+))?$/i);
    if (hostM) {
      const name = (hostM[1] || "").trim() || (lang === "zh" ? "\u5B88\u5BC6\u4EBA" : "Keeper");
      setDisplayName(name);
      mp.host(name);
      return;
    }
    const joinM = raw.match(/^\.join\s+(\S+)(?:\s+(.+))?$/i);
    if (joinM) {
      const code = joinM[1];
      const name = (joinM[2] || "").trim() || (lang === "zh" ? "\u73A9\u5BB6" : "Player");
      setDisplayName(name);
      mp.join(code, name);
      return;
    }
    if (raw.toLowerCase() === ".leave") {
      if (mp.mode !== "offline") mp.leave();
      return;
    }

    // KP-only commands (host mode only)
    if (mp.mode === "host") {
      // .scene <text>
      const sceneM = raw.match(/^\.scene\s+(.+)$/i);
      if (sceneM) {
        mp.setScene(sceneM[1]);
        addLog({ type: "scene", text: sceneM[1] });
        return;
      }

      // .npc <name> [hp]
      const npcM = raw.match(/^\.npc\s+(\S+)(?:\s+(\d+))?$/i);
      if (npcM) {
        const npcName = npcM[1];
        const npcHp = npcM[2] ? parseInt(npcM[2], 10) : 10;
        const id = uid();
        setChars(p => [...p, { id, name: npcName, hp: npcHp, hpMax: npcHp, san: 50, sanMax: 99, skills: { ...defaultSkills(lang) }, attrs: null, ownerId: "kp" }]);
        addLog({ type: "connect", text: t.lg.npcCreated.replace("{name}", npcName) });
        return;
      }

      // .secret <skill> [b<n>|p<n>]
      const secM = raw.match(/^\.secret\s+(.+?)(?:\s+([bp])(\d+))?$/i);
      if (secM && active) {
        const target = secM[1].trim();
        const bpType = secM[2]?.toLowerCase();
        const bpN = secM[3] ? Math.min(3, parseInt(secM[3], 10)) : 0;
        const bp = bpType === "b" ? bpN : bpType === "p" ? -bpN : 0;

        let skillVal, skillName;
        if (/^\d+$/.test(target)) {
          skillVal = Math.max(1, Math.min(100, parseInt(target, 10)));
          skillName = lang === "zh" ? "\u81EA\u5B9A\u4E49" : "Custom";
        } else {
          const key = Object.keys(active.skills).find(k => k.toLowerCase() === target.toLowerCase());
          if (key) { skillVal = active.skills[key]; skillName = key; }
          else {
            const attrDef = ATTRS.find(a => a.key.toLowerCase() === target.toLowerCase() || a.en.toLowerCase() === target.toLowerCase() || a.zh === target);
            if (attrDef && active.attrs) { skillVal = active.attrs[attrDef.key]; skillName = lang === "zh" ? attrDef.zh : attrDef.en; }
            else { addLog({ type: "err", cn: active.name, text: `${t.lg.noSkill}: "${target}"`, cIdx: aIdx }); return; }
          }
        }
        const roll = resolveRoll(bp);
        const level = getLevel(roll.result, skillVal);
        const hard = Math.floor(skillVal / 2);
        const ext = Math.floor(skillVal / 5);
        const thresholds = `[${skillVal}/${hard}/${ext}]`;
        const bpLabel = bp > 0 ? ` B\u00D7${bp}` : bp < 0 ? ` P\u00D7${Math.abs(bp)}` : "";
        addLog({
          type: "secret", cn: active.name, cIdx: aIdx,
          text: `${t.lg.secretRoll} ${t.lg.rolled} ${skillName}${thresholds}${bpLabel}: `,
          roll: { ...roll, level },
          suffix: ` \u2014 ${LS[level].i} ${t.lv[level]}`,
        });
        return;
      }

      // .lock / .unlock
      if (raw.toLowerCase() === ".lock") {
        mp.setLocked(true);
        addLog({ type: "lock", text: t.lg.locked });
        return;
      }
      if (raw.toLowerCase() === ".unlock") {
        mp.setLocked(false);
        addLog({ type: "lock", text: t.lg.unlocked });
        return;
      }

      // .adj <charName> hp/san ±N
      const adjM = raw.match(/^\.adj\s+(\S+)\s+(hp|san)\s+([+-]?\d+)$/i);
      if (adjM) {
        const targetName = adjM[1];
        const stat = adjM[2].toLowerCase();
        const delta = parseInt(adjM[3], 10);
        const tc = chars.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (!tc) { addLog({ type: "err", text: t.lg.charNotFound.replace("{name}", targetName) }); return; }
        adjStat(tc.id, stat, delta);
        return;
      }
    }

    // Fall through to processCommand (offline + host)
    processCommand(raw, active, aIdx, displayName || active?.name);
  }

  function exportLog() {
    const text = log.map(e => {
      const p = `[${e.time}]${e.cn ? " " + e.cn + ":" : ""} `;
      if (e.type === "roll" || e.type === "secret") return p + e.text + e.roll.result + e.suffix;
      if (e.type === "gen") return `[${e.time}] ${t.lg.gen} (${t.lg.genTotal}: ${e.total})\n` + e.sets.map((s, i) => `  ${t.lg.genSet} ${i + 1}: ${ATTRS.map(a => `${a.key}=${s[a.key]}`).join(" ")}`).join("\n");
      if (e.type === "pick") return `${p}${t.lg.genPick} #${e.idx}: ${ATTRS.map(a => `${a.key}=${e.attrs[a.key]}`).join(" ")}`;
      if (e.type === "scene") return `[${e.time}] [${t.lg.sceneLabel}] ${e.text}`;
      if (e.type === "connect") return `[${e.time}] ${e.text}`;
      if (e.type === "lock") return `[${e.time}] ${e.text}`;
      return p + e.text;
    }).join("\n");
    const b = new Blob([text], { type: "text/plain" });
    const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u;
    a.download = `coc7e-session-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(u);
  }

  // Helper: can current user edit this character?
  function canEdit(c) {
    if (mp.mode === "offline" || mp.mode === "host") return true;
    return c.ownerId === mp.myPeerId;
  }

  // Helpers for NPC/player chars
  const playerChars = chars.filter(c => c.ownerId !== "kp");
  const npcChars = chars.filter(c => c.ownerId === "kp");

  /* ═══════════ RENDER ═══════════ */
  const kpBadge = (c) => c.ownerId === "kp" ? (
    <span style={{ fontSize: 9, marginLeft: 4, padding: "1px 5px", borderRadius: 3, background: "rgba(201,168,76,0.15)", border: `1px solid ${P.acd}44`, color: P.ac, fontFamily: "'Cinzel',serif", fontWeight: 600, verticalAlign: "middle" }}>{t.lg.kpBadge}</span>
  ) : null;

  const charBadgeInPicker = (c) => {
    if (c.ownerId === "kp") return <span style={{ fontSize: 8, color: P.ac, marginLeft: 3 }}>{t.lg.npcBadge}</span>;
    if (mp.mode === "host" && c.ownerId && c.ownerId !== "kp") {
      const pl = mp.players.get(c.ownerId);
      if (pl) return <span style={{ fontSize: 8, color: P.td, marginLeft: 3 }}>{pl.name}</span>;
    }
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.t, fontFamily: "'Crimson Text',serif", fontSize: 15, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${P.bg}}::-webkit-scrollbar-thumb{background:${P.b};border-radius:3px}
        input:focus,textarea:focus{border-color:${P.acd}!important}
        button:hover{filter:brightness(1.15)}button:active{transform:scale(.97)}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${P.b}`, background: "linear-gradient(180deg,#131311,#0d0d0b)", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 17, fontWeight: 700, color: P.ac, letterSpacing: ".06em" }}>{t.title}</h1>
          <div style={{ fontSize: 11, color: P.td, fontStyle: "italic" }}>{t.subtitle}</div>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "zh" : "en")} style={{ ...bt, padding: "4px 12px", fontSize: 12 }}>{t.langSwitch}</button>
      </header>

      {/* TABS */}
      <nav style={{ display: "flex", borderBottom: `1px solid ${P.b}`, background: P.s1, flexShrink: 0 }}>
        {["chars", "session"].map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: "9px 0", background: tab === k ? P.s2 : "transparent",
            border: "none", borderBottom: tab === k ? `2px solid ${P.ac}` : "2px solid transparent",
            color: tab === k ? P.ac : P.td, fontFamily: "'Cinzel',serif", fontSize: 12, cursor: "pointer", letterSpacing: ".07em",
          }}>
            {t.tabs[k]}
            {k === "session" && log.length > 0 && <span style={{ marginLeft: 5, fontSize: 9, color: P.td, background: P.s1, padding: "1px 5px", borderRadius: 8, border: `1px solid ${P.b}` }}>{log.length}</span>}
          </button>
        ))}
      </nav>

      {/* CONNECTION BAR */}
      {mp.mode !== "offline" && (
        <div style={{ padding: "6px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "linear-gradient(90deg,#121210,#161614)", borderBottom: `1px solid ${P.b}`, flexShrink: 0, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: (mp.mode === "host" || mp.connected) ? P.g : P.r, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: P.ac }}>
            {mp.mode === "host" ? t.connBar.hosting : t.connBar.connected}
          </span>
          {mp.roomCode && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: P.td, fontSize: 10 }}>{t.connBar.roomCode}:</span>
              <span style={{ fontFamily: "monospace", fontSize: 13, color: P.tb, padding: "1px 6px", borderRadius: 3, background: P.s2, border: `1px solid ${P.b}`, cursor: "pointer", userSelect: "all" }}
                onClick={() => { navigator.clipboard.writeText(mp.roomCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }); }}>
                {mp.roomCode}
              </span>
              <span style={{ fontSize: 10, color: codeCopied ? P.g : P.td, cursor: "pointer" }}
                onClick={() => { navigator.clipboard.writeText(mp.roomCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }); }}>
                {codeCopied ? t.lg.copied : t.lg.copyCode}
              </span>
            </span>
          )}
          {mp.mode === "host" && mp.players.size > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: P.td, fontSize: 10 }}>{t.connBar.players}:</span>
              {[...mp.players.entries()].map(([pid, info]) => (
                <span key={pid} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: P.t }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: P.g }} />
                  {info.name}
                </span>
              ))}
            </span>
          )}
          <button onClick={() => mp.leave()} style={{ ...bt, padding: "2px 8px", fontSize: 10, color: P.r, marginLeft: "auto" }}>
            {lang === "zh" ? "\u79BB\u5F00" : "Leave"}
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ════════ CHARACTERS ════════ */}
        {tab === "chars" && (
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {chars.length === 0 && editing === null && <div style={{ textAlign: "center", color: P.td, padding: 36, fontStyle: "italic" }}>{t.cp.none}</div>}

            {/* Player characters */}
            {playerChars.map((c) => {
              const ci = chars.indexOf(c);
              if (editing === c.id) return null;
              return (
              <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                padding: 14, marginBottom: 10, borderRadius: 8,
                background: activeId === c.id ? "linear-gradient(135deg,#191914,#1d1b13)" : P.s1,
                border: `1px solid ${activeId === c.id ? cc(ci) + "66" : P.b}`, cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 15, color: cc(ci) }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cc(ci), marginRight: 8, verticalAlign: "middle" }} />
                    {c.name}
                    {activeId === c.id && <span style={{ fontSize: 10, marginLeft: 8, color: P.td, fontWeight: 400 }}>▸ active</span>}
                  </span>
                  {canEdit(c) && (
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={e => { e.stopPropagation(); startEdit(c); }} style={{ ...bt, padding: "2px 9px", fontSize: 11 }}>{t.cp.edit}</button>
                      <button onClick={e => { e.stopPropagation(); delChar(c.id); }} style={{ ...bt, padding: "2px 9px", fontSize: 11, color: P.r }}>{t.cp.del}</button>
                    </div>
                  )}
                </div>
                <Bar label="HP" cur={c.hp} max={c.hpMax} color={P.r} onAdj={d => adjStat(c.id, "hp", d)} />
                <Bar label="SAN" cur={c.san} max={c.sanMax} color={P.bl2} onAdj={d => adjStat(c.id, "san", d)} />
                {c.attrs && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7, marginBottom: 4 }}>
                    {ATTRS.map(a => (
                      <span key={a.key} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "rgba(201,168,76,0.08)", border: `1px solid ${P.acd}33`, color: P.td }}>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10 }}>{lang === "zh" ? a.zh : a.en}</span>{" "}
                        <span style={{ color: P.ac }}>{c.attrs[a.key]}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
                  {Object.entries(c.skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => (
                    <span key={n} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: P.s2, border: `1px solid ${P.b}`, color: P.td }}>
                      {n} <span style={{ color: P.tb }}>{v}</span>
                    </span>
                  ))}
                  {Object.keys(c.skills).filter(k => c.skills[k] > 0).length > 10 && <span style={{ fontSize: 11, color: P.td }}>+{Object.keys(c.skills).filter(k => c.skills[k] > 0).length - 10}</span>}
                </div>
              </div>
              );
            })}

            {/* NPC Section (host only) */}
            {mp.mode === "host" && npcChars.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 8px", padding: "0 4px" }}>
                  <div style={{ flex: 1, height: 1, background: P.b }} />
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: P.ac, letterSpacing: ".05em" }}>{t.lg.npcBadge}s</span>
                  <div style={{ flex: 1, height: 1, background: P.b }} />
                </div>
                {npcChars.map((c) => {
                  const ci = chars.indexOf(c);
                  if (editing === c.id) return null;
                  return (
                  <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                    padding: 14, marginBottom: 10, borderRadius: 8,
                    background: activeId === c.id ? "linear-gradient(135deg,#191914,#1d1b13)" : P.s1,
                    border: `1px solid ${activeId === c.id ? cc(ci) + "66" : P.b}`, cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 15, color: cc(ci) }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cc(ci), marginRight: 8, verticalAlign: "middle" }} />
                        {c.name}
                        {kpBadge(c)}
                        {activeId === c.id && <span style={{ fontSize: 10, marginLeft: 8, color: P.td, fontWeight: 400 }}>▸ active</span>}
                      </span>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={e => { e.stopPropagation(); startEdit(c); }} style={{ ...bt, padding: "2px 9px", fontSize: 11 }}>{t.cp.edit}</button>
                        <button onClick={e => { e.stopPropagation(); delChar(c.id); }} style={{ ...bt, padding: "2px 9px", fontSize: 11, color: P.r }}>{t.cp.del}</button>
                      </div>
                    </div>
                    <Bar label="HP" cur={c.hp} max={c.hpMax} color={P.r} onAdj={d => adjStat(c.id, "hp", d)} />
                    <Bar label="SAN" cur={c.san} max={c.sanMax} color={P.bl2} onAdj={d => adjStat(c.id, "san", d)} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
                      {Object.entries(c.skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => (
                        <span key={n} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: P.s2, border: `1px solid ${P.b}`, color: P.td }}>
                          {n} <span style={{ color: P.tb }}>{v}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </>
            )}

            {editing !== null && (
              <div style={{ padding: 16, borderRadius: 8, background: P.s1, border: `1px solid ${P.acd}`, marginBottom: 10 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif" }}>{t.cp.name}</label>
                  <input value={fn} onChange={e => setFn(e.target.value)} style={inp} placeholder="Harvey Walters" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif" }}>{t.cp.hp} (cur / {t.cp.max})</label>
                    <div style={{ display: "flex", gap: 5 }}>
                      <input type="number" value={fhp} onChange={e => setFhp(Math.max(0, +e.target.value))} style={{ ...inp, width: "50%" }} />
                      <input type="number" value={fhpM} onChange={e => setFhpM(Math.max(1, +e.target.value))} style={{ ...inp, width: "50%" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif" }}>{t.cp.san} (cur / {t.cp.max})</label>
                    <div style={{ display: "flex", gap: 5 }}>
                      <input type="number" value={fsan} onChange={e => setFsan(Math.max(0, +e.target.value))} style={{ ...inp, width: "50%" }} />
                      <input type="number" value={fsanM} onChange={e => setFsanM(Math.max(1, +e.target.value))} style={{ ...inp, width: "50%" }} />
                    </div>
                  </div>
                </div>
                {fAttrs && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif" }}>{t.lg.attrs}</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 5 }}>
                      {ATTRS.map(a => (
                        <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif", minWidth: 28 }}>{lang === "zh" ? a.zh : a.en}</span>
                          <input type="number" value={fAttrs[a.key]} min={a.min} max={a.max} step={5}
                            onChange={e => {
                              const v = Math.max(a.min, Math.min(a.max, +e.target.value));
                              setFAttrs(p => {
                                const next = { ...p, [a.key]: v };
                                if (a.key === "CON" || a.key === "SIZ") {
                                  const con = a.key === "CON" ? v : p.CON;
                                  const siz = a.key === "SIZ" ? v : p.SIZ;
                                  const newHp = Math.floor((con + siz) / 10);
                                  setFhp(newHp); setFhpM(newHp);
                                }
                                if (a.key === "POW") { setFsan(v); }
                                return next;
                              });
                            }}
                            style={{ ...inp, flex: 1, textAlign: "center", padding: "2px 3px" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif" }}>{t.cp.skills}</label>
                <div style={{ maxHeight: 180, overflow: "auto", marginTop: 5, display: "flex", flexDirection: "column", gap: 2 }}>
                  {Object.entries(fsk).map(([n, v]) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ flex: 1, fontSize: 13, color: P.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n}</span>
                      <input type="number" value={v} min={0} max={99}
                        onChange={e => setFsk(p => ({ ...p, [n]: Math.max(0, Math.min(99, +e.target.value)) }))}
                        style={{ ...inp, width: 52, textAlign: "center", padding: "2px 3px" }} />
                      <button onClick={() => setFsk(p => { const x = { ...p }; delete x[n]; return x; })}
                        style={{ background: "none", border: "none", color: P.r, cursor: "pointer", fontSize: 13 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 5, marginTop: 7, alignItems: "center" }}>
                  <input value={nsn} onChange={e => setNsn(e.target.value)} placeholder={lang === "zh" ? "\u6280\u80FD\u540D" : "Skill"} style={{ ...inp, flex: 1 }} />
                  <input type="number" value={nsv} onChange={e => setNsv(+e.target.value)} style={{ ...inp, width: 52, textAlign: "center" }} />
                  <button onClick={() => { if (nsn.trim()) { setFsk(p => ({ ...p, [nsn.trim()]: Math.max(0, Math.min(99, nsv)) })); setNsn(""); setNsv(10); } }}
                    style={{ ...bt, padding: "5px 9px", fontSize: 11, color: P.g, whiteSpace: "nowrap" }}>{t.cp.addSkill}</button>
                </div>
                <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
                  <button onClick={saveChar} style={{ ...abt, flex: 1 }}>{t.cp.save}</button>
                  <button onClick={() => setEditing(null)} style={{ ...bt, flex: 1 }}>{t.cp.cancel}</button>
                </div>
              </div>
            )}
            {editing === null && (mp.mode !== "player") && <button onClick={startNew} style={{ ...abt, width: "100%", marginTop: 6, padding: "10px 0" }}>{t.cp.add}</button>}
          </div>
        )}

        {/* ════════ SESSION ════════ */}
        {tab === "session" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Character picker */}
            {chars.length > 0 && (
              <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", background: P.s1, borderBottom: `1px solid ${P.b}`, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif", marginRight: 2 }}>{t.sp.pickChar}:</span>
                {chars.map((c, ci) => (
                  <button key={c.id} onClick={() => { setActiveId(c.id); inputRef.current?.focus(); }}
                    style={{
                      ...bt, padding: "3px 9px", fontSize: 11,
                      background: activeId === c.id ? `${cc(ci)}15` : P.s2,
                      border: `1px solid ${activeId === c.id ? cc(ci) + "55" : P.b}`,
                      color: activeId === c.id ? cc(ci) : P.t,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cc(ci), flexShrink: 0 }} />
                    {c.name}
                    {charBadgeInPicker(c)}
                    <span style={{ fontSize: 9, color: P.td }}>{c.hp}/{c.hpMax}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Scene display */}
            {mp.scene && (
              <div style={{ padding: "8px 16px", background: "rgba(201,168,76,0.04)", borderBottom: `1px solid ${P.b}`, borderLeft: `3px solid ${P.ac}`, flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: P.ac, fontFamily: "'Cinzel',serif", fontWeight: 600, marginBottom: 2 }}>{t.lg.sceneLabel}</div>
                <div style={{ fontSize: 13, color: P.tb, fontStyle: "italic" }}>{mp.scene}</div>
              </div>
            )}

            {/* Active stat strip */}
            {active && (
              <div style={{ padding: "5px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: P.s2, borderBottom: `1px solid ${P.b}`, flexShrink: 0, fontSize: 13 }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, color: cc(aIdx), fontSize: 13 }}>
                  {active.name}
                  {kpBadge(active)}
                </span>
                {[["hp", "HP", P.r], ["san", "SAN", P.bl2]].map(([k, l, c]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ color: c, fontFamily: "'Cinzel',serif", fontSize: 10 }}>{l}</span>
                    <button onClick={() => adjStat(active.id, k, -1)} style={{ background: "none", border: "none", color: P.r, cursor: "pointer", fontSize: 13, padding: "0 2px" }}>−</button>
                    <span style={{ color: P.tb, minWidth: 32, textAlign: "center" }}>{active[k]}/{active[k + "Max"]}</span>
                    <button onClick={() => adjStat(active.id, k, 1)} style={{ background: "none", border: "none", color: P.g, cursor: "pointer", fontSize: 13, padding: "0 2px" }}>+</button>
                  </div>
                ))}
              </div>
            )}

            {/* Log */}
            <div style={{ flex: 1, overflow: "auto", padding: "10px 16px" }}>
              {chars.length === 0 && mp.mode === "offline" && <div style={{ textAlign: "center", color: P.td, padding: 36, fontStyle: "italic" }}>{t.sp.noChars}</div>}
              {chars.length > 0 && log.length === 0 && <div style={{ textAlign: "center", color: P.td, padding: 36, fontStyle: "italic" }}>{t.sp.empty}</div>}
              {log.map(e => {
                const ci = e.cIdx ?? -1;
                const nc = ci >= 0 ? cc(ci) : P.td;
                const eChar = e.cn ? chars.find(c => c.name === e.cn) : null;

                if (e.type === "help") return (
                  <div key={e.id} style={{ padding: "8px 10px", marginBottom: 4, borderRadius: 6, background: "rgba(201,168,76,0.06)", border: `1px solid ${P.acd}22`, fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap", color: P.td, lineHeight: 1.6 }}>{e.text}</div>
                );
                if (e.type === "err") return (
                  <div key={e.id} style={{ padding: "4px 10px", marginBottom: 2, fontSize: 12, color: P.r, fontStyle: "italic" }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>⚠ {e.cn && <span style={{ color: nc, fontFamily: "'Cinzel',serif", fontWeight: 600, fontSize: 11, marginRight: 4 }}>{e.cn}</span>}{e.text}
                  </div>
                );
                if (e.type === "scene") return (
                  <div key={e.id} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 6, background: "rgba(201,168,76,0.04)", borderLeft: `3px solid ${P.ac}`, fontSize: 13 }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                    <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: P.ac, fontSize: 11, marginRight: 6 }}>{t.lg.sceneLabel}</span>
                    <span style={{ color: P.tb, fontStyle: "italic" }}>{e.text}</span>
                  </div>
                );
                if (e.type === "secret") {
                  const ls = LS[e.roll.level];
                  return (
                    <div key={e.id} style={{ padding: "6px 10px", marginBottom: 3, borderRadius: 6, background: ls.bg, borderLeft: `3px solid ${ls.c}55`, fontSize: 13, opacity: 0.8 }}>
                      <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(200,58,58,0.15)", border: "1px solid rgba(200,58,58,0.3)", color: P.r, fontFamily: "'Cinzel',serif", fontWeight: 600, marginRight: 5 }}>SECRET</span>
                      <span style={{ marginRight: 3 }}>🎲</span>
                      <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: nc, marginRight: 5, fontSize: 12 }}>{e.cn}</span>
                      <span style={{ color: P.t }}>{e.text}</span>
                      <DiceInline tens={e.roll.tens} chosen={e.roll.chosen} units={e.roll.units} />
                      <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 16, color: ls.c, marginLeft: 2 }}>{e.roll.result}</span>
                      <span style={{ color: ls.c, fontWeight: 600 }}>{e.suffix}</span>
                    </div>
                  );
                }
                if (e.type === "connect") return (
                  <div key={e.id} style={{ padding: "4px 10px", marginBottom: 2, borderRadius: 5, borderLeft: `3px solid ${P.bl2}33`, fontSize: 12, fontStyle: "italic", color: P.td }}>
                    <span style={{ fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                    <span style={{ marginRight: 3 }}>🔗</span>
                    {e.text}
                  </div>
                );
                if (e.type === "lock") return (
                  <div key={e.id} style={{ padding: "4px 10px", marginBottom: 2, borderRadius: 5, borderLeft: `3px solid ${P.r}33`, fontSize: 12, fontStyle: "italic", color: P.r }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                    <span style={{ marginRight: 3 }}>🔒</span>
                    {e.text}
                  </div>
                );
                if (e.type === "gen") return (
                  <div key={e.id} style={{ padding: "10px 12px", marginBottom: 4, borderRadius: 6, background: "rgba(201,168,76,0.06)", border: `1px solid ${P.acd}22` }}>
                    <div style={{ fontSize: 12, color: P.ac, fontFamily: "'Cinzel',serif", fontWeight: 600, marginBottom: 6 }}>
                      <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                      🎲 {t.lg.gen} ({t.lg.genTotal}: {e.total})
                    </div>
                    {e.sets.map((s, si) => (
                      <div key={si} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, padding: "3px 6px", borderRadius: 4, background: si % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, color: P.ac, minWidth: 18 }}>{si + 1}.</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {ATTRS.map(a => (
                            <span key={a.key} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 3, background: P.s2, border: `1px solid ${P.b}`, color: P.td }}>
                              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10 }}>{lang === "zh" ? a.zh : a.en}</span>{" "}
                              <span style={{ color: P.tb }}>{s[a.key]}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: P.td, fontStyle: "italic", marginTop: 5 }}>{t.lg.genPick}: .pick &lt;1-5&gt; [name]</div>
                  </div>
                );
                if (e.type === "pick") return (
                  <div key={e.id} style={{ padding: "6px 10px", marginBottom: 3, borderRadius: 6, background: "rgba(90,186,122,0.06)", borderLeft: `3px solid ${P.g}55`, fontSize: 13 }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                    <span style={{ marginRight: 3 }}>✦</span>
                    <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: P.g, marginRight: 5, fontSize: 12 }}>{e.cn}</span>
                    <span style={{ color: P.t }}>← {t.lg.genSet} #{e.idx}</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {ATTRS.map(a => (
                        <span key={a.key} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 3, background: "rgba(201,168,76,0.08)", border: `1px solid ${P.acd}33`, color: P.td }}>
                          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10 }}>{lang === "zh" ? a.zh : a.en}</span>{" "}
                          <span style={{ color: P.ac }}>{e.attrs[a.key]}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
                if (e.type === "roll") {
                  const ls = LS[e.roll.level];
                  return (
                    <div key={e.id} style={{ padding: "6px 10px", marginBottom: 3, borderRadius: 6, background: ls.bg, borderLeft: `3px solid ${ls.c}55`, fontSize: 13 }}>
                      <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                      <span style={{ marginRight: 3 }}>🎲</span>
                      <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: nc, marginRight: 5, fontSize: 12 }}>
                        {e.cn}
                        {eChar && kpBadge(eChar)}
                      </span>
                      <span style={{ color: P.t }}>{e.text}</span>
                      <DiceInline tens={e.roll.tens} chosen={e.roll.chosen} units={e.roll.units} />
                      <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 16, color: ls.c, marginLeft: 2 }}>{e.roll.result}</span>
                      <span style={{ color: ls.c, fontWeight: 600 }}>{e.suffix}</span>
                    </div>
                  );
                }
                if (e.type === "ic") return (
                  <div key={e.id} style={{ padding: "5px 10px", marginBottom: 2, borderRadius: 5, borderLeft: `3px solid ${nc}33`, fontSize: 14 }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                    <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: nc, marginRight: 6, fontSize: 13 }}>
                      {e.cn}
                      {eChar && kpBadge(eChar)}
                    </span>
                    <span style={{ color: P.tb }}>{e.text}</span>
                  </div>
                );
                if (e.type === "ooc") return (
                  <div key={e.id} style={{ padding: "4px 10px", marginBottom: 2, borderRadius: 5, borderLeft: `3px solid ${P.td}33`, fontSize: 13, fontStyle: "italic" }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>💬
                    {e.cn && <span style={{ color: P.td, fontFamily: "'Cinzel',serif", fontWeight: 600, fontSize: 11, marginRight: 4, marginLeft: 3 }}>{e.cn}</span>}
                    <span style={{ color: P.td }}>{e.text}</span>
                  </div>
                );
                let icon = "⚙️";
                if (e.type === "hp") icon = "❤️";
                else if (e.type === "san") icon = "🧠";
                else if (e.type === "skill") icon = "📖";
                return (
                  <div key={e.id} style={{ padding: "4px 10px", marginBottom: 2, borderRadius: 5, borderLeft: `3px solid ${P.b}`, fontSize: 12, color: P.td }}>
                    <span style={{ fontSize: 10, marginRight: 5 }}>[{e.time}]</span>{icon}
                    {e.cn && <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: nc, marginRight: 4, fontSize: 11, marginLeft: 3 }}>{e.cn}</span>}
                    {e.text}
                  </div>
                );
              })}
              <div ref={logEnd} />
            </div>

            {/* Input */}
            <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${P.b}`, background: P.s1, flexShrink: 0, position: "relative" }}>
              {/* Lock overlay */}
              {mp.mode === "player" && mp.locked && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 10,
                  background: "rgba(13,13,11,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>🔒</span>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: P.r }}>{t.lg.inputLocked}</span>
                </div>
              )}
              {log.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 6 }}>
                  <button onClick={exportLog} style={{ ...bt, padding: "2px 8px", fontSize: 10 }}>{t.sp.export}</button>
                  <button onClick={() => { if (window.confirm(t.sp.clearConfirm)) setLog([]); }} style={{ ...bt, padding: "2px 8px", fontSize: 10, color: P.r }}>{t.sp.clear}</button>
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: 6 }}>
                {active && (
                  <span style={{ display: "flex", alignItems: "center", padding: "0 8px", fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, color: cc(aIdx), whiteSpace: "nowrap" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: cc(aIdx), marginRight: 5 }} />
                    {active.name}
                  </span>
                )}
                <input ref={inputRef} value={logIn} onChange={e => setLogIn(e.target.value)} placeholder={t.sp.inputPh}
                  style={{ ...inp, flex: 1, fontSize: 14, borderRadius: 8 }} />
                <button type="submit" style={{ ...abt, padding: "6px 14px", borderRadius: 8 }}>↵</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
