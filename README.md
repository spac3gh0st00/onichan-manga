<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    鬼  兄    O N I C H A N   S Q U A D                   ║
║                                                           ║
║         ⚔️  Your Ultimate Manga Destination  ⚔️           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

[![Live Site](https://img.shields.io/badge/🌐_LIVE_SITE-manga.onichan--squad.com-b44fff?style=for-the-badge&labelColor=0a0812)](https://manga.onichan-squad.com)
[![GitHub Pages](https://img.shields.io/badge/Deployed_on-GitHub_Pages-222?style=for-the-badge&logo=github&logoColor=white)](https://github.com/spac3gh0st00/onichan-manga)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

```
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░                                                 ░
  ░   "In a world where manga is everywhere...      ░
  ░    one site rises above the rest."              ░
  ░                                                 ░
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

<div align="center">

## ⚡ POWER LEVEL: OVER 9000 ⚡

</div>

---

## 📖 ARC 1 — THE ORIGIN STORY

OniChan Squad started as a domain with nothing on it. Through blood, sweat, CORS errors, and way too many `git push --force` commands, it became a fully deployed manga browsing site — live, free, and comic-book themed.

Built with **React 18 + Vite**, powered by the **Jikan API** (MyAnimeList) with **AniList GraphQL** as a fallback. No backend. No database. No mercy.

---

## 🗺️ ARC 2 — THE FEATURE SAGA

```
┌─────────────────────────────────────────────────────────┐
│  CHAPTER 1  │  🔥 Popular Now     — Top manga by score  │
│  CHAPTER 2  │  ✦ New Releases     — Latest drops        │
│  CHAPTER 3  │  ⚡ Genres          — 14 genre filters    │
│  CHAPTER 4  │  📜 History         — Your reading trail  │
│  CHAPTER 5  │  📌 Bookmarks       — Save for later      │
│  CHAPTER 6  │  🎲 Random Manga    — Let fate decide     │
│  CHAPTER 7  │  🔍 Live Search     — Find anything       │
│  CHAPTER 8  │  🚀 Read Free       — WHOOSH redirect     │
└─────────────────────────────────────────────────────────┘
```

### 🚀 THE WHOOSH REDIRECT
Click **Read Free** on any manga and witness the most dramatic redirect page in web history. Full-screen comic book explosion, countdown bar, and links to **MangaDex**, **MangaReader**, and **ComicK** — all free.

### 🎲 RANDOM MANGA
Feeling indecisive? Hit the **Random Manga** button and let the algorithm choose your next obsession. No cap, it slaps.

### 📜 READING HISTORY
Every manga you view gets logged with a timestamp. Check your history anytime. Clear it if you're embarrassed about your romance manga phase.

---

## ⚔️ ARC 3 — THE TECH STACK

```
┌──────────────────────────────────────────────────────────┐
│                    BATTLE FORMATION                       │
│                                                          │
│   FRONTEND    │  React 18 + Vite 5                       │
│   STYLING     │  Pure CSS — Comic book halftone theme    │
│   FONTS       │  Bangers + Comic Neue (Google Fonts)     │
│   API (main)  │  Jikan v4 — MyAnimeList public API       │
│   API (fallback) │  AniList GraphQL                     │
│   HOSTING     │  GitHub Pages                            │
│   CI/CD       │  GitHub Actions — auto deploy on push    │
│   DOMAIN      │  Custom subdomain via CNAME              │
│   PERSISTENCE │  localStorage (bookmarks + history)      │
└──────────────────────────────────────────────────────────┘
```

---

## 🏯 ARC 4 — PROJECT STRUCTURE

```
onichan-manga/
│
├── .github/
│   └── workflows/
│       └── deploy.yml          ← Auto-deploy pipeline
│
├── public/
│   ├── CNAME                   ← Custom domain config
│   └── favicon.svg             ← The 鬼 icon
│
├── src/
│   ├── App.jsx                 ← All components + API logic
│   ├── App.css                 ← Comic book theme styles
│   └── main.jsx                ← React entry point
│
├── index.html                  ← CSP security headers
├── package.json
└── vite.config.js
```

---

## 🛡️ ARC 5 — THE SECURITY ARC

Because even manga sites need protection from villains.

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Whitelists allowed scripts, fonts, images, and API domains |
| `Referrer-Policy` | Prevents URL leakage to external sites |
| `Permissions-Policy` | Blocks camera, mic, geolocation, payment APIs |

---

## ⚙️ ARC 6 — LOCAL DEVELOPMENT

```bash
# Clone the repo
git clone https://github.com/spac3gh0st00/onichan-manga.git
cd onichan-manga

# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build
```

---

## 🌐 ARC 7 — DEPLOYMENT JUTSU

Every push to `main` auto-triggers the GitHub Actions workflow:

```
git add .
git commit -m "your commit message"
git push
```

```
[ Push ] → [ GitHub Actions ] → [ npm install ] → [ vite build ]
        → [ Upload dist/ ] → [ Deploy to Pages ] → [ Live! ]
```

Manual trigger available via **Actions → Deploy to GitHub Pages → Run workflow**.

---

## 🗡️ ARC 8 — DNS CONFIGURATION

Add a single CNAME record at your DNS provider pointing your subdomain to GitHub Pages:

| Type | Name | Value |
|------|------|-------|
| CNAME | manga | `YOUR-USERNAME.github.io` |

---

## 📡 ARC 9 — API SOURCES

| Source | Used For | Docs |
|--------|----------|------|
| [Jikan v4](https://jikan.moe) | Primary — Top manga, search, genres | [docs.api.jikan.moe](https://docs.api.jikan.moe) |
| [AniList GraphQL](https://anilist.co/graphiql) | Fallback — all features | [anilist.gitbook.io](https://anilist.gitbook.io/anilist-apiv2-docs) |

Both APIs are **free**, **public**, and **require no API key**. Jikan is rate-limited to ~3 req/sec.

---

## 📚 FREE READING SITES

OniChan Squad redirects to these free manga reading platforms:

- 🟣 **[MangaDex](https://mangadex.org)** — Largest free manga library, fan translations
- 🟡 **[MangaReader](https://mangareader.to)** — Fast, clean reader
- 🔵 **[ComicK](https://comick.io)** — Great for new releases

---

<div align="center">

```
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║   Built by  spac3gh0st00             ║
  ║   Version   v2.0                     ║
  ║   License   MIT                      ║
  ║                                      ║
  ║   "Plus Ultra!" 🔥                  ║
  ║                                      ║
  ╚══════════════════════════════════════╝
```

[![GitHub](https://img.shields.io/badge/github-spac3gh0st00-181717?style=for-the-badge&logo=github)](https://github.com/spac3gh0st00)

*No API keys were harmed in the making of this site.*

</div>
