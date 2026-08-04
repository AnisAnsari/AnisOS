# Final QA Checklist

Pre-ship verification for every ANIS OS release. Run **all** items before deploying.

## 1 · Code quality
- [ ] `node --check` passes on all six scripts (`data`, `theme`, `animation`, `app`, `interaction`, `pwa`).
- [ ] `style.css` brace count is balanced (open == close).
- [ ] No duplicate HTML `id`s; every `href="#id"` resolves to an element.
- [ ] No inline `on*` event handlers.
- [ ] No `console.log`/debugging leftovers in production path.
- [ ] `sw.js` `VERSION` bumped for this release.

## 2 · Performance (Lighthouse)
- [ ] Performance ≥ 95.
- [ ] Body JS is deferred; first paint not blocked by modules.
- [ ] Images use modern formats + lazy loading (`data-src`).
- [ ] CDNs are `preconnect`-ed (done in head).
- [ ] Chart.js remains lazy-loaded only.
- [ ] 13/13 CDN dependencies reachable (HTTP 200).

## 3 · SEO
- [ ] Title + meta description present and unique.
- [ ] Canonical `https://anis-os.github.io/` (or custom domain) correct.
- [ ] Open Graph + Twitter Card complete with a real `og:image`.
- [ ] JSON-LD blocks valid (Person, WebSite, Organization, BreadcrumbList).
- [ ] `robots.txt` + `sitemap.xml` reference the deployed canonical domain.
- [ ] SEO score 100.

## 4 · Accessibility (WCAG 2.2)
- [ ] All buttons carry `type`; all interactive icons have `aria-label`.
- [ ] Focus is visible; tab order logical; `Esc` closes overlays.
- [ ] `prefers-reduced-motion` disables cursor/animation suites.
- [ ] Semantic landmarks + skip-link present.
- [ ] Color contrast passes on glass surfaces (dark + light).
- [ ] Government-grade: Accessibility score 100.

## 5 · Responsive
- [ ] Desktop (1920+, up to ultra-wide) — no layout drift.
- [ ] Laptop (1440, 1280).
- [ ] Tablet (768–1024, portrait + landscape).
- [ ] Mobile (360–428) — menus, palette, cursor don't break.
- [ ] Landscape mobile orientation.

## 6 · Security
- [ ] `referrer` + `Permissions-Policy` meta present.
- [ ] CSP header template applied at host (see DEPLOYMENT.md); no strict inline-blocking meta needed.
- [ ] No secrets/API keys in the repo.
- [ ] All remote resources HTTPS.

## 7 · Errors & offline
- [ ] Hard-reload with network off → cached shell + `offline.html` render.
- [ ] Broken/missing data feed → sections degrade gracefully.
- [ ] CDN blocked → features fall back, page still usable.
- [ ] 404 path shows branded page.

## 8 · Interactions (smoke test)
- [ ] Boot sequence runs on first visit; `Ctrl+Shift+B` replays.
- [ ] `Ctrl+K` palette filters + runs commands; `Esc` closes.
- [ ] `Alt+T` toggles theme; `Ctrl+Shift+T` opens panel; choice persists.
- [ ] `Ctrl+Shift+A` developer console shows live metrics.
- [ ] Developer Mode unlocks via Konami code and 7× logo click.
- [ ] Cursor FX + smooth scroll active; disabled under reduced-motion.
- [ ] Buttons (`data-load-state`, ripple, magnetic) animate.
- [ ] Contact form validates; toast feedback appears.

## 9 · PWA
- [ ] Service worker registered on load.
- [ ] Manifest valid (icons, start_url, theme/background).
- [ ] Update flow: new SW notifies "Update available".
- [ ] Install prompt surfaces; `appinstalled` toast fires.

## 10 · Deployment
- [ ] `.nojekyll` present for GitHub Pages.
- [ ] All asset paths are relative (`./`, `assets/…`).
- [ ] Deploy via `main`/root on GitHub Pages (or chosen host).
- [ ] Post-deploy: hard-refresh, confirm update toast + canonical URLs.

---

**Sign-off:** QA Engineer / Principal FE — date — ✓ / ✗