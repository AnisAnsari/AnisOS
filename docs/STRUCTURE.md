# Folder Structure Guide

Production layout of the ANIS OS repository.

```
anis-os/
├── .nojekyll                # Disables Jekyll on GitHub Pages (keeps sw.js/manifest intact)
├── index.html               # Single-page application shell (all sections)
├── 404.html                 # Branded 404 + auto-home fallback
├── offline.html             # Service-worker offline page
├── robots.txt               # Crawler rules + sitemap pointer
├── sitemap.xml              # Single-page sitemap
├── manifest.webmanifest     # PWA manifest (standalone, icons, shortcuts)
├── browserconfig.xml        # Microsoft Edge / Windows tile config
├── sw.js                    # Service worker (precache + runtime strategies)
├── README.md                # Project overview + quick start
├── CHANGELOG.md             # Version history
├── LICENSE                  # MIT license
│
├── assets/
│   ├── css/
│   │   └── style.css        # Single compiled stylesheet (design system + modules)
│   ├── js/
│   │   ├── data.js          # Data feeds → window.ANIS_OS_DATA
│   │   ├── theme.js         # Theme engine → window.ANIS_OS_THEME
│   │   ├── animation.js     # Motion engine → window.ANIS_OS_ANIMATIONS
│   │   ├── app.js           # Orchestrator + boot → window.ANIS_OS
│   │   ├── interaction.js   # Interaction engine → window.ANIS_OS_INTERACTIONS
│   │   └── pwa.js           # PWA bootstrap → window.ANIS_OS_PWA
│   ├── icons/
│   │   ├── icon.svg         # Favicon + manifest source icon
│   │   └── apple-touch-icon.png
│   ├── images/              # Raster images (populate before deploy)
│   ├── fonts/               # Self-hosted fonts (optional)
│   ├── videos/              # Video content (optional)
│   └── data/                # JSON feeds (optional, keep out of SW precache)
│
└── docs/
    ├── INSTALLATION.md      # Local setup
    ├── DEPLOYMENT.md        # Performance / security / analytics / Lighthouse
    ├── GITHUB_PAGES.md      # Pages, custom domain, sub-path installs
    ├── CUSTOMIZATION.md     # Content, colors, interactions
    ├── THEME.md             # Theme engine internals
    ├── DEVELOPER.md         # Architecture, APIs, guardrails
    ├── STRUCTURE.md         # This file
    ├── MAINTENANCE.md       # Ops + release process
    ├── RELEASE-NOTES.md     # Release notes + version history
    ├── ROADMAP.md           # Future roadmap
    └── QA-CHECKLIST.md      # Pre-ship verification
```

## Conventions

- **Single stylesheet** — `style.css` is the only local CSS. Never add a second
  stylesheet without a build step.
- **ES6 modules, classic scripts** — the project is zero-build; scripts load via
  `defer` in dependency order.
- **No `_`-prefixed folders** — avoids Jekyll interference on GitHub Pages
  (`.nojekyll` is a belt-and-braces guarantee).
- **Relative paths only** — `./`, `assets/…` everywhere, so the site works at root,
  sub-path, or custom domain without config.
- **All local assets referenced from markup or `sw.js`** are verified to exist in
  CI (see the audit tooling referenced in `DEPLOYMENT.md`).