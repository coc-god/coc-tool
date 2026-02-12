# 🐙 CoC 7e Session Playground / 克苏鲁的呼唤 7版 跑团场景

A chat-driven session playground for **Call of Cthulhu 7th Edition** TRPG. Players pick characters, type commands to roll dice, and play through a shared session log. Full English and Chinese (中文) support.

一个基于聊天指令的**克苏鲁的呼唤第七版** TRPG 跑团工具。玩家选择角色，通过输入指令掷骰，在共享的场景日志中进行游戏。支持中英文切换。

## Features / 功能

### 🎲 Command-Driven Play / 指令驱动
Everything happens in the session chat. Type commands to roll, adjust stats, or talk in/out of character:

| Command | Effect |
|---|---|
| `.rc <skill>` | Roll skill check (e.g. `.rc Spot Hidden` / `.rc 侦查`) |
| `.rc <number>` | Roll against custom value (e.g. `.rc 65`) |
| `.rc <skill> b2` | Roll with 2 bonus dice |
| `.rc <skill> p1` | Roll with 1 penalty die |
| `.push` | Push your last failed roll (孤注一掷) |
| `.hp -3` / `.hp +2` | Adjust your HP |
| `.san -5` / `.san +1` | Adjust your SAN |
| `.help` | Show command reference |
| `(text)` | Out-of-character comment (OOC / 题外话) |
| anything else | In-character message / narration |

Dice rolls show inline tens + units dice with bonus/penalty dice visible, success thresholds `[regular/hard/extreme]`, and color-coded results.

### 👤 Characters / 角色管理
- Create investigators with name, HP, SAN, and skills
- 15 pre-populated common CoC 7e skills
- Add/remove custom skills
- Each character gets a unique color in the session log
- Switch active character with one click

### 📜 Session Log / 场景日志
- All events in one chronological feed: 🎲 rolls, 🗣️ IC dialogue, 💬 OOC, ❤️ HP, 🧠 SAN, 📖 skill changes
- Color-coded per character and event type
- Export as `.txt`, clear with confirmation
- Up to 500 entries persisted

### 🌐 Bilingual / 双语
- Toggle EN ↔ 中文 — all UI, skills, and log entries switch

### 💾 Persistence / 数据持久化
- All data saved to `localStorage` — survives page refresh

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
