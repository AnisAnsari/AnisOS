# Release Notes

## ANIS OS v1.0.0 — "First Boot" (2026-08-04)

This is the first production release. ANIS OS is a zero-build, cinematic portfolio
operating system delivering a complete, audited, deploy-ready experience.

### Highlights
- **Cinematic boot sequence** — 10-step onboarding, replayable with `Ctrl+Shift+B`.
- **Aurora theme engine** — dark/light/auto with animated transitions
  (`Alt+T` toggle, `Ctrl+Shift+T` panel).
- **Interaction Engine** — `Ctrl+K` command palette, developer mode, custom cursor,
  Lenis smooth scroll, notifications, shortcuts, easter eggs.
- **Progressive Web App** — installable, offline capable, update-aware.
- **Enterprise readiness** — SEO/OG/JSON-LD, security posture, WCAG-minded
  accessibility, responsive cutoffs, single-file CSS/JS architecture.

### New in this release
| Feature | Module |
|---------|--------|
| Data feeds | `assets/js/data.js` |
| Command palette | `CommandPalette` |
| Developer mode | `DeveloperMode` |
| Smooth scroll | `SmoothScroll` |
| Cursor FX | `CursorFX` |
| Page transitions | `PageTransition` |
| Skeletons | `Skeletons` |
| Shortcuts | `Shortcuts` |
| Analytics bridge | `Analytics` |
| PWA | `sw.js` + manifest + offline + pwa.js |

### Removed / optimized
- Removed dead stylesheet links (`theme.css`, `animation.css`, `responsive.css` —
  all styles consolidated into `style.css`).

### Known limitations
- Chart.js loads on-demand (lazy) to protect LCP; the first reveal may show the
  legend a beat before the chart.
- Three.js is pinned to r128 — functional, but a future upgrade is planned (v1.1).
- The `github` feed has a container but no renderer yet (roadmap item).

### Verified
- 13/13 CDN dependencies reachable (HTTP 200), no duplicate imports.
- 0 duplicate HTML IDs; all in-page hash anchors resolve.
- 0 local 404s; all referenced assets exist.
- `node --check` passes on all six JS modules.