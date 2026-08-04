# ANIS OS

**Ultra-premium, cinematic portfolio experience built like a futuristic operating system.**

ANIS OS is a zero-build, single-page portfolio that behaves like an operating system — a boot
sequence, glassmorphism design system, theme engine, and a rich interaction layer — all running
on static files that deploy anywhere (GitHub Pages first-class).

---

## ✨ Feature Modules

| # | Module | Description |
|---|--------|-------------|
| 01 | Foundation | HTML5 semantics, global design system, CSS custom properties |
| 02 | Global Design System | Glassmorphism, aurora theme, typography, spacing, motion tokens |
| 03 | app.js | Application orchestrator, public API (`window.ANIS_OS`) |
| 04 | theme.js | Aurora theme engine — dark/light/auto, persistence, preview panel |
| 05 | animation.js | GSAP + ScrollTrigger motion layer, performance manager |
| 06 | Hero Section | Cinematic entrance, parallax, typed roles, mouse glow |
| 07 | Premium Navigation | Sticky glass navbar, hide-on-scroll, mobile menu |
| 08 | About Dashboard | Profile card, stats, counters, achievements |
| 09 | Experience Timeline | Career journey with progress spine |
| 10 | AI Lab | Research + workflow sequences |
| 11 | Skills Galaxy | Filterable, searchable skill constellation |
| 12 | Featured Projects | Swiper carousel, filters, case-study modal, lightbox |
| 13 | Project Detail Engine | Case-study renderer |
| 14 | Developer Dashboard | Live GitHub-style dashboard (Chart.js, placeholders) |
| 15 | Professional Expertise | Service cards + capability chips |
| 16 | Learning Roadmap | Expandable learning path |
| 17 | Achievements Hub | Stats, education, certifications |
| 18 | Professional Recommendations | Testimonial timeline |
| 19 | Knowledge Hub | Articles, video, OSS, newsletter |
| 20 | Contact & Hire Me | Contact form, hiring preferences, socials |
| 21 | Terminal Footer | OS-style footer, uptime, dev console (`Ctrl+Shift+A`) |
| 22 | Boot Sequence | 10-step cinematic boot (first visit, replay `Ctrl+Shift+B`) |
| 23 | Interaction Engine | Premium cursor, smooth scroll, command palette (`Ctrl+K`), dev mode, toasts, easter eggs |
| 24 | PWA | Service worker, offline page, installable, manifest |

## 🚀 Quick Start

```bash
# Serve locally (any static server works)
npx serve .
# or
python -m http.server 8080
```

Open `http://localhost:8080` — that's it. No build step, no package install.

## 🗂 Folder Structure

```
/
├── index.html              # Single-page application shell
├── 404.html                # GitHub Pages 404 / SPA fallback
├── offline.html            # Service-worker offline page
├── robots.txt
├── sitemap.xml
├── manifest.webmanifest    # PWA manifest
├── browserconfig.xml       # Windows / Edge tiles
├── sw.js                   # Service worker
├── assets/
│   ├── css/style.css       # Single compiled stylesheet (design system + modules)
│   ├── js/
│   │   ├── data.js         # Data feeds (supply at deploy time)
│   │   ├── theme.js        # Theme engine
│   │   ├── animation.js    # Motion engine
│   │   ├── app.js          # App orchestrator
│   │   ├── interaction.js  # Interaction engine
│   │   └── pwa.js          # PWA bootstrap
│   ├── icons/              # icon.svg + PNG tile placeholders
│   ├── images/             # Raster images (add before deploy)
│   ├── fonts/              # Self-hosted fonts (optional)
│   ├── videos/             # Video content (optional)
│   └── data/               # JSON feeds (optional)
└── docs/                   # Deployment + customization guides
```

## 📚 Documentation

- [Installation guide](docs/INSTALLATION.md)
- [Deployment guide](docs/DEPLOYMENT.md) — performance, security, analytics
- [GitHub Pages guide](docs/GITHUB_PAGES.md) — custom domain, sub-path installs
- [Customization guide](docs/CUSTOMIZATION.md) — content, colors, interactions
- [Theme guide](docs/THEME.md) — theme engine internals
- [Developer guide](docs/DEVELOPER.md) — architecture, APIs, guardrails
- [Structure guide](docs/STRUCTURE.md) — folder layout
- [Maintenance guide](docs/MAINTENANCE.md) — ops + release process
- [Release notes](docs/RELEASE-NOTES.md)
- [Roadmap](docs/ROADMAP.md)
- [QA checklist](docs/QA-CHECKLIST.md)
- [Optimization report](docs/OPTIMIZATION-REPORT.md)

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Command palette |
| `Ctrl + Shift + B` | Replay boot sequence |
| `Ctrl + Shift + A` | Developer console |
| `Ctrl + Shift + T` | Theme panel |
| `Shift + T` | Toggle theme |
| `Alt + T` | Quick theme toggle |
| `Esc` | Close open overlay |

## 🥚 Easter Eggs

- **Konami code** — `↑ ↑ ↓ ↓ ← → ← → B A` unlocks Developer Mode.
- **7× logo click** — click the navbar/footer logo seven times fast.

## 🛠 Tech Stack

HTML5 · CSS3 · Bootstrap 5 · Vanilla JavaScript (ES6) · GSAP · ScrollTrigger · Three.js ·
Typed.js · AOS · Swiper · Particles.js · Vanilla Tilt · CountUp.js · Lenis · PWA

---

Built with a designer’s eye and an engineer’s discipline. **ANIS OS.**
