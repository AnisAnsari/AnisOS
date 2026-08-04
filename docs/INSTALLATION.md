# Installation Guide

Install ANIS OS locally in minutes. No build step, no package manager required —
it is a pure static site.

## Prerequisites

- Any modern browser (Chrome, Edge, Firefox, Safari).
- A static web server (Node, Python, VS Code Live Server, or a simple `npx`).

## 1. Download

Clone the repository (or download and extract the archive):

```bash
git clone https://github.com/anis-os/anis-os.git
cd anis-os
```

## 2. Serve locally

Pick one:

```bash
# Option A — Node (no install needed via npx)
npx serve .

# Option B — Python
python -m http.server 8080

# Option C — VS Code Live Server extension
# right-click index.html → "Open with Live Server"
```

## 3. Open

Navigate to `http://localhost:8080`.

> **Important:** the service worker (`sw.js`) and PWA install prompt only operate
> over HTTP(S) with a secure context. `localhost` qualifies; so does any GitHub
> Pages / Netlify / Vercel HTTPS origin. Avoid opening via `file://` (double-click),
> where the PWA and some APIs will be unavailable.

## 4. Provide content (optional but recommended)

The site ships with sample feeds in `assets/js/data.js`. Replace them with your
real data before deploying — see `docs/CUSTOMIZATION.md`.

## 5. First visit

Expect the **10-step boot sequence** on the first load. Replay it anytime with
`Ctrl + Shift + B`.

---

## Quick verify

| Check | How |
|-------|-----|
| Site loads | Boot sequence completes, hero animates |
| Console clean | DevTools → Console shows no 404 errors for local assets |
| PWA registers | Application tab → Service Workers shows an active worker |
| Theme | `Alt + T` toggles dark/light, `Ctrl + Shift + T` opens theme panel |
| Palette | `Ctrl + K` opens the command palette |
| Dev console | `Ctrl + Shift + A` opens the developer console |