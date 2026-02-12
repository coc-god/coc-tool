import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════ i18n ═══════════ */
const T = {
  en: {
    title: "Call of Cthulhu 7e", subtitle: "Session Manager",
    langSwitch: "中文",
    tabs: { chars: "Characters", dice: "Dice", log: "Log" },
    cp: {
      add: "+ New Investigator", none: "No investigators yet.",
      name: "Name", hp: "HP", san: "SAN", skills: "Skills",
      addSkill: "+ Skill", save: "Save", cancel: "Cancel",
      del: "Delete", edit: "Edit", confirmDel: "Remove this investigator?",
      max: "max",
    },
    dp: {
      pickChar: "Select an investigator on the Characters tab first.",
      pickSkill: "Choose a skill to roll against",
      custom: "Custom", value: "Target",
      bonus: "Bonus", penalty: "Penalty",
      roll: "Roll d100", push: "Push the Roll",
      pushWarn: "Failure will be catastrophic…",
      newRoll: "New Roll",
    },
    lv: {
      CRITICAL: "Critical!", EXTREME: "Extreme Success",
      HARD: "Hard Success", REGULAR: "Regular Success",
      FAILURE: "Failure", FUMBLE: "Fumble!",
    },
    lp: {
      placeholder: "Type message… ( prefix = OOC",
      empty: "Session log is empty.", export: "Export", clear: "Clear",
      clearConfirm: "Clear all log entries?",
    },
    lg: {
      rolled: "rolled", push: "(Pushed)",
      joined: "joined the session", removed: "left the session",
      a: "→", rolling: "Rolling…",
      regular: "Regular", hard: "Hard", extreme: "Extreme",
    },
  },
  zh: {
    title: "克苏鲁的呼唤 7版", subtitle: "场景管理器",
    langSwitch: "EN",
    tabs: { chars: "角色", dice: "骰子", log: "日志" },
    cp: {
      add: "+ 新调查员", none: "暂无调查员。",
      name: "姓名", hp: "生命值", san: "理智值", skills: "技能",
      addSkill: "+ 技能", save: "保存", cancel: "取消",
      del: "删除", edit: "编辑", confirmDel: "确定移除此调查员？",
      max: "上限",
    },
    dp: {
      pickChar: "请先在角色页选择一名调查员。",
      pickSkill: "选择要检定的技能",
      custom: "自定义", value: "目标值",
      bonus: "奖励骰", penalty: "惩罚骰",
      roll: "掷 d100", push: "孤注一掷",
      pushWarn: "失败将带来灾难性后果……",
      newRoll: "新检定",
    },
    lv: {
      CRITICAL: "大成功！", EXTREME: "极难成功",
      HARD: "困难成功", REGULAR: "成功",
      FAILURE: "失败", FUMBLE: "大失败！",
    },
    lp: {
      placeholder: "输入消息…… ( 开头 = 题外话",
      empty: "日志为空。", export: "导出", clear: "清空",
      clearConfirm: "确定清空所有日志？",
    },
    lg: {
      rolled: "检定", push: "(孤注一掷)",
      joined: "加入了场景", removed: "离开了场景",
      a: "→", rolling: "掷骰中……",
      regular: "常规", hard: "困难", extreme: "极难",
    },
  },
};

/* ═══════════ Default Skills ═══════════ */
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

/* ═══════════ Dice Logic ═══════════ */
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
  CRITICAL: { c: "#d4aa3e", bg: "rgba(212,170,62,0.13)", i: "✦" },
  EXTREME:  { c: "#6aaa5a", bg: "rgba(106,170,90,0.10)", i: "◆" },
  HARD:     { c: "#5a8abb", bg: "rgba(90,138,187,0.10)", i: "◇" },
  REGULAR:  { c: "#9a9a88", bg: "rgba(154,154,136,0.08)", i: "●" },
  FAILURE:  { c: "#8a6a5a", bg: "rgba(138,106,90,0.08)", i: "✕" },
  FUMBLE:   { c: "#c83a3a", bg: "rgba(200,58,58,0.14)", i: "☠" },
};

let _id = Date.now();
function uid() { return String(++_id); }
function now() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

/* ═══════════ Storage (localStorage) ═══════════ */
const STORAGE_KEY = "coc7e-session";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

/* ═══════════ Theme ═══════════ */
const P = {
  bg: "#0d0d0b", s1: "#151513", s2: "#1b1b18",
  b: "#292924", bl: "#3a3a32",
  t: "#c8bfa0", td: "#706b5c", tb: "#e0d8c0",
  ac: "#c9a84c", acd: "#8a7a3a",
  r: "#a84040", g: "#5a8a50", bl2: "#5a7a9a",
};

const inp = {
  background: P.s1, border: `1px solid ${P.b}`, borderRadius: 6,
  color: P.t, padding: "6px 10px", fontFamily: "'Crimson Text',serif",
  fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
};
const btn = {
  background: P.s2, border: `1px solid ${P.b}`, borderRadius: 6,
  color: P.t, padding: "7px 14px", fontFamily: "'Cinzel',serif",
  fontSize: 13, cursor: "pointer", transition: "all 0.15s",
  letterSpacing: "0.03em",
};
const abtn = {
  ...btn, background: "linear-gradient(145deg,#2a2518,#1e1a10)",
  border: `1px solid ${P.acd}`, color: P.ac,
};

/* ═══════════ Sub-components ═══════════ */
function Die({ value, isTens, chosen, size = 56 }) {
  const txt = isTens ? (value === 0 ? "00" : String(value * 10)) : String(value);
  const on = chosen === undefined || chosen === true;
  return (
    <div style={{
      width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
      background: on ? "linear-gradient(145deg,#1d1d1a,#27271f)" : "#131311",
      border: `1.5px solid ${chosen === true ? P.acd : chosen === false ? "#222" : P.b}`,
      borderRadius: 8, fontFamily: "'Cinzel',serif", fontSize: size * .36, fontWeight: 700,
      color: on ? P.tb : "#444", opacity: chosen === false ? .4 : 1,
      transition: "all 0.3s", boxShadow: chosen === true ? `0 0 10px rgba(201,168,76,.12)` : "none",
    }}>{txt}</div>
  );
}

function Bar({ label, cur, max, color, onAdj }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: P.td, width: 30, textAlign: "right" }}>{label}</span>
      <button onClick={() => onAdj(-1)} style={{ ...btn, padding: "1px 7px", fontSize: 14, borderRadius: 4, lineHeight: 1 }}>−</button>
      <div style={{ flex: 1, height: 18, background: P.s1, borderRadius: 9, border: `1px solid ${P.b}`, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color}77,${color})`, borderRadius: 9, transition: "width 0.4s" }} />
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Cinzel',serif", color: P.tb, textShadow: "0 1px 3px #000" }}>
          {cur}/{max}
        </span>
      </div>
      <button onClick={() => onAdj(1)} style={{ ...btn, padding: "1px 7px", fontSize: 14, borderRadius: 4, lineHeight: 1 }}>+</button>
    </div>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function App() {
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState("chars");
  const [chars, setChars] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [log, setLog] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Dice
  const [selSkill, setSelSkill] = useState(null);
  const [customVal, setCustomVal] = useState(50);
  const [bp, setBp] = useState(0);
  const [rollRes, setRollRes] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [animDice, setAnimDice] = useState(null);
  const animRef = useRef(null);

  // Char form
  const [editing, setEditing] = useState(null);
  const [fn, setFn] = useState("");
  const [fhp, setFhp] = useState(10); const [fhpM, setFhpM] = useState(10);
  const [fsan, setFsan] = useState(50); const [fsanM, setFsanM] = useState(99);
  const [fsk, setFsk] = useState({});
  const [nsn, setNsn] = useState(""); const [nsv, setNsv] = useState(10);

  const [logIn, setLogIn] = useState("");
  const logEnd = useRef(null);
  const t = T[lang];
  const active = chars.find(c => c.id === activeId) || null;

  // ── Load from localStorage ──
  useEffect(() => {
    const d = loadData();
    if (d) {
      if (d.chars) setChars(d.chars);
      if (d.log) setLog(d.log);
      if (d.activeId) setActiveId(d.activeId);
      if (d.lang) setLang(d.lang);
    }
    setLoaded(true);
  }, []);

  // ── Save (debounced) ──
  useEffect(() => {
    if (!loaded) return;
    const h = setTimeout(() => saveData({ chars, log: log.slice(-500), activeId, lang }), 400);
    return () => clearTimeout(h);
  }, [chars, log, activeId, lang, loaded]);

  // ── Logging ──
  const addLog = useCallback((type, cn, text, detail = null) => {
    setLog(prev => [...prev, { id: uid(), time: now(), type, cn, text, detail }]);
  }, []);
  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  // ── Char ops ──
  function startNew() {
    setEditing("new"); setFn(""); setFhp(10); setFhpM(10); setFsan(50); setFsanM(99);
    setFsk({ ...defaultSkills(lang) });
  }
  function startEdit(c) {
    setEditing(c.id); setFn(c.name); setFhp(c.hp); setFhpM(c.hpMax);
    setFsan(c.san); setFsanM(c.sanMax); setFsk({ ...c.skills });
  }
  function saveChar() {
    if (!fn.trim()) return;
    if (editing === "new") {
      const id = uid();
      setChars(p => [...p, { id, name: fn.trim(), hp: fhp, hpMax: fhpM, san: fsan, sanMax: fsanM, skills: { ...fsk } }]);
      setActiveId(id);
      addLog("sys", fn.trim(), t.lg.joined);
    } else {
      setChars(p => p.map(c => {
        if (c.id !== editing) return c;
        Object.keys(fsk).forEach(sk => {
          if (c.skills[sk] !== undefined && c.skills[sk] !== fsk[sk])
            addLog("skill", c.name, `${sk} ${c.skills[sk]} ${t.lg.a} ${fsk[sk]}`);
        });
        if (c.hp !== fhp || c.hpMax !== fhpM)
          addLog("hp", c.name, `HP ${c.hp}/${c.hpMax} ${t.lg.a} ${fhp}/${fhpM}`);
        if (c.san !== fsan || c.sanMax !== fsanM)
          addLog("san", c.name, `SAN ${c.san}/${c.sanMax} ${t.lg.a} ${fsan}/${fsanM}`);
        return { ...c, name: fn.trim(), hp: fhp, hpMax: fhpM, san: fsan, sanMax: fsanM, skills: { ...fsk } };
      }));
    }
    setEditing(null);
  }
  function delChar(id) {
    if (!window.confirm(t.cp.confirmDel)) return;
    const c = chars.find(x => x.id === id);
    if (c) addLog("sys", c.name, t.lg.removed);
    setChars(p => p.filter(x => x.id !== id));
    if (activeId === id) setActiveId(null);
    setEditing(null);
  }
  function adjStat(cid, stat, d) {
    setChars(p => p.map(c => {
      if (c.id !== cid) return c;
      const nv = Math.max(0, Math.min(c[stat + "Max"], c[stat] + d));
      if (nv !== c[stat])
        addLog(stat === "hp" ? "hp" : "san", c.name, `${stat.toUpperCase()} ${c[stat]} ${t.lg.a} ${nv} (${d > 0 ? "+" : ""}${d})`);
      return { ...c, [stat]: nv };
    }));
  }

  // ── Dice ──
  function doRoll(isPush = false) {
    if (!active || !selSkill) return;
    const sv = selSkill === "__custom__" ? customVal : (active.skills[selSkill] ?? 50);
    const sn = selSkill === "__custom__" ? (lang === "zh" ? "自定义" : "Custom") : selSkill;
    setRolling(true);
    if (isPush) setPushed(true);
    let frame = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      frame++;
      const n = Math.abs(bp);
      const ft = []; for (let i = 0; i <= n; i++) ft.push(rD10());
      setAnimDice({ units: rD10(), tens: ft });
      if (frame >= 14) {
        clearInterval(animRef.current);
        const roll = resolveRoll(bp);
        const level = getLevel(roll.result, sv);
        const res = { ...roll, level, sv, sn, isPush };
        setRollRes(res); setAnimDice(null); setRolling(false);
        const pt = isPush ? ` ${t.lg.push}` : "";
        const levelText = t.lv[level];
        addLog("roll", active.name,
          `${t.lg.rolled} ${sn}(${sv}): ${roll.result} — ${levelText}${pt}`,
          { roll: roll.result, skill: sv, sn, level, isPush, tens: roll.tens, chosen: roll.chosen, units: roll.units, bp });
      }
    }, 50);
  }
  function resetRoll() { setRollRes(null); setPushed(false); setAnimDice(null); }
  const canPush = rollRes && !pushed && rollRes.level === "FAILURE";

  // ── Log input ──
  function handleLogSub(e) {
    e.preventDefault();
    if (!logIn.trim()) return;
    if (logIn.trim().startsWith("(")) addLog("ooc", null, logIn.trim());
    else addLog("msg", active?.name || null, logIn.trim());
    setLogIn("");
  }
  function exportLog() {
    const text = log.map(e => `[${e.time}]${e.cn ? " " + e.cn + ":" : ""} ${e.text}`).join("\n");
    const b = new Blob([text], { type: "text/plain" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u;
    a.download = `coc7e-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(u);
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.t, fontFamily: "'Crimson Text',serif", fontSize: 15 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${P.bg}}
        ::-webkit-scrollbar-thumb{background:${P.b};border-radius:3px}
        input:focus,textarea:focus{border-color:${P.acd}!important}
        button:hover{filter:brightness(1.15)}
        button:active{transform:scale(.97)}
        input[type=number]::-webkit-inner-spin-button{opacity:.3}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{
        padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${P.b}`, background: "linear-gradient(180deg,#131311,#0d0d0b)",
      }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: P.ac, margin: 0, letterSpacing: ".06em" }}>
            {t.title}
          </h1>
          <div style={{ fontSize: 11, color: P.td, fontStyle: "italic" }}>{t.subtitle}</div>
        </div>
        <button onClick={() => setLang(l => l === "en" ? "zh" : "en")} style={{ ...btn, padding: "4px 12px", fontSize: 12 }}>
          {t.langSwitch}
        </button>
      </header>

      {/* ═══ ACTIVE CHAR STRIP ═══ */}
      {active && tab !== "chars" && (
        <div style={{
          padding: "7px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          background: P.s1, borderBottom: `1px solid ${P.b}`, fontSize: 13,
        }}>
          <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, color: P.ac, fontSize: 13 }}>{active.name}</span>
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

      {/* ═══ TABS ═══ */}
      <nav style={{ display: "flex", borderBottom: `1px solid ${P.b}`, background: P.s1 }}>
        {["chars", "dice", "log"].map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: "9px 0", background: tab === k ? P.s2 : "transparent",
            border: "none", borderBottom: tab === k ? `2px solid ${P.ac}` : "2px solid transparent",
            color: tab === k ? P.ac : P.td, fontFamily: "'Cinzel',serif",
            fontSize: 12, cursor: "pointer", letterSpacing: ".07em", transition: "all 0.2s",
          }}>
            {t.tabs[k]}
            {k === "log" && log.length > 0 && (
              <span style={{ marginLeft: 5, fontSize: 9, color: P.td, background: P.s1, padding: "1px 5px", borderRadius: 8, border: `1px solid ${P.b}` }}>
                {log.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: 16, overflow: "auto" }}>

        {/* ════════ CHARACTERS ════════ */}
        {tab === "chars" && (
          <div>
            {chars.length === 0 && editing === null && (
              <div style={{ textAlign: "center", color: P.td, padding: 36, fontStyle: "italic" }}>{t.cp.none}</div>
            )}
            {chars.map(c => editing === c.id ? null : (
              <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                padding: 14, marginBottom: 10, borderRadius: 8,
                background: activeId === c.id ? "linear-gradient(135deg,#191914,#1d1b13)" : P.s1,
                border: `1px solid ${activeId === c.id ? P.acd : P.b}`,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 15, color: activeId === c.id ? P.ac : P.tb }}>
                    {c.name}
                    {activeId === c.id && <span style={{ fontSize: 10, marginLeft: 8, color: P.td, fontWeight: 400 }}>▸ active</span>}
                  </span>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={e => { e.stopPropagation(); startEdit(c); }} style={{ ...btn, padding: "2px 9px", fontSize: 11 }}>{t.cp.edit}</button>
                    <button onClick={e => { e.stopPropagation(); delChar(c.id); }} style={{ ...btn, padding: "2px 9px", fontSize: 11, color: P.r }}>{t.cp.del}</button>
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
                  {Object.keys(c.skills).filter(k => c.skills[k] > 0).length > 10 && (
                    <span style={{ fontSize: 11, color: P.td }}>+{Object.keys(c.skills).filter(k => c.skills[k] > 0).length - 10}</span>
                  )}
                </div>
              </div>
            ))}

            {/* ── Form ── */}
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
                {/* Skills */}
                <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif" }}>{t.cp.skills}</label>
                <div style={{ maxHeight: 180, overflow: "auto", marginTop: 5, display: "flex", flexDirection: "column", gap: 2 }}>
                  {Object.entries(fsk).map(([n, v]) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ flex: 1, fontSize: 13, color: P.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n}</span>
                      <input type="number" value={v} min={0} max={99}
                        onChange={e => setFsk(p => ({ ...p, [n]: Math.max(0, Math.min(99, +e.target.value)) }))}
                        style={{ ...inp, width: 52, textAlign: "center", padding: "2px 3px" }} />
                      <button onClick={() => setFsk(p => { const x = { ...p }; delete x[n]; return x; })}
                        style={{ background: "none", border: "none", color: P.r, cursor: "pointer", fontSize: 13, padding: "0 3px" }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 5, marginTop: 7, alignItems: "center" }}>
                  <input value={nsn} onChange={e => setNsn(e.target.value)} placeholder={lang === "zh" ? "技能名" : "Skill"} style={{ ...inp, flex: 1 }} />
                  <input type="number" value={nsv} onChange={e => setNsv(+e.target.value)} style={{ ...inp, width: 52, textAlign: "center" }} />
                  <button onClick={() => { if (nsn.trim()) { setFsk(p => ({ ...p, [nsn.trim()]: Math.max(0, Math.min(99, nsv)) })); setNsn(""); setNsv(10); } }}
                    style={{ ...btn, padding: "5px 9px", fontSize: 11, color: P.g, whiteSpace: "nowrap" }}>{t.cp.addSkill}</button>
                </div>
                <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
                  <button onClick={saveChar} style={{ ...abtn, flex: 1 }}>{t.cp.save}</button>
                  <button onClick={() => setEditing(null)} style={{ ...btn, flex: 1 }}>{t.cp.cancel}</button>
                </div>
              </div>
            )}
            {editing === null && (
              <button onClick={startNew} style={{ ...abtn, width: "100%", marginTop: 6, padding: "10px 0" }}>{t.cp.add}</button>
            )}
          </div>
        )}

        {/* ════════ DICE ════════ */}
        {tab === "dice" && (
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            {!active ? (
              <div style={{ textAlign: "center", color: P.td, padding: 36, fontStyle: "italic" }}>{t.dp.pickChar}</div>
            ) : (
              <>
                <label style={{ fontSize: 11, color: P.td, fontFamily: "'Cinzel',serif", letterSpacing: ".05em" }}>{t.dp.pickSkill}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7, marginBottom: 14 }}>
                  {Object.entries(active.skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([n, v]) => (
                    <button key={n} onClick={() => { setSelSkill(n); resetRoll(); }} style={{
                      ...btn, padding: "4px 9px", fontSize: 12,
                      background: selSkill === n ? "linear-gradient(145deg,#2a2518,#1e1a10)" : P.s1,
                      border: `1px solid ${selSkill === n ? P.acd : P.b}`,
                      color: selSkill === n ? P.ac : P.t,
                    }}>{n} <span style={{ color: P.td, marginLeft: 2 }}>{v}</span></button>
                  ))}
                  <button onClick={() => { setSelSkill("__custom__"); resetRoll(); }} style={{
                    ...btn, padding: "4px 9px", fontSize: 12,
                    background: selSkill === "__custom__" ? "linear-gradient(145deg,#2a2518,#1e1a10)" : P.s1,
                    border: `1px solid ${selSkill === "__custom__" ? P.acd : P.b}`,
                    color: selSkill === "__custom__" ? P.ac : P.t,
                  }}>{t.dp.custom}</button>
                </div>
                {selSkill === "__custom__" && (
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, color: P.td }}>{t.dp.value}:</label>
                    <input type="number" value={customVal} min={1} max={100} onChange={e => setCustomVal(Math.max(1, Math.min(100, +e.target.value)))}
                      style={{ ...inp, width: 60, textAlign: "center" }} />
                  </div>
                )}
                {selSkill && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
                      <button onClick={() => { setBp(p => Math.max(-3, p - 1)); resetRoll(); }} style={{ ...btn, padding: "3px 11px", fontSize: 15, color: P.r }}>−</button>
                      <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: P.td, minWidth: 100, textAlign: "center" }}>
                        {bp === 0 ? "—" : bp > 0 ? `${t.dp.bonus} ×${bp}` : `${t.dp.penalty} ×${Math.abs(bp)}`}
                      </span>
                      <button onClick={() => { setBp(p => Math.min(3, p + 1)); resetRoll(); }} style={{ ...btn, padding: "3px 11px", fontSize: 15, color: P.g }}>+</button>
                    </div>
                    {(() => {
                      const sv = selSkill === "__custom__" ? customVal : (active.skills[selSkill] ?? 50);
                      return (
                        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 18, fontSize: 12, color: P.td }}>
                          <span>{t.lg.regular} ≤ <span style={{ color: P.tb }}>{sv}</span></span>
                          <span>{t.lg.hard} ≤ <span style={{ color: P.tb }}>{Math.floor(sv / 2)}</span></span>
                          <span>{t.lg.extreme} ≤ <span style={{ color: P.tb }}>{Math.floor(sv / 5)}</span></span>
                        </div>
                      );
                    })()}
                  </>
                )}
                <div style={{ minHeight: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  {(animDice || rollRes) && (() => {
                    const tensArr = animDice ? animDice.tens : rollRes.tens;
                    const chV = animDice ? null : rollRes.chosen;
                    const uV = animDice ? animDice.units : rollRes.units;
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {tensArr.map((v, i) => {
                          let ch = undefined;
                          if (chV !== null && tensArr.length > 1) {
                            ch = (i === tensArr.indexOf(chV) && v === chV) ? true : false;
                          }
                          return <Die key={`t${i}`} value={v} isTens={true} size={54} chosen={ch} />;
                        })}
                        <div style={{ width: 1, height: 36, background: P.b, margin: "0 3px" }} />
                        <Die value={uV} isTens={false} size={54} />
                      </div>
                    );
                  })()}
                  {rollRes && !rolling && (() => {
                    const ls = LS[rollRes.level];
                    return (
                      <div style={{
                        marginTop: 16, padding: "10px 24px", borderRadius: 8,
                        background: ls.bg, border: `1px solid ${ls.c}33`, textAlign: "center",
                      }}>
                        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 26, fontWeight: 900, color: ls.c, letterSpacing: ".04em" }}>
                          {ls.i} {rollRes.result}
                        </div>
                        <div style={{ fontSize: 13, color: ls.c, marginTop: 3, fontFamily: "'Cinzel',serif", fontWeight: 600, letterSpacing: ".06em" }}>
                          {t.lv[rollRes.level]}
                        </div>
                        {rollRes.isPush && (
                          <div style={{ fontSize: 11, color: P.td, marginTop: 3, fontStyle: "italic" }}>{t.lg.push}</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {selSkill && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    {!rollRes && !rolling && (
                      <button onClick={() => doRoll(false)} style={{ ...abtn, width: "100%", padding: "12px 0", fontSize: 15, fontWeight: 700, letterSpacing: ".07em" }}>
                        {t.dp.roll}
                      </button>
                    )}
                    {rolling && (
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: P.td, fontStyle: "italic", padding: 12 }}>
                        {t.lg.rolling}
                      </div>
                    )}
                    {rollRes && !rolling && (
                      <>
                        <div style={{ display: "flex", gap: 8, width: "100%" }}>
                          <button onClick={resetRoll} style={{ ...btn, flex: 1, padding: "9px 0" }}>{t.dp.newRoll}</button>
                          {canPush && (
                            <button onClick={() => doRoll(true)} style={{
                              ...btn, flex: 1, padding: "9px 0",
                              background: "linear-gradient(145deg,#2a1818,#1e1010)",
                              border: `1px solid ${P.r}55`, color: P.r,
                            }}>{t.dp.push}</button>
                          )}
                        </div>
                        {canPush && (
                          <div style={{ fontSize: 11, color: P.r, fontStyle: "italic", opacity: .7 }}>{t.dp.pushWarn}</div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════ LOG ════════ */}
        {tab === "log" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 190px)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 8 }}>
              {log.length > 0 && (
                <>
                  <button onClick={exportLog} style={{ ...btn, padding: "3px 10px", fontSize: 11 }}>{t.lp.export}</button>
                  <button onClick={() => { if (window.confirm(t.lp.clearConfirm)) setLog([]); }}
                    style={{ ...btn, padding: "3px 10px", fontSize: 11, color: P.r }}>{t.lp.clear}</button>
                </>
              )}
            </div>
            <div style={{ flex: 1, overflow: "auto", paddingRight: 3 }}>
              {log.length === 0 && (
                <div style={{ textAlign: "center", color: P.td, padding: 36, fontStyle: "italic" }}>{t.lp.empty}</div>
              )}
              {log.map(e => {
                let icon = "📝", nc = P.ac, tc = P.t;
                if (e.type === "roll") { icon = "🎲"; tc = e.detail ? LS[e.detail.level].c : P.t; }
                else if (e.type === "hp") icon = "❤️";
                else if (e.type === "san") icon = "🧠";
                else if (e.type === "skill") icon = "📖";
                else if (e.type === "ooc") { icon = "💬"; nc = P.td; tc = P.td; }
                else if (e.type === "sys") { icon = "⚙️"; nc = P.td; tc = P.td; }
                else if (e.type === "msg") { icon = "💬"; }
                return (
                  <div key={e.id} style={{
                    padding: "5px 9px", marginBottom: 2, borderRadius: 5,
                    background: e.type === "roll" && e.detail ? LS[e.detail.level].bg : "transparent",
                    borderLeft: `3px solid ${e.type === "roll" && e.detail ? LS[e.detail.level].c + "44" : e.type === "ooc" ? P.td + "44" : P.b}`,
                    fontSize: 13,
                  }}>
                    <span style={{ color: P.td, fontSize: 10, marginRight: 5 }}>[{e.time}]</span>
                    <span style={{ marginRight: 3 }}>{icon}</span>
                    {e.cn && (
                      <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, color: nc, marginRight: 5, fontSize: 12 }}>{e.cn}</span>
                    )}
                    <span style={{ color: tc }}>{e.text}</span>
                  </div>
                );
              })}
              <div ref={logEnd} />
            </div>
            <form onSubmit={handleLogSub} style={{ display: "flex", gap: 6, marginTop: 8, flexShrink: 0 }}>
              <input value={logIn} onChange={e => setLogIn(e.target.value)} placeholder={t.lp.placeholder}
                style={{ ...inp, flex: 1, fontSize: 14 }} />
              <button type="submit" style={{ ...abtn, padding: "6px 14px" }}>↵</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
