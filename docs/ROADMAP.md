# Roadmap

Versioning follows [Semantic Versioning](https://semver.org/). Dates are targets,
not commitments.

---

## v1.1 "Polished Core" (2027-Q1)

**Maintainability**
- Introduce a lightweight build step (esbuild) that **minifies and fingerprints**
  `style.css` + the JS bundle — same architecture, smaller payload (target −45% CSS,
  −20% JS).
- Upgrade Three.js from r128 and AOS to a maintained current release; add a runtime
  feature-detect + graceful `fallback` for WebGL.
- Add a `github` feed renderer for the existing `[data-github-feed]` container.

**Performance**
- Self-host fonts (Space Grotesk / Inter / JetBrains Mono) with `font-display: swap`
  to drop the Google Fonts round-trip → better LCP.
- Add AVIF/WebP blur-up placeholders for all raster imagery.
- Ship pre-minified `style.css` in-repo.

## v1.5 "Connected" (2027-Q3)

**Content / data**
- **CMS Integration** — headless CMS (Contentful/Sanity) driving `data.js` via a
  static JSON export pipeline.
- **Blog CMS** — lightweight markdown-based blog rendered client-side with its own
  routes (hash-based to stay GitHub-Pages friendly) + RSS.
- **Analytics Dashboard** — an in-app dashboard surface consuming privacy-first
  analytics (Plausible/Umami) via serverless edge functions.

**Interactions**
- AI-assisted **case-study copilot** that drafts section copy against your design
  tokens.
- Performance budget warnings surfaced in the developer console.

## v2.0 "ANIS AI Workspace" (2028)

**Flagship features**
- **AI Chat Assistant** — on-canvas conversational assistant contextual to the
  portfolio (project walkthroughs, availability, Q&A) with streaming UX.
- **Admin Panel** — a guarded authoring surface (client-rendered) to edit projects,
  timeline, services, testimonials and publish changes without touching markup.
- **Offline-first data sync** — IndexedDB-backed local queue with background-sync
  flush (replaces the `sw.js` sync placeholder).
- Multilingual (i18n) with hreflang.

---

## Feature placeholders

| Slot | Feature | Target |
|------|---------|--------|
| v1.1 | esbuild minify pipeline | Replaces inline recommendation |
| v1.1 | Three.js + AOS upgrade & fallback | Upgrades locked deps |
| v1.5 | Headless CMS integration | Content editing |
| v1.5 | Blog CMS + RSS | Publishing |
| v1.5 | Analytics Dashboard | Insights |
| v2.0 | AI Chat Assistant | Conversational UX |
| v2.0 | Admin Panel | Self-service editing |
| v2.0 | Offline-first sync | Resilience |
| v2.0 | i18n + hreflang | Global reach |