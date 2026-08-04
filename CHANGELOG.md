# Changelog

All notable changes to **ANIS OS** are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/) and adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Nothing yet — this is the pre-`1.0.0` snapshot buffer.

## [1.0.0] — 2026-08-04 — Initial Production Release

The first production-ready release. Every module below is complete, audited and
deployment-ready.

### Added
- **Foundation** — semantic HTML5 shell, CSS custom-property design system, SEO/OG
  metadata.
- **Global Design System** — token-driven theming, typography, spacing, glass
  components, aurora backgrounds, motion tokens.
- **app.js** — application orchestrator exposing `window.ANIS_OS`, module registry,
  performance monitor, boot loader.
- **theme.js** — dark/light/auto theme engine with persistence, animated transitions,
  `window.ANIS_OS_THEME`.
- **animation.js** — GSAP + ScrollTrigger motion layer, particles, cursor, tilt,
  counters, Swiper, lazy-loaded Chart.js; `window.ANIS_OS_ANIMATIONS`.
- **Premium Hero** — cinematic entrance, parallax, typed roles, mouse glow.
- **Navigation** — sticky glass navbar, hide-on-scroll, mobile menu.
- **About Dashboard / Experience Timeline / AI Lab / Skills Galaxy / Featured
  Projects / Project Detail Engine / Developer Dashboard** — full content modules.
- **Professional Expertise / Learning Roadmap / Achievements Hub / Professional
  Recommendations / Knowledge Hub / Contact & Hire Me / Terminal Footer** — content
  and conversion modules.
- **Boot Sequence** — 10-step cinematic boot (`Ctrl+Shift+B` to replay).
- **Interaction Engine** — `assets/js/interaction.js`, `window.ANIS_OS_INTERACTIONS`:
  command palette (`Ctrl+K`), developer mode, custom cursor, smooth scroll (Lenis),
  scroll reveal, button/card micro-interactions, notifications/toasts, shortcuts,
  easter eggs, page transitions, analytics bridge.
- **Production Optimization** — PWA (`sw.js`, `manifest.webmanifest`,
  `browserconfig.xml`, `offline.html`), SEO (`sitemap.xml`, JSON-LD), security
  guidance, performance, accessibility, responsive, documentation and this changelog.

### Fixed
- Resolved a broken in-page anchor: the "Let's talk" CTA now scrolls to the contact
  form (`#hire-form` target added).
- Eliminated all 404s for locally referenced assets (registered `interaction.js`,
  `data.js`, `apple-touch-icon.png`, and any previously missing shell files).

### Changed
- Data feeds centralized into `assets/js/data.js` (`window.ANIS_OS_DATA`).
- Script load order is now deterministic: library CDNs → `data.js` → `theme.js` →
  `animation.js` → `app.js` → `interaction.js` → `pwa.js`.

### Security
- Strict `referrer` + `Permissions-Policy` meta; CSP template documented in
  `docs/DEPLOYMENT.md`.

### Dependencies
- All 13 runtime CDN dependencies pinned and verified reachable.

## [0.9.0] — (development snapshot)

Pre-release development milestones. Not published.

---

Guides: [Deployment](docs/DEPLOYMENT.md) · [Customization](docs/CUSTOMIZATION.md) ·
[Roadmap](docs/ROADMAP.md)