# 🐙 CoC 7e Session Manager / 克苏鲁的呼唤 7版 场景管理器

A browser-based session management tool for **Call of Cthulhu 7th Edition** TRPG, with full English and Chinese (中文) support.

一个基于浏览器的**克苏鲁的呼唤第七版** TRPG 场景管理工具，支持中英文切换。

## Features / 功能

### 🎲 Dice Roller / 骰子
- d100 percentile roll with animated dice
- Bonus & Penalty dice (up to ±3) — shows all tens dice, highlights chosen
- Success levels: Critical (01) · Extreme (≤ skill/5) · Hard (≤ skill/2) · Regular (≤ skill) · Failure · Fumble
- **Pushed rolls** — available after failure, with ominous consequences
- Roll against any character skill or a custom target value

### 👤 Characters / 角色管理
- Create investigators with name, HP, SAN, and skills
- 15 pre-populated common CoC 7e skills (侦查, 聆听, 急救, etc.)
- Add/remove custom skills
- HP and SAN bars with +/− adjustment, every change logged
- Click to set active investigator for dice rolling

### 📜 Session Log / 日志
- Chronological log of all events: dice rolls, HP/SAN changes, skill edits, system messages
- **OOC comments** — type `(` to start an out-of-character message
- Color-coded entries by event type
- Export log as `.txt` file
- Clear log with confirmation

### 🌐 Bilingual / 双语
- Toggle EN ↔ 中文 in the header
- All UI labels, skill names, and log entries switch language

### 💾 Persistence / 数据持久化
- All data saved to `localStorage` — survives page refresh
- Up to 500 log entries retained

## Getting Started / 开始使用

```bash
npm install
npm run dev
```

Open http://localhost:5173/coc-tool/

## Build & Deploy / 构建与部署

```bash
npm run build     # outputs to dist/
npm run preview   # preview production build
```

### GitHub Pages

This repo includes a GitHub Actions workflow that automatically deploys to GitHub Pages on push to `main`. Enable Pages in your repo settings → **Source: GitHub Actions**.

Live at: `https://coc-god.github.io/coc-tool/`

## Tech Stack

- React 19 + Vite
- Zero external UI dependencies
- Cinzel + Crimson Text typography
- Dark Lovecraftian theme 🕯️

## License

MIT
