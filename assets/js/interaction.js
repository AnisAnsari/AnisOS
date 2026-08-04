/* ============================================================================
 *  ANIS OS — INTERACTION ENGINE
 * ----------------------------------------------------------------------------
 *  Layer that gives every movement a premium feel without re-orchestrating the
 *  existing app.js / animation.js modules. It is loaded AFTER those two so it
 *  can enhance the cursor, smooth scrolling and theme without fighting them.
 *
 *  Modules
 *  --------------------------------------------------------------------------
 *   01 Notifications     — glass toasts (success / warning / error / info)
 *   02 MouseGlow         — aurora light that follows the pointer
 *   03 SmoothScroll      — Lenis fluid scrolling + ScrollTrigger sync
 *   04 ScrollProgress    — circular progress ring + live percentage
 *   05 CursorFX          — premium cursor states, labels, effects
 *   06 ScrollReveal      — fade / slide / scale / rotate / text reveal
 *   07 CardFX            — glass reflection sweep on tilt cards
 *   08 ButtonFX          — elastic press + loading / success states
 *   09 CommandPalette    — Ctrl+K search across pages, skills & commands
 *   10 DeveloperMode     — system / browser / FPS / memory / theme overlay
 *   11 EasterEggs        — Konami code + 7× logo click
 *   12 PageTransition    — cinematic entry / navigation transition
 *   13 Skeletons         — shimmer loading placeholders
 *   14 Shortcuts         — central keyboard coordinator
 *   15 Analytics         — opt-in placeholders (no tracking by default)
 *
 *  Design language, tokens and animation easing are reused from the theme so
 *  this layer stays visually continuous with the rest of ANIS OS.
 * ========================================================================== */
'use strict';

(function (window, document) {
  'use strict';

  /* ====================================================================
   * 00. CORE HELPERS — dependency free, DRY
   * ================================================================== */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const hasClass = (el, name) => el && el.classList.contains(name);
  const addClass = (el, ...names) => el && el.classList.add(...names);
  const removeClass = (el, ...names) => el && el.classList.remove(...names);
  const toggleClass = (el, name, force) => el && el.classList.toggle(name, force);

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** Trailing-edge debounce for resize / verbose input events */
  function debounce(fn, wait = 150) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Leading-edge throttle for high-frequency pointer events */
  function throttle(fn, limit = 60) {
    let ready = true;
    return function throttled(...args) {
      if (!ready) return;
      ready = false;
      fn.apply(this, args);
      setTimeout(() => { ready = true; }, limit);
    };
  }

  /** Engine-wide shared context (mirrors the animation engine's posture). */
  const engine = {
    gsap: window.gsap || null,
    scrollTrigger: window.ScrollTrigger || null,
    reduced: prefersReducedMotion(),
    finePointer: hasFinePointer(),
  };

  /**
   * Smoothly scroll to an absolute viewport offset. Routes through Lenis when
   * available so the whole page shares one scrolling language; otherwise it
   * degrades to native smooth scrolling (or instant scroll for reduced motion).
   */
  function scrollToTop(targetTop) {
    if (window.__ANIS_LENIS) {
      window.__ANIS_LENIS.scrollTo(targetTop, { duration: 1.1 });
    } else {
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: engine.reduced ? 'auto' : 'smooth',
      });
    }
  }

  /* ====================================================================
   * 15. ANALYTICS — opt-in placeholders (nothing fires unless configured)
   * ================================================================== */
  const ANALYTICS = {
    // Set any of these to a function(){} implementation when you want to enable
    // tracking. All are disabled by default — no cookies, no network calls.
    googleAnalytics: null, // e.g. (e) => window.gtag('event', e, {})
    tagManager: null, //     e.g. () => window.dataLayer.push({ event: 'page_view' })
    clarity: null, //        e.g. () => window.clarity('start', 'YOUR_CLARITY_ID')
    plausible: null, //      e.g. () => window.plausible('pageview')

    track(name, data) {
      [this.googleAnalytics, this.tagManager, this.plausible].forEach((fn) => {
        try { if (typeof fn === 'function') fn(name, data); } catch (e) { /* never throw */ }
      });
    },
  };

  /* ====================================================================
   * 01. NOTIFICATIONS — glass toast stack
   * ================================================================== */
  class Notifications {
    constructor(stack) {
      this.stack = stack;
      this.active = new Set();
    }

    notify(type, title, message, opts = {}) {
      if (!this.stack) return null;

      const icons = {
        success: 'fa-circle-check',
        warning: 'fa-triangle-exclamation',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info',
      };

      const el = document.createElement('div');
      el.className = `toast toast--${type || 'info'}`;
      el.setAttribute('role', type === 'error' ? 'alert' : 'status');

      el.innerHTML =
        '<span class="toast__icon"><i class="fa-solid ' + (icons[type] || icons.info) + '" aria-hidden="true"></i></span>' +
        '<div class="toast__body">' +
          '<div class="toast__title"></div>' +
          '<div class="toast__msg"></div>' +
        '</div>' +
        '<button type="button" class="toast__close" aria-label="Dismiss notification"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';

      $('.toast__title', el).textContent = title || '';
      $('.toast__msg', el).textContent = message || '';

      this.stack.appendChild(el);
      this.active.add(el);

      const dismiss = () => {
        if (el._gone) return;
        el._gone = true;
        this.active.delete(el);
        removeClass(el, 'is-in');
        addClass(el, 'is-out');
        setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 380);
      };

      $('.toast__close', el).addEventListener('click', dismiss);

      // Let the browser paint the initial (off-screen) position, then slide in.
      requestAnimationFrame(() => addClass(el, 'is-in'));

      const duration = opts.duration === undefined ? 4200 : opts.duration;
      if (duration > 0) setTimeout(dismiss, duration);

      ANALYTICS.track('notification', { type });
      return el;
    }

    clear() {
      this.active.forEach((el) => {
        el._gone = true;
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      this.active.clear();
    }
  }

  /* ====================================================================
   * 02. MOUSE GLOW — aurora light reacts to the pointer
   * ================================================================== */
  class MouseGlow {
    constructor(el) {
      this.el = el;
      this.enabled = this.el && hasFinePointer() && !prefersReducedMotion();
      this.x = -600;
      this.y = -600;
      this.tx = -600;
      this.ty = -600;
    }

    init() {
      if (!this.enabled) {
        if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
        return;
      }
      this.rafId = null;
      window.addEventListener('mousemove', (e) => {
        // Only reveal the glow once the pointer is actually moving.
        if (!hasClass(document.documentElement, 'has-mouse-glow')) {
          addClass(document.documentElement, 'has-mouse-glow');
        }
        this.tx = e.clientX;
        this.ty = e.clientY;
      }, { passive: true });

      const tick = () => {
        this.x += (this.tx - this.x) * 0.055;
        this.y += (this.ty - this.y) * 0.055;
        this.el.style.transform =
          `translate3d(${this.x - 280}px, ${this.y - 280}px, 0)`;
        this.rafId = requestAnimationFrame(tick);
      };
      tick();
    }
  }

  /* ====================================================================
   * 03. SMOOTH SCROLL — Lenis + ScrollTrigger + pattern routing
   * ================================================================== */
  class SmoothScroll {
    constructor() {
      this.instance = null;
    }

    init() {
      if (typeof window.Lenis === 'undefined' || engine.reduced) return;

      const lenis = new window.Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.3,
      });
      this.instance = lenis;
      window.__ANIS_LENIS = lenis;

      if (engine.gsap && engine.scrollTrigger) {
        lenis.on('scroll', engine.scrollTrigger.update);
        engine.gsap.ticker.add((time) => lenis.raf(time * 1000));
        engine.gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (time) => {
          lenis.raf(time);
          requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
      }

      this.patchScrollTo();
    }

    /**
     * Route every existing `window.scrollTo({ behavior: 'smooth' })` call
     * through Lenis so app.js anchors, back-to-top and the navigation all share
     * one buttery scroll while Lenis is active.
     */
    patchScrollTo() {
      const native = window.scrollTo.bind(window);
      window.scrollTo = function (x, y) {
        const lenis = window.__ANIS_LENIS;
        if (lenis && typeof x === 'object' && x.behavior === 'smooth') {
          const top = typeof y === 'number' ? y : (x.top || 0);
          lenis.scrollTo(Math.max(0, top), { duration: 1.1 });
          return;
        }
        return native(x, y);
      };
    }

    scrollTo(targetTop) {
      scrollToTop(targetTop);
    }

    stop() { this.instance && this.instance.stop(); }
    start() { this.instance && this.instance.start(); }
  }

  /* ====================================================================
   * 04. SCROLL PROGRESS — circular ring + percentage
   * ================================================================== */
  class ScrollProgress {
    constructor(ring, pct) {
      this.ring = ring;
      this.pct = pct;
      this.lastPct = -1;
      this.pending = false;
    }

    init() {
      const update = () => this.#handleScroll();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', debounce(update, 120), { passive: true });
      document.addEventListener('DOMContentLoaded', update);
      update();
    }

    /** rAF-batched scroll handler keeps layout work off the critical path. */
    #handleScroll() {
      if (!this.pending) {
        this.pending = true;
        requestAnimationFrame(() => {
          this.pending = false;
          this.update();
        });
      }
    }

    update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      const percent = Math.round(progress * 100);
      const visible = window.scrollY > 320;

      if (this.ring) {
        toggleClass(this.ring, 'is-visible', visible);
        this.ring.style.setProperty('--p', percent);
      }
      if (this.pct) {
        toggleClass(this.pct, 'is-visible', visible);
        if (percent !== this.lastPct) {
          this.pct.textContent = percent + '%';
          this.lastPct = percent;
        }
      }
    }
  }

  /* ====================================================================
   * 05. CURSOR FX — premium states, labels & effects
   *  (Enhances the dot + ring that animation.js already moves with a rAF loop.)
   * ================================================================== */
  class CursorFX {
    constructor() {
      this.ring = $('[data-cursor-ring]');
      this.label = $('[data-cursor-label]');
      this.enabled = this.ring && hasFinePointer() && !prefersReducedMotion();
    }

    init() {
      if (!this.enabled) return;
      this.bind();
    }

    bind() {
      document.addEventListener('mouseover', (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        const ring = this.ring;

        this.clearStates(
          'is-link is-button is-card is-image is-input is-drag is-loading is-disabled is-label is-glow'.split(' ')
        );

        // Interactive / state heuristics first so text-caret never wins here.
        const link = t.closest('a');
        const button = t.closest('button, [role="button"]');
        const input = t.closest('input, textarea, select');
        const card = t.closest('[data-tilt], article, .projects-card, .galaxy-card, .journey__card');
        const img = t.closest('img, [data-cursor-image]');

        if (button) addClass(ring, 'is-button');
        else if (link) addClass(ring, 'is-link');
        if (input) addClass(ring, 'is-input');
        if (card) addClass(ring, 'is-card');

        // The default caret from animation.js only suits plain headings.
        if (t.closest('h1, h2, h3, h4')) {
          if (link || button || card || img || input) removeClass(ring, 'is-text');
        }

        // Contextual labels.
        const labelled = t.closest('[data-cursor-label]');
        if (labelled) this.showLabel(labelled.dataset.cursorLabel || 'View');
        else if (img) { this.showLabel('View'); addClass(ring, 'is-image'); }
        else if (t.closest('[data-copy]')) this.showLabel('Copy');
        else if (t.closest('[data-cursor-play], .hub-video__play')) this.showLabel('Play');
        else if (link && (link.target === '_blank' || (link.rel || '').includes('noopener'))) this.showLabel('Open');
        else this.clearLabel();

        if (t.closest('button:disabled, [aria-disabled="true"]')) addClass(ring, 'is-disabled');
        if (t.closest('.is-loading, [data-cursor-loading]')) addClass(ring, 'is-loading');
        if (img || t.closest('[data-cursor-glow]')) addClass(ring, 'is-glow');
      }, { passive: true });

      document.addEventListener('mousedown', (e) => {
        addClass(this.ring, 'is-pressed-fx');
        if (e.target.closest && e.target.closest('[data-drag], img')) addClass(this.ring, 'is-drag');
      }, { passive: true });

      document.addEventListener('mouseup', () => {
        removeClass(this.ring, 'is-pressed-fx');
        removeClass(this.ring, 'is-drag');
      }, { passive: true });

      document.addEventListener('click', () => {
        addClass(this.ring, 'is-pulse');
        setTimeout(() => removeClass(this.ring, 'is-pulse'), 520);
      }, { passive: true });
    }

    clearStates(names) {
      names.forEach((n) => removeClass(this.ring, n));
    }

    showLabel(text) {
      if (this.label) this.label.textContent = text;
      addClass(this.ring, 'is-label');
    }

    clearLabel() {
      if (this.label) this.label.textContent = '';
      removeClass(this.ring, 'is-label');
    }
  }

  /* ====================================================================
   * 13. SKELETONS — shimmer placeholders
   * ================================================================== */
  const Skeletons = {
    /** Add shimmer to one or more elements. */
    show(...els) {
      els.forEach((el) => el && addClass(el, 'skeleton'));
    },
    /** Remove shimmer. */
    hide(...els) {
      els.forEach((el) => el && removeClass(el, 'skeleton'));
    },
  };

  /* ====================================================================
   * 11. EASTER EGGS — Konami code + 7× logo click
   * ================================================================== */
  class EasterEggs {
    constructor() {
      this.konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
      this.konamiPos = 0;
      this.logoClicks = 0;
      this.logoTimer = null;
      this.unlockedListeners = [];
    }

    init() {
      document.addEventListener('keydown', (e) => {
        const key = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === this.konami[this.konamiPos]) {
          this.konamiPos += 1;
          if (this.konamiPos === this.konami.length) {
            this.konamiPos = 0;
            this.unlock();
          }
        } else {
          this.konamiPos = key === 'ArrowUp' ? 1 : 0;
        }
      });

      // The brand logo and the footer logo both count toward the 7× unlock.
      const brands = $$('.site-navbar__brand, .terminal-footer__logo');
      brands.forEach((b) => {
        b.addEventListener('click', () => this.countLogo());
      });
    }

    countLogo() {
      this.logoClicks += 1;
      clearTimeout(this.logoTimer);
      this.logoTimer = setTimeout(() => { this.logoClicks = 0; }, 4000);
      if (this.logoClicks >= 7) {
        this.logoClicks = 0;
        this.unlock();
      }
    }

    onUnlock(fn) { this.unlockedListeners.push(fn); }

    unlock(devmode) {
      this.unlockedListeners.forEach((fn) => fn(devmode));
    }
  }

  /* ====================================================================
   * 10. DEVELOPER MODE — system / FPS / memory / theme overlay
   * ================================================================== */
  class DeveloperMode {
    constructor(easterEggs, notify) {
      this.el = $('[data-devmode]');
      this.badge = $('[data-devmode-badge]');
      this.notify = notify;
      this.fpsEl = $('[data-devmode-fps]');
      this.fpsMeter = $('[data-devmode-fps-meter]');
      this.t0 = performance.now();
      this.frames = 0;
      this.fps = 0;
      this.enabled = false;
      this.open = false;
      this.rafId = 0;

      eastEggs.onUnlock(() => this.enable());
    }

    init() {
      if (!this.el) return;
      this.populateStatic();

      $('[data-devmode-close]')?.addEventListener('click', () => this.close());
      this.badge?.addEventListener('click', () => this.toggle());
      this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });

      // Restore a previously unlocked state.
      let flag = '0';
      try { flag = localStorage.getItem('anis_os_devmode') || '0'; } catch (e) { /* private mode */ }
      if (flag === '1') this.enable(false);

      this.startFpsLoop();
    }

    populateStatic() {
      const browser = this.detectBrowser();
      const viewport = `${window.innerWidth} × ${window.innerHeight} @ ${window.devicePixelRatio}x`;
      const memory = (typeof navigator.deviceMemory === 'number')
        ? `${navigator.deviceMemory} GB`
        : '—';

      const set = (sel, text) => {
        const node = $(sel);
        if (node) { Skeletons.hide(node); node.textContent = text; }
      };

      set('[data-devmode-browser]', `${browser.name} ${browser.version}`);
      set('[data-devmode-viewport]', viewport);
      set('[data-devmode-memory]', memory);
      set('[data-devmode-theme]', this.currentTheme());
      set('[data-devmode-uptime]', '0s');
      set('[data-devmode-fps]', '--');
    }

    detectBrowser() {
      const ua = navigator.userAgent;
      let name = 'Unknown';
      let version = '';
      const m = ua.match(/(Edg|Chrome|Firefox|Safari|OPR)\/([\d.]+)/);
      if (m) {
        const mapBrowser = { Edg: 'Edge', Chrome: 'Chrome', Firefox: 'Firefox', Safari: 'Safari', OPR: 'Opera' };
        name = mapBrowser[m[1]] || m[1];
        version = m[2].split('.')[0];
      }
      return { name, version };
    }

    currentTheme() {
      if (window.ANIS_OS_THEME?.getTheme) return window.ANIS_OS_THEME.getTheme();
      const cls = document.body.className.match(/theme--(\w+)/);
      return cls ? cls[1] : 'dark';
    }

    startFpsLoop() {
      const loop = () => {
        this.frames += 1;
        const elapsed = performance.now() - this.t0;
        if (elapsed >= 1000) {
          this.fps = Math.round((this.frames * 1000) / elapsed);
          this.frames = 0;
          this.t0 = performance.now();
          if (this.open) {
            if (this.fpsEl) this.fpsEl.textContent = this.fps;
            if (this.fpsMeter) {
              this.fpsMeter.textContent = this.fps >= 55 ? 'Smooth ✓' : 'Heavy load';
              toggleClass(this.fpsEl, 'is-live', this.fps >= 55);
              toggleClass(this.fpsEl, 'is-warn', this.fps < 55);
            }
          }
        }
        this.rafId = requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    enable(announce = true) {
      if (this.enabled) return;
      this.enabled = true;
      try { localStorage.setItem('anis_os_devmode', '1'); } catch (e) { /* ignore */ }
      if (this.badge) {
        toggleClass(this.badge, 'is-visible', true);
        this.badge.setAttribute('aria-hidden', 'false');
      }
      if (announce && this.notify) {
        this.notify('info', 'Developer Mode', 'Unlocked. Click the badge to inspect runtime data.', { duration: 5000 });
      }
    }

    open() {
      if (!this.el || this.open) return;
      this.open = true;
      this.populateStatic();
      toggleClass(this.el, 'is-open', true);
      addClass(document.documentElement, 'is-devmode-open');
      ANALYTICS.track('developer-mode', { action: 'open' });
    }

    close() {
      if (!this.open) return;
      this.open = false;
      toggleClass(this.el, 'is-open', false);
      removeClass(document.documentElement, 'is-devmode-open');
    }

    toggle() { this.open ? this.close() : this.open(); }
    isEnabled() { return this.enabled; }
  }

  /* ====================================================================
   * 09. COMMAND PALETTE — Ctrl+K search
   * ================================================================== */
  class CommandPalette {
    constructor(actions) {
      this.el = $('[data-palette]');
      this.input = $('[data-palette-input]');
      this.results = $('[data-palette-results]');
      this.actions = actions;
      this.index = [];
      this.activeIndex = 0;
      this.open = false;
    }

    init() {
      if (!this.el) return;
      this.el.addEventListener('mousedown', (e) => { if (e.target === this.el) this.close(); });
    }

    /** Build the flat search index (commands + dynamic DOM content). */
    buildIndex() {
      const list = [];

      // Navigation targets.
      const sections = [
        ['Home', '#hero', 'fa-house'],
        ['About', '#about', 'fa-user'],
        ['Experience', '#experience', 'fa-briefcase'],
        ['Skills', '#skills', 'fa-star'],
        ['AI Lab', '#ai-lab', 'fa-brain'],
        ['Projects', '#projects', 'fa-diagram-project'],
        ['Developer Dashboard', '#developer-dashboard', 'fa-gauge-high'],
        ['Roadmap', '#roadmap', 'fa-route'],
        ['Achievements', '#achievements', 'fa-trophy'],
        ['Recommendations', '#recommendations', 'fa-comments'],
        ['Knowledge Hub', '#knowledge-hub', 'fa-book-open'],
        ['Contact', '#contact', 'fa-envelope'],
      ];
      sections.forEach((s) => list.push({ type: 'goto', group: 'Navigate', label: s[0], target: s[1], icon: s[2] }));

      // Theme + actions.
      list.push({ type: 'theme', group: 'Theme', label: 'Toggle Theme', icon: 'fa-circle-half-stroke' });
      list.push({ type: 'theme', group: 'Theme', label: 'Switch to Light', theme: 'light', icon: 'fa-sun' });
      list.push({ type: 'theme', group: 'Theme', label: 'Switch to Dark', theme: 'dark', icon: 'fa-moon' });
      list.push({ type: 'devmode', group: 'Actions', label: 'Developer Mode', icon: 'fa-microchip' });
      list.push({ type: 'console', group: 'Actions', label: 'Open Developer Console', icon: 'fa-terminal' });
      list.push({ type: 'replay', group: 'Actions', label: 'Replay Boot', icon: 'fa-rotate-right' });
      list.push({ type: 'notify', group: 'Actions', label: 'Test Notification', icon: 'fa-bell' });
      list.push({ type: 'copy', group: 'Actions', label: 'Copy Email', icon: 'fa-copy' });

      // Social links (from real anchors when present).
      const socials = [
        ['GitHub', 'fa-brands fa-github', 'a[aria-label="GitHub profile"]'],
        ['LinkedIn', 'fa-brands fa-linkedin-in', 'a[aria-label="LinkedIn profile"]'],
        ['X / Twitter', 'fa-brands fa-x-twitter', 'a[aria-label="X / Twitter profile"]'],
        ['Dribbble', 'fa-brands fa-dribbble', 'a[aria-label="Dribbble profile"]'],
      ];
      socials.forEach((s) => {
        const anchor = $(s[2]);
        const href = anchor ? anchor.getAttribute('href') : null;
        list.push({ type: 'link', group: 'Social', label: s[0], href, icon: s[1] });
      });

      // Dynamic content — skills and projects, for real fuzzy search.
      $$('.skill-chip[data-skill]').forEach((chip) => {
        const name = chip.dataset.skill;
        if (name) list.push({ type: 'goto', group: 'Skills', label: name, target: '#skills', icon: 'fa-circle' });
      });
      $$('.projects-card__title').forEach((title) => {
        const name = title.textContent.trim();
        if (name) list.push({ type: 'goto', group: 'Projects', label: name, target: '#projects', icon: 'fa-diagram-project' });
      });

      this.index = list;
    }

    open() {
      if (this.open) return;
      this.buildIndex();
      this.open = true;
      toggleClass(this.el, 'is-open', true);
      addClass(document.documentElement, 'is-palette-open');
      this.render('');
      if (this.input) { this.input.value = ''; this.input.focus(); }
      if (engine.gsap && !engine.reduced && this.el) {
        engine.gsap.fromTo(this.el.querySelector('.palette__panel'),
          { y: -14, scale: 0.98, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' });
      }
    }

    close() {
      if (!this.open) return;
      this.open = false;
      toggleClass(this.el, 'is-open', false);
      removeClass(document.documentElement, 'is-palette-open');
      if (this.input) this.input.blur();
    }

    toggle() { this.open ? this.close() : this.open(); }

    render(query) {
      if (!this.results) return;
      const q = (query || '').trim().toLowerCase();
      const matches = q
        ? this.index.filter((i) => i.label.toLowerCase().includes(q))
        : this.index.filter((i) => i.group === 'Navigate' || i.group === 'Theme' || i.group === 'Actions');

      if (!matches.length) {
        this.results.innerHTML = '<div class="palette__empty">No matching commands</div>';
        this.activeIndex = 0;
        return;
      }

      // Sensible ordering: navigate → theme → actions → skills → projects → social.
      const order = { Navigate: 0, Theme: 1, Actions: 2, Skills: 3, Projects: 4, Social: 5 };
      matches.sort((a, b) => (order[a.group] ?? 9) - (order[b.group] ?? 9));

      const f = document.createDocumentFragment();
      let lastGroup = null;
      matches.forEach((item, idx) => {
        if (item.group !== lastGroup) {
          lastGroup = item.group;
          const g = document.createElement('div');
          g.className = 'palette__group';
          g.textContent = item.group;
          f.appendChild(g);
        }
        const row = document.createElement('div');
        row.className = 'palette__item' + (idx === this.activeIndex ? ' is-active' : '');
        row.setAttribute('role', 'option');
        row.dataset.index = idx;
        row.innerHTML =
          `<i class="fa-solid ${item.icon}" aria-hidden="true"></i>` +
          `<span>${this.escapeHtml(item.label)}</span>` +
          `<span class="palette__item-keys">↵</span>`;
        if (this.activeIndex === idx) row.setAttribute('aria-selected', 'true');
        row.addEventListener('mousemove', () => this.setActive(idx));
        row.addEventListener('click', () => this.execute(item));
        f.appendChild(row);
      });
      this.results.innerHTML = '';
      this.results.appendChild(f);
    }

    setActive(idx) {
      this.activeIndex = idx;
      $$('.palette__item', this.results).forEach((row, i) => {
        toggleClass(row, 'is-active', i === idx);
        if (i === idx) row.setAttribute('aria-selected', 'true');
        else row.removeAttribute('aria-selected');
      });
    }

    navigate(delta) {
      const rows = $$('.palette__item', this.results);
      if (!rows.length) return;
      const next = (this.activeIndex + delta + rows.length) % rows.length;
      this.setActive(next);
      rows[next].scrollIntoView({ block: 'nearest' });
    }

    selectActive() {
      const rows = $$('.palette__item', this.results);
      const activeRow = rows[this.activeIndex];
      if (!activeRow) return;
      const label = activeRow.querySelector('span')?.textContent || '';
      const found = this.index.find((i) => i.label === label);
      if (found) this.execute(found);
    }

    execute(item) {
      this.close();
      switch (item.type) {
        case 'goto': {
          const target = document.querySelector(item.target);
          if (target) scrollToTop(target.getBoundingClientRect().top + window.scrollY - 72);
          break;
        }
        case 'theme': {
          const t = window.ANIS_OS_THEME;
          if (t) {
            if (item.theme) t.setTheme(item.theme);
            else t.toggleTheme();
          }
          this.actions.notify('success', 'Theme', 'Theme updated');
          break;
        }
        case 'devmode':
          this.actions.devmode.open();
          break;
        case 'console': {
          const btn = $('[data-console-toggle]');
          if (btn) btn.click();
          break;
        }
        case 'replay':
          this.actions.replayBoot();
          break;
        case 'notify':
          this.actions.notify('info', 'Notification', 'Notifications are powered by the Interaction Engine.');
          break;
        case 'copy': {
          const text = 'hello@anis-os.dev';
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
              () => this.actions.notify('success', 'Copied', text),
              () => this.actions.notify('error', 'Copy failed', 'Clipboard unavailable')
            );
          } else {
            this.actions.notify('info', 'Copy', text);
          }
          break;
        }
        case 'link':
          if (item.href && item.href.startsWith('http')) {
            window.open(item.href, '_blank', 'noopener');
          } else {
            this.actions.notify('warning', item.label, 'Link placeholder — update the URL to enable this profile.');
          }
          break;
        default:
          break;
      }
    }

    escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));
    }
  }

  /* ====================================================================
   * 06. SCROLL REVEAL — data-rv variants
   * ================================================================== */
  class ScrollReveal {
    constructor() { this.io = null; }

    init() {
      if (engine.reduced) { this.revealAll(); return; }
      const els = $$('[data-rv]');
      if (!els.length) return;

      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.revealOne(entry.target);
              this.io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach((el) => this.io.observe(el));
      } else {
        els.forEach((el) => this.revealOne(el)); // graceful fallback
      }
      this.initTextReveal();
    }

    revealAll() { $$('[data-rv]').forEach((el) => el.style.opacity = '1'); }

    revealOne(el) {
      const kind = el.dataset.rv || 'fade';
      if (!engine.gsap) { el.style.opacity = '1'; return; }

      const delay = Number(el.dataset.rvDelay || 0);
      const from = { opacity: 0 };
      if (kind === 'slide') from.y = Number(el.dataset.rvY || 28);
      if (kind === 'scale') from.scale = 0.92;
      if (kind === 'rotate') from.rotation = 7;

      engine.gsap.fromTo(el, from, {
        opacity: 1, y: 0, scale: 1, rotation: 0,
        duration: 0.7, ease: 'power3.out', delay, overwrite: true,
      });
    }

    initTextReveal() {
      if (!engine.gsap) return;
      $$('[data-rv-text]').forEach((el) => {
        if (el.dataset.rvSplit) return;
        el.dataset.rvSplit = '1';
        const text = el.textContent.trim();
        if (!text) return;
        el.setAttribute('aria-label', text);
        const words = text.split(/\s+/);
        el.textContent = '';
        const wrap = document.createElement('span');
        wrap.setAttribute('aria-hidden', 'true');
        el.appendChild(wrap);
        words.forEach((word, i) => {
          const w = document.createElement('span');
          w.className = 'rv-word';
          w.textContent = word + (i < words.length - 1 ? '\u00A0' : '');
          w.style.display = 'inline-block';
          w.style.opacity = '0';
          w.style.transform = 'translateY(0.5em)';
          wrap.appendChild(w);
        });
        const trigger = () => {
          const words = $$('.rv-word', wrap);
          engine.gsap.to(words, {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.035, ease: 'power3.out',
          });
          window.removeEventListener('rvTrigger', trigger);
        };
        window.addEventListener('rvTrigger', trigger, { once: true });
        setTimeout(trigger, 200);
      });
    }
  }

  /* ====================================================================
   * 07. CARD FX — glass reflection sweep
   * ================================================================== */
  class CardFX {
    init() {
      if (engine.reduced) return;
      const targets = $$('[data-tilt], [data-reflect]');
      if (!targets.length) return;

      targets.forEach((card) => {
        // Glass reflection overlay injected once per card.
        const glare = document.createElement('span');
        glare.className = 'glass-reflect';
        glare.setAttribute('aria-hidden', 'true');
        card.appendChild(glare);
        card._glare = glare;

        card.addEventListener('mouseenter', () => toggleClass(glare, 'is-on', true), { passive: true });
        card.addEventListener('mouseleave', () => toggleClass(glare, 'is-on', false), { passive: true });
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          glare.style.setProperty('--gx', `${e.clientX - rect.left}px`);
          glare.style.setProperty('--gy', `${e.clientY - rect.top}px`);
        }, { passive: true });
      });
    }
  }

  /* ====================================================================
   * 08. BUTTON FX — elastic press + demo the load/success state machine
   * ================================================================== */
  class ButtonFX {
    init() {
      if (engine.reduced) return;
      document.addEventListener('mousedown', (e) => {
        const btn = e.target.closest &&
          e.target.closest('.btn-glow, .btn-premium, .btn-outline-light, .btn-primary, .btn-secondary');
        // Skip magnetic buttons (they set their own transforms).
        if (btn && !btn.hasAttribute('data-magnetic')) {
          addClass(btn, 'js-press');
          addClass(btn, 'is-pressed');
        }
      }, { passive: true });

      document.addEventListener('mouseup', () => {
        $$('.js-press.is-pressed').forEach((b) => removeClass(b, 'is-pressed'));
      }, { passive: true });
      document.addEventListener('mouseleave', () => {
        $$('.js-press.is-pressed').forEach((b) => removeClass(b, 'is-pressed'));
      }, { passive: true });

      // Opt-in loading → success demo via [data-load-state].
      document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('[data-load-state]');
        if (!btn || btn.dataset.busy) return;
        btn.dataset.busy = '1';
        let label = $('.btn-morph__label', btn);
        if (!label) {
          label = document.createElement('span');
          label.className = 'btn-morph__label';
          label.textContent = btn.textContent.trim();
          btn.textContent = '';
          btn.appendChild(label);
        }
        addClass(btn, 'btn-morph');
        addClass(btn, 'is-loading');
        setTimeout(() => {
          removeClass(btn, 'is-loading');
          addClass(btn, 'is-success');
          label.textContent = '✓ Done';
          setTimeout(() => {
            removeClass(btn, 'is-success');
            delete btn.dataset.busy;
          }, 1600);
        }, 1200);
      }, { passive: true });
    }
  }

  /* ====================================================================
   * 12. PAGE TRANSITION — cinematic entry + navigation pulse
   * ================================================================== */
  class PageTransition {
    constructor() { this.el = $('[data-page-transition]'); }

    init() {
      if (!this.el) return;
      this.playEntrance();
    }

    /** Blur / scale / fade reveal once the boot overlay is gone. */
    playEntrance() {
      const run = () => {
        if (!engine.gsap) {
          addClass(this.el, 'is-active');
          const bar = $('[data-page-transition-bar]', this.el);
          if (bar) bar.style.width = '100%';
          setTimeout(() => {
            removeClass(this.el, 'is-active');
            addClass(document.documentElement, 'is-revealed');
          }, 700);
          return;
        }

        const core = $('.page-transition__core', this.el);
        const bar = $('[data-page-transition-bar]', this.el);
        if (bar) bar.style.width = '100%';

        const tl = engine.gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.set(this.el, { opacity: 1, visibility: 'visible' })
          .fromTo(this.el, { scale: 1.04, filter: 'blur(10px)' },
            { scale: 1, filter: 'blur(0px)', duration: 0.7 })
          .fromTo(core, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
          .to(core, { opacity: 0, y: -14, duration: 0.35, delay: 0.15 })
          .to(this.el, { opacity: 0, visibility: 'hidden', scale: 0.99, filter: 'blur(4px)',
            duration: 0.45, onComplete: () => addClass(document.documentElement, 'is-revealed') }, '+=0.05');
      };

      // Wait for the boot overlay to clear so the two never overlap visibly.
      const loader = $('#loader');
      if (!loader || hasClass(loader, 'is-hidden') || !loader.isConnected) {
        run();
        return;
      }
      const poll = () => {
        if (hasClass(loader, 'is-hidden') || !loader.isConnected) { run(); return; }
        requestAnimationFrame(poll);
      };
      setTimeout(poll, 800);
    }

    /** Optional quick veil for section navigation. */
    pulse() {
      if (!this.el || engine.reduced || !engine.gsap) return;
      engine.gsap.fromTo(this.el,
        { opacity: 0, visibility: 'visible' },
        { opacity: 0.9, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    }
  }

  /* ====================================================================
   * 05b. SHORTCUTS — central keyboard coordinator
   * ================================================================== */
  class Shortcuts {
    constructor(handlers) { this.h = handlers; }

    init() {
      document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

        // Ctrl/Cmd + K → command palette (works even while typing a search).
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k')) {
          e.preventDefault();
          this.h.paletteToggle();
          return;
        }

        // Ctrl+Shift+B → replay the boot sequence.
        if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'b')) {
          e.preventDefault();
          this.h.replayBoot();
          return;
        }

        // Shift+T → toggle theme (the theme engine owns Ctrl+Shift+T / Alt+T).
        if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.key.toLowerCase() === 't')) {
          e.preventDefault();
          this.h.toggleTheme();
          return;
        }

        // ESC → close layered overlays (palette → devmode).
        if (e.key === 'Escape') {
          if (this.h.paletteIsOpen()) { e.preventDefault(); this.h.paletteClose(); return; }
          if (this.h.devmodeIsOpen()) { e.preventDefault(); this.h.devmodeClose(); return; }
        }

        // Palette navigation while it is open (even when the input is focused).
        if (this.h.paletteIsOpen() && !typing) {
          if (e.key === 'ArrowDown') { e.preventDefault(); this.h.paletteNav(1); return; }
          if (e.key === 'ArrowUp') { e.preventDefault(); this.h.paletteNav(-1); return; }
          if (e.key === 'Enter') { e.preventDefault(); this.h.paletteSelect(); return; }
        }
      }, true);
    }
  }

  /* ====================================================================
   * 16. BOOT — wire everything, then expose a public API
   * ================================================================== */
  function boot() {
    const stack = $('[data-toast-stack]');
    const notify = new Notifications(stack);
    const mouseGlow = new MouseGlow($('[data-mouse-glow]'));
    const smoothScroll = new SmoothScroll();
    const scrollProgress = new ScrollProgress($('[data-scroll-ring]'), $('[data-scroll-pct]'));
    const cursorFX = new CursorFX();
    const scrollReveal = new ScrollReveal();
    const cardFX = new CardFX();
    const buttonFX = new ButtonFX();
    const easterEggs = new EasterEggs();
    const devmode = new DeveloperMode(easterEggs, (type, title, msg, opts) => notify.notify(type, title, msg, opts));

    const replayBoot = () => {
      try { localStorage.removeItem('anis_os_boot_completed'); } catch (e) { /* ignore */ }
      ANALYTICS.track('replay-boot');
      window.location.reload();
    };

    const palette = new CommandPalette({ notify, devmode, replayBoot });

    const pageTransition = new PageTransition();
    const shortcuts = new Shortcuts({
      paletteToggle: () => palette.toggle(),
      paletteClose: () => palette.close(),
      paletteIsOpen: () => palette.open,
      paletteNav: (d) => palette.navigate(d),
      paletteSelect: () => palette.selectActive(),
      replayBoot,
      toggleTheme: () => {
        if (window.ANIS_OS_THEME) {
          const t = window.ANIS_OS_THEME.toggleTheme();
          notify.notify('info', 'Theme', `Switched to ${t || ''}`);
        }
      },
      devmodeIsOpen: () => devmode.open,
      devmodeClose: () => devmode.close(),
    });

    // Initialise (order is deliberate: scroll infra → visual layers → overlays).
    smoothScroll.init();
    scrollProgress.init();
    mouseGlow.init();
    cursorFX.init();
    scrollReveal.init();
    cardFX.init();
    buttonFX.init();
    easterEggs.init();
    devmode.init();
    palette.init();
    pageTransition.init();
    shortcuts.init();

    // Bind the palette input to live search.
    const paletteInput = $('[data-palette-input]');
    if (paletteInput) {
      paletteInput.addEventListener('input', () => palette.render(paletteInput.value));
    }

    // Micro-interaction: reveal the mouse glow once scrolling matters.
    const revealHook = debounce(() => ANALYTICS.track('scroll', { y: window.scrollY }), 400);
    window.addEventListener('scroll', revealHook, { passive: true });

    /* ---------- Public API ---------- */
    window.ANIS_OS_INTERACTIONS = Object.freeze({
      version: '1.0.0',
      notify: (type, title, message, opts) => notify.notify(type, title, message, opts),
      openPalette: () => palette.open(),
      closePalette: () => palette.close(),
      togglePalette: () => palette.toggle(),
      openDeveloperMode: () => devmode.open(),
      closeDeveloperMode: () => devmode.close(),
      developerModeEnabled: () => devmode.isEnabled(),
      scrollTo: (top) => scrollToTop(top),
      smoothScroll: smoothScroll.instance,
      analytics: ANALYTICS,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window, document);