# Developer Guide

Orientation for engineers working on ANIS OS: architecture, module ownership,
public APIs, and the constraints that keep the release production-safe.

## Layered architecture

ANIS OS is built as an orchestrating boot sequence with strict ownership. Scripts
load in this order; each exposes a public global consumed by the next:

| Order | Script | Global | Owns |
|-------|--------|--------|------|
| 1 | `data.js` | `window.ANIS_OS_DATA` | Static data feeds |
| 2 | `theme.js` | `window.ANIS_OS_THEME` | Theme engine |
| 3 | `animation.js` | `window.ANIS_OS_ANIMATIONS` | GSAP/ScrollTrigger, particles, tilt, counters, Swiper, Chart.js, project details |
| 4 | `app.js` | `window.ANIS_OS` | Orchestrator, boot loader, data renderer, performance |
| 5 | `interaction.js` | `window.ANIS_OS_INTERACTIONS` | Cursor, palette, smooth scroll, dev mode, toasts, shortcuts |
| 6 | `pwa.js` | `window.ANIS_OS_PWA` | Service worker, install/offline prompts |

`animation.js` is the animation owner. `app.js` reads its `features` map and
**skips** its own AOS/cursor/magnetic/Swiper/counters/tilt init when
`animation.js` reports ownership — never re-initialize what another module owns.

## Public API surface

```js
window.ANIS_OS             // app insights, boot, module registry, perf, renderers
window.ANIS_OS_THEME       // setTheme / toggleTheme / setMode / getTheme / openPanel
window.ANIS_OS_ANIMATIONS  // refresh(), features map
window.ANIS_OS_INTERACTIONS// notify(), palette, devmode, analytics bridge
window.ANIS_OS_PWA         // install(), update()
```

## Shared conventions

- `$` / `$$` — query helpers (`document.querySelector(All)`).
- `addClass` / `removeClass` / `toggleClass` — class helpers.
- `prefersReducedMotion()` — always gate motion behind this.
- `hasFinePointer()` — gate hover-only effects.
- `engine.perf.registerTimeline()` — register GSAP timelines for the FPS/performance
  manager.
- `engine.on` / `engine.emit` — the event bus (e.g. `loader-done`).

## Adding data

Edit `assets/js/data.js`. The renderer in `app.js` (`DataRenderer`) maps
`timeline`, `services`, `learning`, `testimonials` to their feed containers.
`github` has a feed target but no renderer yet — add a builder if needed.

## Adding an interaction

- **Palette entry** — extend `CommandPalette.buildIndex()` in `interaction.js`.
- **Cursor label** — `data-cursor-label="…"`.
- **Scroll reveal** — `data-rv="fade|slide|scale|rotate"` (+ `data-rv-y`,
  `data-rv-delay`), or `data-rv-text` for a word-split reveal.
- **Button FX** — `data-load-state` (loading→success), `data-ripple`.
- **Shortcut** — extend `Shortcuts` in `interaction.js`.

## Test before shipping

```bash
# Syntax check every script
node --check assets/js/data.js
node --check assets/js/theme.js
node --check assets/js/animation.js
node --check assets/js/app.js
node --check assets/js/interaction.js
node --check assets/js/pwa.js
```

## Guardrails (do not violate)

1. **No inline event handlers** — use delegated listeners (CSP-friendly).
2. **No new `id` collisions** — every `id` is unique; every `href="#id"` must resolve.
3. **No shell UI redesign** — extend the interaction layer, preserve visual identity.
4. **`prefers-reduced-motion`** — every animated module must degrade under it.
5. **PWA cache** — bump `VERSION` in `sw.js` when you change core shell files.