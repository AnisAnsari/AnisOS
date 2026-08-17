/**
 * ============================================================================
 *  ANIS OS — THEME ENGINE (theme.js)
 * ============================================================================
 *  Project    : ANIS OS — Ultra-Premium Futuristic Portfolio
 *  Author     : Anis Ansari
 *  Version    : 1.0.0
 *  File       : assets/js/theme.js
 *  Stack      : Vanilla JavaScript (ES6+) | Bootstrap 5 | CSS Variables
 *
 *  Objective  : A macOS / Raycast / Vercel-grade theme system that only ever
 *               mutates *root CSS custom properties*. No direct style
 *               manipulation for theming — everything flows through tokens.
 *
 *  ARCHITECTURE
 *  ──────────────────────────────────────────────────────────────────────────
 *  ThemeStorage    — localStorage persistence for theme id + mode
 *  ThemeAnimations — 400ms fade / scale / glass / color transitions
 *  ThemeEvents     — CustomEvent bus (loaded / changed / saved / reset / preview)
 *  ThemeEngine     — Orchestrator: apply, toggle, preview, panel, shortcuts
 *
 *  FEATURES
 *  ──────────────────────────────────────────────────────────────────────────
 *  • 7 themes  : dark, light, cyberpunk, ocean, purple, glass, midnight
 *  • 3 modes   : auto (follows OS), light, dark
 *  • Persistence via LocalStorage (remembered after refresh)
 *  • System theme detection through window.matchMedia('prefers-color-scheme')
 *  • Live hover preview + commit / cancel
 *  • Keyboard : Ctrl+Shift+T opens panel · Alt+T toggles theme
 *  • Accessibility: reduced-motion respected, WCAG-grade contrast palettes
 *  • Performance: rAF-batched variable writes, debounced media listeners
 * ============================================================================
 */
'use strict';

(function (window, document) {
  'use strict';

  /* ====================================================================
   * 01. CONSTANTS & HELPERS
   * ================================================================== */

  const STORAGE_KEYS = Object.freeze({
    theme: 'anis-os-theme',
    mode: 'anis-os-theme-mode',
  });

  /** Transition cadence for theme swaps */
  const TRANSITION_DURATION = 400; // ms

  /** Event name builder — keeps the CustomEvent namespace consistent */
  const EVENT = (name) => `anis:theme-${name}`;

  /** Quick, dependency-free query helpers */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /** Respect users who prefer reduced motion */
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Debounce — delay execution until input pauses */
  function debounce(fn, wait = 150) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Convert a hex color (#RRGGBB) to an "r, g, b" triplet string.
   * Enables building rgba() token values from theme palette entries.
   */
  function hexToRgbTriplet(hex) {
    const value = hex.replace('#', '');
    const expanded = value.length === 3
      ? value.split('').map((c) => c + c).join('')
      : value;
    const parsed = parseInt(expanded, 16);
    const r = (parsed >> 16) & 255;
    const g = (parsed >> 8) & 255;
    const b = parsed & 255;
    return `${r}, ${g}, ${b}`;
  }

  /** Escape nothing — these are trusted strings built by us only. */

  /* ====================================================================
   * 02. THEME PALETTES — Token definitions for all 7 themes
   * ================================================================== */

  /**
   * Every theme maps semantic tokens → concrete values. The engine copies
   * these onto :root as CSS custom properties. "Surface" is the raised
   * background (--color-background-soft); "Card" is --color-card.
   */
  const THEMES = Object.freeze({
    dark: {
      label: 'Dark',
      swatch: '#4F46E5',
      primary: '#4F46E5',
      secondary: '#06B6D4',
      accent: '#8B5CF6',
      background: '#050816',
      surface: '#0B1120',
      card: 'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.10)',
      text: '#FFFFFF',
      textSecondary: '#94A3B8',
      textInverse: '#0B1120',
      shadowColor: '0, 0, 0',
      insetGlass: 'rgba(255, 255, 255, 0.10)',
      gradientBrand: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 50%, #8B5CF6 100%)',
      gradientPrimary: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)',
      gradientSecondary: 'linear-gradient(135deg, #06B6D4 0%, #4F46E5 100%)',
      gradientAccent: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
      gradientText: 'linear-gradient(90deg, #4F46E5 0%, #06B6D4 50%, #8B5CF6 100%)',
    },

    light: {
      label: 'Light',
      swatch: '#F8FAFC',
      primary: '#4F46E5',
      secondary: '#0891B2', // deepened for AA contrast on white
      accent: '#7C3AED',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: 'rgba(15, 23, 42, 0.04)',
      border: 'rgba(15, 23, 42, 0.10)',
      text: '#0F172A',
      textSecondary: '#475569',
      textInverse: '#FFFFFF',
      shadowColor: '15, 23, 42',
      insetGlass: 'rgba(255, 255, 255, 0.70)',
      gradientBrand: 'linear-gradient(135deg, #4F46E5 0%, #0891B2 50%, #7C3AED 100%)',
      gradientPrimary: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      gradientSecondary: 'linear-gradient(135deg, #0891B2 0%, #4F46E5 100%)',
      gradientAccent: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
      gradientText: 'linear-gradient(90deg, #4F46E5 0%, #0891B2 50%, #7C3AED 100%)',
    },

    cyberpunk: {
      label: 'Cyberpunk',
      swatch: '#00E5FF',
      primary: '#00E5FF',
      secondary: '#FF00A0',
      accent: '#FFE600',
      background: '#0A0E1A',
      surface: '#131B2F',
      card: 'rgba(0, 229, 255, 0.06)',
      border: 'rgba(0, 229, 255, 0.18)',
      text: '#EAF7FF',
      textSecondary: '#93A6C4',
      textInverse: '#0A0E1A',
      shadowColor: '0, 229, 255',
      insetGlass: 'rgba(255, 255, 255, 0.12)',
      gradientBrand: 'linear-gradient(135deg, #00E5FF 0%, #FF00A0 50%, #FFE600 100%)',
      gradientPrimary: 'linear-gradient(135deg, #00E5FF 0%, #FF00A0 100%)',
      gradientSecondary: 'linear-gradient(135deg, #FF00A0 0%, #00E5FF 100%)',
      gradientAccent: 'linear-gradient(135deg, #FFE600 0%, #00E5FF 100%)',
      gradientText: 'linear-gradient(90deg, #00E5FF 0%, #FF00A0 50%, #FFE600 100%)',
    },

    ocean: {
      label: 'Ocean',
      swatch: '#0EA5E9',
      primary: '#0EA5E9',
      secondary: '#14B8A6',
      accent: '#22D3EE',
      background: '#031421',
      surface: '#062532',
      card: 'rgba(14, 165, 233, 0.07)',
      border: 'rgba(14, 165, 233, 0.16)',
      text: '#E6F8FF',
      textSecondary: '#8FB9C9',
      textInverse: '#031421',
      shadowColor: '14, 165, 233',
      insetGlass: 'rgba(255, 255, 255, 0.10)',
      gradientBrand: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 50%, #22D3EE 100%)',
      gradientPrimary: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)',
      gradientSecondary: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
      gradientAccent: 'linear-gradient(135deg, #22D3EE 0%, #14B8A6 100%)',
      gradientText: 'linear-gradient(90deg, #0EA5E9 0%, #14B8A6 50%, #22D3EE 100%)',
    },

    purple: {
      label: 'Purple',
      swatch: '#8B5CF6',
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      accent: '#C084FC',
      background: '#0B0618',
      surface: '#150C28',
      card: 'rgba(139, 92, 246, 0.07)',
      border: 'rgba(139, 92, 246, 0.18)',
      text: '#F4EEFF',
      textSecondary: '#B8A6DB',
      textInverse: '#0B0618',
      shadowColor: '139, 92, 246',
      insetGlass: 'rgba(255, 255, 255, 0.10)',
      gradientBrand: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C084FC 100%)',
      gradientPrimary: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      gradientSecondary: 'linear-gradient(135deg, #A78BFA 0%, #6D28D9 100%)',
      gradientAccent: 'linear-gradient(135deg, #C084FC 0%, #8B5CF6 100%)',
      gradientText: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 50%, #C084FC 100%)',
    },

    glass: {
      label: 'Glass',
      swatch: '#38BDF8',
      primary: '#38BDF8',
      secondary: '#A5F3FC',
      accent: '#818CF8',
      background: 'linear-gradient(160deg, #0B1124 0%, #1E1B3A 50%, #0A1122 100%)',
      surface: 'rgba(255, 255, 255, 0.06)',
      card: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.22)',
      text: '#F8FAFF',
      textSecondary: '#B9C6E8',
      textInverse: '#0B1124',
      shadowColor: '56, 189, 248',
      insetGlass: 'rgba(255, 255, 255, 0.14)',
      gradientBrand: 'linear-gradient(135deg, #38BDF8 0%, #A5F3FC 50%, #818CF8 100%)',
      gradientPrimary: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
      gradientSecondary: 'linear-gradient(135deg, #A5F3FC 0%, #38BDF8 100%)',
      gradientAccent: 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)',
      gradientText: 'linear-gradient(90deg, #38BDF8 0%, #A5F3FC 50%, #818CF8 100%)',
    },

    midnight: {
      label: 'Midnight',
      swatch: '#6366F1',
      primary: '#6366F1',
      secondary: '#818CF8',
      accent: '#4F46E5',
      background: '#070B18',
      surface: '#101735',
      card: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.16)',
      text: '#EEF1FF',
      textSecondary: '#A3B0E0',
      textInverse: '#070B18',
      shadowColor: '99, 102, 241',
      insetGlass: 'rgba(255, 255, 255, 0.10)',
      gradientBrand: 'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #4F46E5 100%)',
      gradientPrimary: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      gradientSecondary: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
      gradientAccent: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
      gradientText: 'linear-gradient(90deg, #6366F1 0%, #818CF8 50%, #4F46E5 100%)',
    },
  });

  /** Ordered metadata used to render the panel & validate theme ids */
  const THEME_ORDER = Object.freeze([
    'dark', 'light', 'cyberpunk', 'ocean', 'purple', 'glass', 'midnight',
  ]);

  const MODES = Object.freeze(['auto', 'light', 'dark']);

  /* ====================================================================
   * 03. THEME STORAGE — LocalStorage persistence layer
   * ================================================================== */
  class ThemeStorage {
    /**
     * @param {string} key    — localStorage key for the theme id
     * @param {string} modeKey— localStorage key for the color mode
     */
    constructor(key = STORAGE_KEYS.theme, modeKey = STORAGE_KEYS.mode) {
      this.key = key;
      this.modeKey = modeKey;
    }

    /** Read the persisted theme id (null-safe for private modes) */
    get() {
      try {
        return window.localStorage.getItem(this.key);
      } catch (_) {
        return null;
      }
    }

    /** Persist a theme id */
    set(themeId) {
      try {
        window.localStorage.setItem(this.key, themeId);
        return true;
      } catch (_) {
        return false;
      }
    }

    /** Read the persisted mode */
    getMode() {
      try {
        return window.localStorage.getItem(this.modeKey);
      } catch (_) {
        return null;
      }
    }

    /** Persist a mode */
    setMode(mode) {
      try {
        window.localStorage.setItem(this.modeKey, mode);
        return true;
      } catch (_) {
        return false;
      }
    }

    /** Clear persisted theme + mode */
    clear() {
      try {
        window.localStorage.removeItem(this.key);
        window.localStorage.removeItem(this.modeKey);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  /* ====================================================================
   * 04. THEME ANIMATIONS — 400ms transition choreography
   * ================================================================== */
  class ThemeAnimations {
    /**
     * Applies a short, tasteful transition class then swaps variables.
     * The class adds a CSS transition + backdrop-filter ramp; removal
     * happens after TRANSITION_DURATION (or instantly for reduced motion).
     */
    constructor(duration = TRANSITION_DURATION) {
      this.duration = duration;
      this.activeClass = 'theme-transitioning';
      this.timer = null;
    }

    get reduced() {
      return prefersReducedMotion();
    }

    /** Add the transition class and force a synchronous reflow */
    begin() {
      if (this.reduced) return false;
      document.body.classList.add(this.activeClass);
      void document.body.offsetWidth; // flush styles so the transition applies
      return true;
    }

    /**
     * Wrap a variable-writing operation with the full transition lifecycle.
     *
     * @param {Function} apply — synchronous closure that mutates CSS vars
     * @param {string}   type  — 'color' | 'fade' | 'scale' | 'glass'
     * @returns {Promise<void>} resolves when the transition completes
     */
    run(apply, type = 'color') {
      if (this.reduced) {
        apply();
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        this.begin();
        document.body.classList.add(`theme-transition-${type}`);

        // Double rAF: paint the transition start, then apply the tokens
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            apply();
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
              document.body.classList.remove(
                this.activeClass,
                `theme-transition-${type}`,
              );
              resolve();
            }, this.duration);
          });
        });
      });
    }
  }

  /* ====================================================================
   * 05. THEME EVENTS — CustomEvent bus
   * ================================================================== */
  class ThemeEvents {
    constructor() {
      this.target = document;
    }

    /**
     * Emit a namespaced theme event.
     * Names: loaded | changed | saved | reset | preview
     */
    emit(name, detail = {}) {
      this.target.dispatchEvent(
        new CustomEvent(EVENT(name), { detail, bubbles: true, cancelable: false }),
      );
      return this;
    }

    /** Subscribe to a theme event */
    on(name, handler) {
      this.target.addEventListener(EVENT(name), handler);
      return this;
    }

    /** Unsubscribe from a theme event */
    off(name, handler) {
      this.target.removeEventListener(EVENT(name), handler);
      return this;
    }
  }

  /* ====================================================================
   * 06. THEME ENGINE — Orchestrator
   * ================================================================== */
  class ThemeEngine {
    constructor(options = {}) {
      this.storage = options.storage || new ThemeStorage();
      this.events = options.events || new ThemeEvents();
      this.animations = options.animations || new ThemeAnimations();

      this.themes = THEMES;
      this.order = THEME_ORDER;
      this.modes = MODES;
      this.defaultTheme = 'dark';
      this.defaultMode = 'auto';

      this.themeId = null;       // persisted selection (or default)
      this.mode = null;          // 'auto' | 'light' | 'dark'
      this.resolvedTheme = null; // theme actually applied right now

      this.panel = null;         // built lazily on init
      this.previewState = null;  // { themeId, mode } snapshot during preview
      this.mediaQuery = null;    // matchMedia handle for system theme

      // Bound handlers (kept for clean add/removeEventListener symmetry)
      this._onSystemThemeChange = debounce(() => this.handleSystemThemeChange(), 120);
      this._onKeyDown = (event) => this.handleKeyDown(event);
      this._onDocClick = (event) => this.handleOutsideClick(event);
    }

    /* ---------------- Lifecycle ---------------- */

    /** Boot the engine: restore, wire UI, register listeners */
    init() {
      this.restore();
      this.resolveSystemTheme();
      this.buildPanel();
      this.bindToggle();
      this.watchSystemTheme();

      // Apply tokens after DOM is painted to avoid a flash of unthemed content
      window.requestAnimationFrame(() => {
        this.applyTheme(this.resolvedTheme, { animate: false });
        this.refreshPanel();
        this.events.emit('loaded', { theme: this.resolvedTheme, mode: this.mode });
        this.log('ANIS OS Theme Engine Loaded');
      });

      return this;
    }

    /* ---------------- State & persistence ---------------- */

    /** Load persisted values or fall back to defaults */
    restore() {
      this.mode = this.storage.getMode() || this.defaultMode;
      if (!this.modes.includes(this.mode)) this.mode = this.defaultMode;

      this.themeId = this.storage.get();
      if (!this.isValidTheme(this.themeId)) this.themeId = this.defaultTheme;
    }

    /** Decide the actual theme to render based on mode + system pref */
    resolveSystemTheme() {
      if (this.mode === 'auto') {
        this.resolvedTheme = this.detectSystemTheme();
      } else {
        this.resolvedTheme = this.mode; // 'light' | 'dark'
      }
      return this.resolvedTheme;
    }

    /** Detect OS color-scheme (defaults to dark when unsupported) */
    detectSystemTheme() {
      if (this.mediaQuery) return this.mediaQuery.matches ? 'light' : 'dark';
      if (window.matchMedia) {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        return this.mediaQuery.matches ? 'light' : 'dark';
      }
      return 'dark';
    }

    /** Follow the OS in auto mode */
    watchSystemTheme() {
      if (!window.matchMedia || !this.mediaQuery) return;
      const mq = this.mediaQuery;
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', this._onSystemThemeChange);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(this._onSystemThemeChange); // legacy Safari
      }
    }

    /** Re-resolve when the OS flips dark/light while in auto mode */
    handleSystemThemeChange() {
      if (this.mode !== 'auto') return;
      const next = this.detectSystemTheme();
      if (next === this.resolvedTheme) return;
      this.resolvedTheme = next;
      this.applyTheme(next);
      this.refreshPanel();
      this.events.emit('changed', { theme: next, mode: 'auto', source: 'system' });
    }

    /* ---------------- Public API ---------------- */

    /**
     * Apply a theme by id, persisting it unless disabled.
     * @param {string} id
     * @param {object} [opts] { persist = true, animate = true }
     */
    setTheme(id, opts = {}) {
      const { persist = true, animate = true } = opts;
      if (!this.isValidTheme(id)) return false;

      // Persisted selection becomes concrete — leave auto mode behind
      if (this.mode === 'auto' && persist) {
        this.mode = id === 'light' || id === 'dark' ? id : 'dark';
        this.storage.setMode(this.mode);
      }
      this.themeId = id;
      this.resolvedTheme = id;

      if (persist) {
        this.storage.set(id);
        this.events.emit('saved', { theme: id });
      }

      this.applyTheme(id, { animate });
      this.refreshPanel();
      this.events.emit('changed', { theme: id, mode: this.mode, source: 'manual' });
      return true;
    }

    /** Currently resolved (applied) theme id */
    getTheme() {
      return this.resolvedTheme;
    }

    /** Toggle between dark and light, resolving auto first */
    toggleTheme() {
      if (this.mode === 'auto') {
        this.setMode(this.resolvedTheme === 'dark' ? 'light' : 'dark');
        return this.getTheme();
      }
      const next = this.resolvedTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      return next;
    }

    /** Remove persistence and return to the documented defaults */
    resetTheme() {
      this.storage.clear();
      this.mode = this.defaultMode;
      this.themeId = this.defaultTheme;
      this.resolveSystemTheme();
      this.applyTheme(this.resolvedTheme);
      this.refreshPanel();
      this.events.emit('reset', {
        theme: this.resolvedTheme,
        mode: this.mode,
      });
      return this.getTheme();
    }

    /** Set color mode: 'auto' | 'light' | 'dark' */
    setMode(mode) {
      if (!this.modes.includes(mode)) return false;
      this.mode = mode;
      this.storage.setMode(mode);
      this.resolveSystemTheme();

      // In auto, the OS decides the rendered theme; otherwise mode == theme
      if (mode !== 'auto') this.themeId = mode;

      this.applyTheme(this.resolvedTheme);
      this.refreshPanel();
      this.events.emit('changed', { theme: this.resolvedTheme, mode });
      return true;
    }

    getMode() {
      return this.mode;
    }

    /* ---------------- Preview (hover-to-try) ---------------- */

    /** Snapshot + temporarily apply a theme without persisting */
    previewTheme(id) {
      if (!this.isValidTheme(id) || id === this.resolvedTheme) return;
      this.previewState = {
        themeId: this.themeId,
        mode: this.mode,
        resolved: this.resolvedTheme,
      };
      this.applyTheme(id, { animate: true });
      this.refreshPanel();
      this.events.emit('preview', { theme: id, previewing: true });
    }

    /** Restore the pre-preview snapshot */
    cancelPreview() {
      if (!this.previewState) return;
      const { themeId, mode, resolved } = this.previewState;
      this.themeId = themeId;
      this.mode = mode;
      this.resolvedTheme = resolved;
      this.previewState = null;
      this.applyTheme(resolved, { animate: true });
      this.refreshPanel();
      this.events.emit('preview', { theme: resolved, previewing: false });
    }

    /** Commit a preview into a persisted selection */
    applyPreview(id) {
      this.previewState = null;
      this.setTheme(id);
      return this.getTheme();
    }

    /* ---------------- Variable application ---------------- */

    /**
     * Copy every token of the chosen theme onto the root element as CSS
     * custom properties. This is the ONLY place styles are touched.
     */
    applyTheme(id, { animate = true } = {}) {
      if (!this.isValidTheme(id)) id = this.defaultTheme;
      const theme = this.themes[id];

      const paint = () => {
        const root = document.documentElement;

        // Core palette
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-secondary', theme.secondary);
        root.style.setProperty('--color-accent', theme.accent);
        root.style.setProperty('--color-background', theme.background);
        root.style.setProperty('--color-background-soft', theme.surface);
        root.style.setProperty('--color-card', theme.card);
        root.style.setProperty('--color-card-strong', theme.card === 'rgba(255, 255, 255, 0.06)' ? 'rgba(255, 255, 255, 0.10)' : theme.border);
        root.style.setProperty('--color-border', theme.border);
        root.style.setProperty('--color-border-strong', theme.border === 'rgba(255, 255, 255, 0.10)' ? 'rgba(255, 255, 255, 0.18)' : theme.border);

        // Text tokens
        root.style.setProperty('--text-primary', theme.text);
        root.style.setProperty('--text-secondary', theme.textSecondary);
        root.style.setProperty('--text-inverse', theme.textInverse);

        // Soft alpha variants derived from the palette
        root.style.setProperty('--color-primary-soft', `rgba(${hexToRgbTriplet(theme.primary)}, 0.35)`);
        root.style.setProperty('--color-secondary-soft', `rgba(${hexToRgbTriplet(theme.secondary)}, 0.35)`);
        root.style.setProperty('--color-accent-soft', `rgba(${hexToRgbTriplet(theme.accent)}, 0.35)`);

        // Gradients
        root.style.setProperty('--gradient-brand', theme.gradientBrand);
        root.style.setProperty('--gradient-primary', theme.gradientPrimary);
        root.style.setProperty('--gradient-secondary', theme.gradientSecondary);
        root.style.setProperty('--gradient-accent', theme.gradientAccent);
        root.style.setProperty('--gradient-text', theme.gradientText);

        // Shadows (built from palette)
        const [r, g, b] = theme.shadowColor.split(',').map((v) => v.trim());
        root.style.setProperty('--shadow-sm', `0 4px 12px rgba(${r}, ${g}, ${b}, 0.35)`);
        root.style.setProperty('--shadow-md', `0 8px 24px rgba(${r}, ${g}, ${b}, 0.45)`);
        root.style.setProperty('--shadow-lg', `0 16px 48px rgba(${r}, ${g}, ${b}, 0.55)`);
        root.style.setProperty('--shadow-xl', `0 32px 80px rgba(${r}, ${g}, ${b}, 0.65)`);
        root.style.setProperty('--shadow-glow', `0 0 24px rgba(${r}, ${g}, ${b}, 0.35), 0 0 64px rgba(${r}, ${g}, ${b}, 0.15)`);
        root.style.setProperty('--shadow-glow-accent', `0 0 24px rgba(${hexToRgbTriplet(theme.accent)}, 0.35), 0 0 64px rgba(${hexToRgbTriplet(theme.accent)}, 0.18)`);
        root.style.setProperty('--shadow-glow-secondary', `0 0 24px rgba(${hexToRgbTriplet(theme.secondary)}, 0.35), 0 0 64px rgba(${hexToRgbTriplet(theme.secondary)}, 0.16)`);
        root.style.setProperty('--shadow-inset-glass', `inset 0 1px 0 ${theme.insetGlass}`);

        // Selection + scrollbar tokens (consumed by style.css / future css)
        root.style.setProperty('--selection-bg', theme.primary);
        root.style.setProperty('--selection-color', theme.textInverse);
        root.style.setProperty('--scrollbar-track', theme.background);
        root.style.setProperty('--scrollbar-thumb', theme.primary);
        root.style.setProperty('--scrollbar-thumb-hover', theme.accent);

        // State hooks for CSS selectors
        root.dataset.theme = id;
        document.body.dataset.theme = id;
        document.body.dataset.themeMode = this.mode;

        // Per-theme body classes (designers may style `body.theme--cyberpunk`)
        THEME_ORDER.forEach((t) => document.body.classList.toggle(`theme--${t}`, t === id));
      };

      if (animate) {
        this.animations.run(paint, 'color');
      } else {
        paint();
      }
    }

    /* ---------------- Panel UI ---------------- */

    /** Locate the switcher, build panel markup + embedded style sheet */
    buildPanel() {
      const mount = $('[data-theme-toggle]')?.closest('.theme-switcher');
      if (!mount) return;

      this.injectPanelStyles();
      this.panel = document.createElement('div');
      this.panel.className = 'theme-panel';
      this.panel.setAttribute('data-theme-panel', '');
      this.panel.setAttribute('role', 'dialog');
      this.panel.setAttribute('aria-modal', 'true');
      this.panel.setAttribute('aria-label', 'Theme settings');
      this.panel.hidden = true;
      this.panel.innerHTML = this.renderPanelMarkup();
      mount.appendChild(this.panel);

      this.bindPanel();
    }

    /** Scoped style block for the panel — driven entirely by CSS variables */
    injectPanelStyles() {
      if ($('#anis-theme-panel-styles')) return;
      const style = document.createElement('style');
      style.id = 'anis-theme-panel-styles';
      style.textContent = `
        .theme-panel {
          position: absolute;
          right: 0;
          bottom: calc(100% + 12px);
          width: 288px;
          padding: 16px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--color-background) 82%, transparent);
          -webkit-backdrop-filter: blur(24px);
          backdrop-filter: blur(24px);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-lg), var(--shadow-inset-glass);
          z-index: 1100;
          animation: anisPanelIn 220ms var(--ease-in-out, ease-out);
        }
        .theme-panel[hidden] { display: none; }
        .theme-panel__modes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 14px;
        }
        .theme-panel__mode {
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-card);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .theme-panel__mode:hover { border-color: var(--color-secondary); color: var(--text-primary); }
        .theme-panel__mode.is-active {
          background: var(--gradient-primary);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 0 16px var(--color-primary-soft);
        }
        .theme-panel__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .theme-panel__item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: background 180ms, border-color 180ms, color 180ms;
        }
        .theme-panel__item:hover { background: var(--color-card); color: var(--text-primary); }
        .theme-panel__item.is-active {
          border-color: var(--color-secondary);
          background: var(--color-card-strong);
          color: var(--text-primary);
        }
        .theme-panel__swatch {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--color-border-strong);
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
        }
        @keyframes anisPanelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .theme-panel { animation: none; }
        }
      `;
      document.head.appendChild(style);
    }

    /** Static inner HTML for the theme panel */
    renderPanelMarkup() {
      const modeButtons = this.modes.map((mode) => `
        <button type="button" class="theme-panel__mode" data-theme-mode="${mode}" role="radio"
                aria-checked="false">${mode}</button>
      `).join('');

      const swatches = this.order.map((id) => {
        const theme = this.themes[id];
        return `
          <button type="button" class="theme-panel__item" data-theme-item="${id}" role="radio"
                  aria-checked="false" aria-label="${theme.label} theme">
            <span class="theme-panel__swatch" style="background:${theme.swatch}"></span>
            <span>${theme.label}</span>
          </button>
        `;
      }).join('');

      return `
        <div class="theme-panel__modes" role="radiogroup" aria-label="Color mode">${modeButtons}</div>
        <div class="theme-panel__grid" role="radiogroup" aria-label="Theme">${swatches}</div>
      `;
    }

    /** Wire panel interactions (select, hover-preview, active state) */
    bindPanel() {
      if (!this.panel) return;

      $$('[data-theme-mode]', this.panel).forEach((btn) => {
        btn.addEventListener('click', () => this.setMode(btn.dataset.themeMode));
      });

      $$('[data-theme-item]', this.panel).forEach((btn) => {
        btn.addEventListener('mouseenter', () => this.previewTheme(btn.dataset.themeItem));
        btn.addEventListener('mouseleave', () => this.cancelPreview());
        btn.addEventListener('focus', () => this.previewTheme(btn.dataset.themeItem));
        btn.addEventListener('blur', () => this.cancelPreview());
        btn.addEventListener('click', () => this.applyPreview(btn.dataset.themeItem));
      });
    }

    /** Reflect current mode + theme on the panel controls */
    refreshPanel() {
      if (!this.panel) return;

      $$('[data-theme-mode]', this.panel).forEach((btn) => {
        const active = btn.dataset.themeMode === this.mode;
        togglePanelState(btn, active);
      });

      $$('[data-theme-item]', this.panel).forEach((btn) => {
        const active = btn.dataset.themeItem === this.resolvedTheme;
        togglePanelState(btn, active);
      });
    }

    /** Toggle open/close of the panel */
    openPanel() {
      if (!this.panel) return;
      this.panel.hidden = false;
      this.refreshPanel();
      const toggle = $('[data-theme-toggle]');
      toggle?.setAttribute('aria-expanded', 'true');
    }

    closePanel() {
      if (!this.panel) return;
      this.panel.hidden = true;
      if (this.previewState) this.cancelPreview();
      const toggle = $('[data-theme-toggle]');
      toggle?.setAttribute('aria-expanded', 'false');
    }

    togglePanel() {
      if (!this.panel) return;
      this.panel.hidden ? this.openPanel() : this.closePanel();
    }

    /* ---------------- Global listeners ---------------- */

    /** The floating toggle opens/closes the panel */
    bindToggle() {
      $('[data-theme-toggle]')?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.togglePanel();
      });
      document.addEventListener('click', this._onDocClick, { passive: true });
      document.addEventListener('keydown', this._onKeyDown);
    }

    /** Click-outside closes the panel */
    handleOutsideClick(event) {
      if (!this.panel || this.panel.hidden) return;
      const switcher = $('[data-theme-toggle]')?.closest('.theme-switcher');
      if (switcher && !switcher.contains(event.target)) this.closePanel();
    }

    /** Keyboard shortcuts: Ctrl+Shift+T panel · Alt+T toggle */
    handleKeyDown(event) {
      const isModifier = event.ctrlKey && event.shiftKey && (event.key === 'T' || event.key === 't');
      const isAltToggle = event.altKey && !event.ctrlKey && !event.metaKey && (event.key === 'T' || event.key === 't');

      if (isModifier) {
        event.preventDefault();
        this.togglePanel();
      } else if (isAltToggle) {
        event.preventDefault();
        this.toggleTheme();
      }
    }

    /* ---------------- Helpers ---------------- */

    isValidTheme(id) {
      return typeof id === 'string' && THEME_ORDER.includes(id);
    }

    /** Branded console line */
    log(message) {
      /* eslint-disable no-console */
      console.log(
        `%c${message}`,
        'background:linear-gradient(90deg,#4F46E5,#8B5CF6);color:#fff;padding:6px 12px;border-radius:6px;font-weight:600;',
      );
      /* eslint-enable no-console */
    }
  }

  /**
   * Shared aria/class state helper for panel controls.
   * Kept outside the class to stay free of DOM references in tests.
   */
  function togglePanelState(el, active) {
    el.classList.toggle('is-active', active);
    el.setAttribute('aria-checked', active ? 'true' : 'false');
  }

  /* ====================================================================
   * 07. BOOTSTRAP — Instantiate and expose the engine
   * ================================================================== */

  /** Single sanctioned instance — theme.js owns the theme system */
  const engine = new ThemeEngine();

  /** Deferred init so the DOM is guaranteed ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => engine.init(), { once: true });
  } else {
    engine.init();
  }

  /**
   * Public API surface. app.js detects this namespace and delegates its own
   * inline theme handling to this authoritative engine.
   */
  window.ANIS_OS_THEME = Object.freeze({
    engine,
    setTheme: (id, opts) => engine.setTheme(id, opts),
    getTheme: () => engine.getTheme(),
    toggleTheme: () => engine.toggleTheme(),
    resetTheme: () => engine.resetTheme(),
    setMode: (mode) => engine.setMode(mode),
    getMode: () => engine.getMode(),
    previewTheme: (id) => engine.previewTheme(id),
    cancelPreview: () => engine.cancelPreview(),
    applyPreview: (id) => engine.applyPreview(id),
    openPanel: () => engine.openPanel(),
    closePanel: () => engine.closePanel(),
    themes: THEME_ORDER,
    events: engine.events,
  });
})(window, document);
