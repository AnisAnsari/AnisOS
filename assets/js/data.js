/* ============================================================================
 *  ANIS OS — Data feeds (data.js)
 * ----------------------------------------------------------------------------
 *  Hydrates the dynamically-injected sections. Consumed by app.js
 *  (DataRenderer) which reads `window.ANIS_OS_DATA`.
 *
 *  Replace the sample content below with your real data. The schema matches
 *  the renderers in app.js:
 *    • timeline     → { date, title, description }
 *    • services     → { icon, title, description, cta }
 *    • learning     → { icon, title, provider, year }
 *    • testimonials → { quote, name, role }
 *
 *  Note: `github` has a feed selector ([data-github-feed]) but no renderer
 *  yet — leave it empty or add a builder in app.js DataRenderer.
 * ========================================================================== */
(function (window) {
  'use strict';

  window.ANIS_OS_DATA = {
    /* ----- Chronological kernel (Experience Timeline) ----------------- */
    timeline: [
      { date: '2024 — Present', title: 'Senior Frontend Developer', description: 'Leading React.js platforms, driving design-system adoption and AI-assisted tooling across product teams.' },
      { date: '2022 — 2024', title: 'Frontend Engineer', description: 'Shipped performant SPAs and reusable component libraries, cutting page-load times by 40%.' },
      { date: '2020 — 2022', title: 'UI/UX Developer', description: 'Bridged design and engineering, prototyping interfaces and translating Figma systems to production code.' },
      { date: '2018 — 2020', title: 'Junior Web Developer', description: 'Started the journey — building responsive marketing sites and learning the craft of the web.' },
    ],

    /* ----- Deployable Services (Professional Expertise) -------------- */
    services: [
      { icon: 'fa-brands fa-react', title: 'React.js Development', description: 'High-performance, accessible React applications engineered with modern state and data patterns.', cta: 'Request build' },
      { icon: 'fa-solid fa-layer-group', title: 'UI/UX Design Systems', description: 'Token-driven design systems and component libraries that scale across products and teams.', cta: 'Request system' },
      { icon: 'fa-solid fa-wand-magic-sparkles', title: 'AI-Powered Solutions', description: 'LLM-integrated product features, copilots and intelligent workflows embedded in the browser.', cta: 'Request AI' },
      { icon: 'fa-solid fa-gauge-high', title: 'Performance Engineering', description: 'Core Web Vitals tuning, bundle strategy and rendering audits that make products feel instant.', cta: 'Request audit' },
    ],

    /* ----- Continuous Learning (Learning Roadmap) -------------------- */
    learning: [
      { icon: 'fa-solid fa-graduation-cap', title: 'Advanced React Patterns', provider: 'Meta / React Docs', year: '2025' },
      { icon: 'fa-solid fa-brain', title: 'Machine Learning Foundations', provider: 'DeepLearning.AI', year: '2025' },
      { icon: 'fa-solid fa-cube', title: 'Design Systems Engineering', provider: 'UX Collective', year: '2024' },
      { icon: 'fa-solid fa-shield-halved', title: 'Web Security & Privacy', provider: 'Frontend Masters', year: '2024' },
      { icon: 'fa-solid fa-robot', title: 'LLM Application Development', provider: 'OpenAI Academy', year: '2024' },
      { icon: 'fa-solid fa-cloud', title: 'Edge & Serverless Architectures', provider: 'Cloudflare University', year: '2024' },
    ],

    /* ----- User Reviews (Testimonials) ------------------------------- */
    testimonials: [
      { quote: 'A rare combination of pixel-level design taste and serious engineering depth. Our platform felt instantly premium.', name: 'Aarav Mehta', role: 'Product Lead' },
      { quote: 'Anis rebuilt our frontend in weeks — accessible, fast, and beautifully coherent with our brand system.', name: 'Sophia Chen', role: 'CTO, Fintech Startup' },
      { quote: 'The AI-assisted features shipped exceeded expectations. Thoughtful, pragmatic, and always on time.', name: 'Daniel Kim', role: 'Engineering Manager' },
    ],
  };
})(window);
