# 🐙 CoC 7e Session Playground / 克苏鲁的呼唤 7版 跑团场景

A chat-driven session playground for **Call of Cthulhu 7th Edition** TRPG with **multiplayer support via WebRTC**. The Keeper hosts a room, players join with a code — no server required. Full English and Chinese (中文) support.

一个基于聊天指令的**克苏鲁的呼唤第七版** TRPG 跑团工具，支持通过 **WebRTC 多人联机**。守密人创建房间，玩家通过房间代码加入——无需服务器。支持中英文切换。

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
| `.gen <total>` | Generate 5 random attribute sets |
| `.pick <1-5> [name]` | Create character from a generated set |
| `.help` | Show command reference |
| `(text)` | Out-of-character comment (OOC / 题外话) |
| anything else | In-character message / narration |

Dice rolls show inline tens + units dice with bonus/penalty dice visible, success thresholds `[regular/hard/extreme]`, and color-coded results.

### 🌐 Multiplayer / 多人联机

P2P multiplayer via [PeerJS](https://peerjs.com/) (WebRTC). The Keeper (KP) hosts a room, players join with a 4-character room code. No server needed — works directly on GitHub Pages.

| Command | Effect |
|---|---|
| `.host [name]` | Host a room as Keeper (守密人) |
| `.join <code> [name]` | Join a room as player (玩家) |
| `.leave` | Disconnect from room |
| `.scene <text>` | (KP) Set scene description for all players |
| `.npc <name> [hp]` | (KP) Create an NPC |
| `.secret <skill> [b/p]` | (KP) Secret roll — only you see the result |
| `.lock` / `.unlock` | (KP) Lock/unlock player input |
| `.adj <name> hp/san ±N` | (KP) Adjust any character's HP or SAN |

**How it works:**
- KP holds authoritative game state and broadcasts to all players
- Players send commands to the KP for processing
- Connection bar shows room code (click to copy), player list, and status
- KP can manage NPCs, make secret rolls, set scenes, and lock player input
- Secret rolls are filtered from the broadcast — only the KP sees them

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
- PeerJS (WebRTC) for multiplayer
- Zero external UI dependencies
- Cinzel + Crimson Text typography
- Dark Lovecraftian theme 🕯️

## License

MIT
