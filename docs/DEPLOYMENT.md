# Deployment Guide

Production reference for shipping ANIS OS. Every recommendation is compatible with
**GitHub Pages** (static, CDN-loaded, zero build step).

---

## 1. Perform a Production Pass

1. **Fill in real content**
   - `assets/js/data.js` — provide your data feeds (GitHub username, projects, services).
   - Verify social `href`s are real URLs (Command Palette uses them; placeholders show a toast).
   - Replace placeholder `og:image` (`assets/img/og-cover.png`) and `twitter:image`.

2. **Replace canonical / sitemap placeholders** in:
   - `index.html` → `<link rel="canonical">` and `og:url`
   - `robots.txt` → `Sitemap:`
   - `sitemap.xml` → `<loc>`
   - All `https://anis-os.github.io/` references if you use a custom domain.

3. **Add production icons** under `assets/icons/`:
   - `apple-touch-icon.png` (180×180)
   - `tile-70x70.png`, `tile-150x150.png`, `tile-310x150.png`, `tile-310x310.png`
   - PNG versions of `icon.svg` for maximum PWA compatibility (192×192, 512×512).

4. **Minify** `style.css` and the bundled JS for production:
   - `style.css` → minified byte-for-byte identical output.
   - `theme.js`, `animation.js`, `app.js`, `interaction.js`, `pwa.js` → one minified bundle.

## 2. Performance Checklist

- [ ] Images use modern formats (AVIF/WebP) for raster content; `loading="lazy"` off-screen.
- [ ] Fonts self-hosted or loaded with `display=swap` (already applied in the head).
- [ ] Third-party CDNs are `preconnect`-ed (applied). Remove unused CDNs to cut requests.
- [ ] Single stylesheet (`style.css`) — no render-blocking extras.
- [ ] Deferred scripts keep the first paint unblocked.
- [ ] `prefers-reduced-motion` has CSS + JS guards (built-in).

## 3. Security

Configure **HTTP headers** at the host (GitHub Pages supports `_headers` for Cloudflare
Proxy, or via a custom domain + CDN):

```
Content-Security-Policy: default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  img-src 'self' data: https:;
  connect-src 'self' https:;
  frame-ancestors 'none';
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

> The inline `referrer` and `Permissions-Policy` meta tags are already present in
> `index.html`. A strict CSP **meta** tag is not applied because GSAP/AOS inject inline
> styles; enforcement is best done via headers with the `'unsafe-inline'` style allowance above.

## 4. Analytics (opt-in, disabled by default)

Nothing tracks by default. Enable one or more by uncommenting the block in `index.html`
(after the `OPT-IN ANALYTICS` comment) and setting your IDs:

- Google Analytics
- Google Tag Manager
- Microsoft Clarity
- Plausible

Alternatively, set the matching callback on `window.ANIS_OS_INTERACTIONS.analytics`
(e.g. `analytics.googleAnalytics = (e) => gtag('event', e)`).

## 5. PWA

- The service worker is registered by `assets/js/pwa.js`. Register at page root (`./sw.js`).
- Update `VERSION` in `sw.js` whenever you ship a release to bust caches predictably.
- Chrome may prompt to install; a toast surfaces the prompt.

## 6. Lighthouse Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Performance | 95+ | Defer non-critical JS, `preconnect` CDNs, single CSS, modern images, SW cache |
| Accessibility | 100 | Semantic landmarks, ARIA badges, keyboard nav, reduced-motion guards, skip link |
| Best Practices | 100 | HTTPS, security headers, no mixed content, valid manifest |
| SEO | 100 | Title/description/OG/Twitter, JSON-LD, `robots.txt`, `sitemap.xml`, crawlable content |