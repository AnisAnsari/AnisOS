# Maintenance Guide

Routine and release-time operations for keeping ANIS OS healthy in production.

## Routine checks

| Frequency | Task |
|-----------|------|
| Weekly | Review `docs/QA-CHECKLIST.md`; check console for errors. |
| Every release | Bump `VERSION` in `sw.js` and the `version` metadata in `index.html`. |
| Monthly | Re-verify CDN reachability (see `DEPLOYMENT.md` §2). |
| Quarterly | Run a Lighthouse pass; confirm targets (100/100/100/95). |
| Content updates | Edit `assets/js/data.js` + `index.html` copy; keep `sitemap.xml`/`robots.txt` current. |

## Error handling reference

The site already degrades gracefully for common failure modes:

| Failure | Built-in behavior |
|---------|-------------------|
| **Network offline** | Service worker serves cached shell; `offline.html` fallback for navigations; toasts on `offline`/`online`. |
| **Broken/missing image** | All iconography is inline SVG or lazy-loaded with `data-src`; nothing hard-crashes. |
| **Missing data feed** | `DataRenderer` resolves `false` and sections render their static fallback content. |
| **CDN blocked (Chart.js)** | Lazy loader resolves `null`; the DOM legend fallback renders instead. |
| **Animation failure** | Every GSAP feature is gated on `prefersReducedMotion()` and guarded feature flags; app functions without them. |
| **404 path** | `404.html` renders branded 404 with auto-home fallback. |
| **Service worker failure** | Registration is wrapped; the site runs fully without SW. |

## Release process

1. **Branch** — cut `release/<version>` from `main`.
2. **Verify** — run the final QA checklist (`docs/QA-CHECKLIST.md`).
3. **Bump** — version in `index.html` head comment + `sw.js` `VERSION` +
   `CHANGELOG.md`.
4. **Serve + smoke test** — local server, boot, palette, theme, dev console,
   offline reload.
5. **Deploy** — push; GitHub Pages serves `main`/root automatically (see
   `docs/GITHUB_PAGES.md`).
6. **Post-deploy** — hard-refresh once; confirm the update toast; verify canonical
   URLs and sitemap.

## Cache invalidation

`sw.js` precaches the core shell under `anis-os-v1.0.0-core`. Bump the version
string to force a fresh install+activate cycle; old caches are purged on activate.

## Dependency drift

All CDNs are pinned to exact versions. Update deliberately (never float to `latest`):
- Re-test the affected feature.
- Update the pinned version in `index.html` (and `chartSrc` in `animation.js`).
- Re-run the reachability check from `DEPLOYMENT.md`.

## Data privacy

No analytics run by default. Enable only via the opt-in block in `index.html`.
Rotate nothing sensitive — the site ships with **zero secrets**. Never commit real
API keys.