/**
 * ============================================================================
 *  ANIS OS — APPLICATION CORE (app.js)
 * ============================================================================
 *  Project    : ANIS OS — Ultra-Premium Futuristic Portfolio
 *  Author     : Anis Ansari
 *  Version    : 1.0.0
 *  File       : assets/js/app.js
 *  Stack      : Vanilla JavaScript (ES6+) | GSAP | AOS | Typed.js | Three.js
 *               Particles.js | Vanilla Tilt | CountUp.js | Lottie | Bootstrap 5
 *  Philosophy : Zero globals, defensive lib-guards, IntersectionObserver-first,
 *               rAF-driven motion, fully modular and ready for expansion.
 *
 *  MODULE MAP
 *  ──────────────────────────────────────────────────────────────────────────
 *  01. Configuration ................. Global CONFIG singleton
 *  02. Utilities ..................... $, $$, class ops, debounce, throttle…
 *  03. App ........................... Boot orchestrator & public API
 *  04. Loader ........................ Boot sequence screen
 *  05. Navigation .................... Sticky / hide-on-scroll / scroll-spy
 *  06. Hero .......................... Typed.js, boot log, floating visuals
 *  07. Theme Engine .................. 7 themes, picker, localStorage
 *  08. Cursor ........................ Glow dot, follower ring, magnetic
 *  09. Animations .................... AOS init, GSAP timeline, parallax
 *  10. Counter ....................... CountUp.js + rAF fallback
 *  11. Scroll ........................ Back-to-top, smooth anchor scroll
 *  12. Cards ......................... Vanilla Tilt integration
 *  13. Projects ...................... Category filter, overlay, modal-ready
 *  14. Skills ........................ Owned by animation.js (Skills Galaxy)
 *  15. Timeline ...................... Node entrance choreography
 *  16. AI Lab ........................ Filter, hover, expand details
 *  17. GitHub Dashboard .............. Placeholder API integration layer
 *  18. Contact ....................... Validation + success animation
 *  19. DataRenderer .................. Hydrates feeds from assets/js/data.js
 *  20. Performance ................... Passive listeners, lazy-load, rAF
 *  21. Boot Sequence ................. DOMContentLoaded / load lifecycle
 *  22. Developer Console ............. Branded console greeting
 * ============================================================================
 */
'use strict';

(function (window, document) {
  'use strict';

  /* ====================================================================
   * 01. CONFIGURATION — Single source of truth for the application
   * ================================================================== */
  const CONFIG = {
    /** Root selectors referenced across the application */
    selectors: {
      loader:            '#loader',
      loaderBar:         '[data-loader-bar]',
      loaderHint:        '[data-loader-hint]',
      header:            '#site-header',
      navCollapse:       '#primaryNav',
      navLinks:          '.site-navbar__link',
      navToggle:         '[data-nav-toggle]',
      navClose:          '[data-nav-close]',
      navOverlay:        '[data-nav-overlay]',
      navOverlayLinks:   '[data-nav-link]',
      cursorDot:         '[data-cursor-dot]',
      cursorRing:        '[data-cursor-ring]',
      particleCanvas:    '#particle-canvas',
      threeCanvas:       '#three-canvas',
      typedText:         '[data-typed-text]',
      heroWindow:        '[data-hero-window]',
      themeToggle:       '[data-theme-toggle]',
      themeSwitcher:     '.theme-switcher',
      backToTop:         '#back-to-top',
      soundToggle:       '[data-sound-toggle]',
      consoleToggle:     '[data-console-toggle]',
      terminalOverlay:   '[data-terminal-overlay]',
      terminalClose:     '[data-terminal-close]',
      terminalBody:      '[data-terminal-body]',
      contactForm:       '[data-contact-form]',
      formStatus:        '[data-form-status]',
      formSubmit:        '[data-form-submit]',
      formAutoGrow:      '[data-auto-grow]',
      formCharCount:     '[data-charcount]',
      copyButton:        '[data-copy]',
      footerYear:        '[data-footer-year]',
      terminalFooter:    '[data-terminal-footer]',
      footerReveal:      '[data-footer-reveal]',
      footerTheme:       '[data-footer-theme]',
      currentYear:       '[data-current-year]',
      localTime:         '[data-local-time]',
      timezone:          '[data-timezone]',
      devConsole:        '[data-dev-console]',
      devConsoleOpen:    '[data-dev-console-open]',
      devConsoleClose:   '[data-dev-console-close]',
      devStack:          '[data-dev-stack]',
      stackMarquee:      '[data-stack-marquee]',
      countUp:           '[data-count-up]',
      parallax:          '[data-parallax]',
      tiltTargets:       '[data-tilt]',
      magneticTargets:   '[data-magnetic]',
      timelineFeed:      '[data-timeline-feed]',
      githubFeed:        '[data-github-feed]',
      servicesFeed:      '[data-services-feed]',
      learningFeed:      '[data-learning-feed]',
      testimonialsFeed:  '[data-testimonials-feed]',
    },

    /** Scroll thresholds */
    scroll: {
      headerHideAt: 140,
      headerShowAt: 48,
      backToTopAt: 600,
    },

    /** Typed.js hero rotation strings */
    typed: {
      strings: [
        'React.js Developer',
        'Frontend Engineer',
        'Product Designer',
        'AI Explorer',
        'UI/UX Manager',
      ],
      typeSpeed: 45,
      backSpeed: 28,
      backDelay: 1600,
      loop: true,
    },

    /** AOS scroll-reveal options */
    aos: {
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
    },

    /** Counter defaults */
    counter: {
      duration: 2,
      decimals: 0,
    },

    /** GitHub integration (placeholders ready for live keys) */
    github: {
      username: 'anis-os',
      endpoints: {
        profile:      (u) => `https://api.github.com/users/${u}`,
        repos:        (u) => `https://api.github.com/users/${u}/repos?per_page=12&sort=updated`,
        languages:    (u) => `https://api.github.com/repos/${u}/languages`,
        contributions: () => 'https://github-contributions-api.deno.dev/',
      },
    },

    /** Developer Intelligence Dashboard — live GitHub + static growth data */
    devDashboard: {
      username: 'anis-os',
      /** Personal stats that are not exposed by the GitHub API */
      static: {
        years: 12,
        yearsSuffix: '+',
        projects: 100,
        projectsSuffix: '+',
      },
      chart: {
        maxSlices: 5,
        palette: ['#4F46E5', '#06B6D4', '#8B5CF6', '#22C55E', '#F59E0B'],
      },
      endpoints: {
        profile:      (u) => `https://api.github.com/users/${u}`,
        repos:        (u) => `https://api.github.com/users/${u}/repos?per_page=30&sort=updated`,
        languages:    (u) => `https://api.github.com/repos/${u}/languages`,
        prs:          (u) => `https://api.github.com/search/issues?q=author:${u}+type:pr&per_page=1`,
        issues:       (u) => `https://api.github.com/search/issues?q=author:${u}+type:issue&per_page=1`,
        commits:      (u) => `https://api.github.com/search/commits?q=author:${u}&per_page=1`,
        contributions: () => null,
      },
    },

    /** The 7 available color themes */
    themes: {
      storageKey: 'anis-os-theme',
      default: 'dark',
      list: [
        { id: 'dark',     label: 'Dark',     color: '#050816' },
        { id: 'light',    label: 'Light',    color: '#F8FAFC' },
        { id: 'cyber',    label: 'Cyber',    color: '#00FF9F' },
        { id: 'ocean',    label: 'Ocean',    color: '#00C2FF' },
        { id: 'glass',    label: 'Glass',    color: '#A5F3FC' },
        { id: 'purple',   label: 'Purple',   color: '#8B5CF6' },
        { id: 'midnight', label: 'Midnight', color: '#312E81' },
      ],
    },

    /** Contact validation rules */
    validation: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      minNameLength: 2,
      minMessageLength: 10,
      /** Fields that may be left empty */
      optional: ['company', 'phone', 'country', 'budget', 'timeline'],
    },

    /**
     * EmailJS delivery — PLACEHOLDER ARCHITECTURE.
     * The form currently runs a simulated transmit. To wire real delivery:
     *   1. Add the EmailJS browser SDK to index.html (before app.js).
     *   2. Create a service + template at https://dashboard.emailjs.com.
     *   3. Paste your IDs below and set `enabled: true`.
     *   4. The template vars already sent are: name, email, company, phone,
     *      country, subject, projectType, budget, timeline, message.
     */
    emailjs: {
      enabled: false, // flip to true once IDs are provided
      serviceId: 'YOUR_SERVICE_ID',
      templateId: 'YOUR_TEMPLATE_ID',
      publicKey: 'YOUR_PUBLIC_KEY',
      replyTo: 'name,email', // template mapping for the reply-to header
    },

    /** Terminal footer — static content + marquee config */
    terminalFooter: {
      stack: [
        'React.js', 'JavaScript', 'HTML5', 'CSS3', 'Bootstrap', 'Tailwind CSS',
        'Python', 'Django', 'Flask', 'Git', 'GitHub', 'WordPress', 'Next.js',
        'TypeScript', 'AI', 'Ollama', 'LM Studio', 'ComfyUI', 'OpenCode',
        'DeepSeek', 'ChatGPT', 'Claude', 'Cursor',
      ],
      consoleCommands: 'help · status · version · debug · clear · exit',
    },

    /** Terminal boot script lines rendered in the overlay */
    terminal: {
      prompt: 'anis-os:~$',
      lines: [
        '> anis-os --version',
        'v1.0.0 (build 2026.0801)',
        '> system-check --all',
        '✔ Core modules loaded',
        '✔ Theme engine online',
        '✔ Particle network active',
        '> whoami',
        'anis — creative frontend engineer',
        '> echo $MOTIVATION',
        'Shipping interfaces that feel like the future.',
        '',
        '> Type "help" to begin…',
      ],
    },
  };

  /* ====================================================================
   * 02. UTILITIES — Framework-free helpers
   * ================================================================== */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const addClass = (el, ...names) => el && el.classList.add(...names);
  const removeClass = (el, ...names) => el && el.classList.remove(...names);
  const toggleClass = (el, name, force) => el && el.classList.toggle(name, force);

  /** Debounce — delay trailing execution until pauses */
  function debounce(fn, wait = 150) {
    let timeout;
    return function debounced(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Throttle — limit execution rate (leading edge) */
  function throttle(fn, limit = 100) {
    let inThrottle = false;
    return function throttled(...args) {
      if (inThrottle) return;
      inThrottle = true;
      fn.apply(this, args);
      setTimeout(() => { inThrottle = false; }, limit);
    };
  }

  /** Smoothly scroll to a section honouring the fixed header offset */
  function scrollToSection(target, offset = 0) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const headerOffset = $('.site-header')?.offsetHeight || 0;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  /** rAF-powered counter animation (used when CountUp.js is absent) */
  function animateCounter(el, endValue, options = {}) {
    const {
      duration = 2,
      decimals = 0,
      suffix = '',
      onComplete = null,
    } = options;

    const startValue = 0;
    const startTime = performance.now();
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    function frame(now) {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = easeOutExpo(progress);
      const value = startValue + (endValue - startValue) * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
      else if (typeof onComplete === 'function') onComplete();
    }

    requestAnimationFrame(frame);
  }

  /** Detect reduced-motion preference once */
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Detect fine pointers (desktop) */
  const hasFinePointer = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ====================================================================
   * 03. APP — Boot orchestrator & public namespace
   * ================================================================== */
  const App = {
    /** Holds module instances created during boot */
    modules: {},

    /**
     * Entry point called once the DOM is parsed.
     * Order matters: loader first (locks scroll), then theme (pre-render),
     * then interactive systems, then heavy/visual systems last.
     */
    init() {
      this.bindGlobalEvents();
      this.modules.theme = new ThemeEngine();
      this.modules.loader = new Loader();
      this.modules.cursor = new Cursor();
      this.modules.nav = new Navigation();
      this.modules.scroll = new ScrollManager();
      this.modules.counter = new Counter();
      this.modules.hero = new Hero();
      this.modules.animations = new Animations();
      this.modules.cards = new Cards();
      this.modules.timeline = new TimelineModule();
      this.modules.developer = new DeveloperDashboard();
      this.modules.contact = new ContactForm();
      this.modules.terminalFooter = new TerminalFooter();
      this.modules.data = new DataRenderer();
      this.modules.perf = new PerformanceMonitor();

      // Hydrate data-driven feeds (data.js) and refresh 3rd-party animators
      this.modules.data.render().then(() => {
        this.refreshRevealEngines();
        this.modules.contact.init();
        this.modules.terminalFooter.init();
        this.modules.counter.observe();
        this.modules.cards.init();
        this.modules.scroll.init();
        this.modules.nav.init();
        this.modules.terminal();
        this.printBranding();
      });

      // Developer Intelligence Dashboard — fetch pipeline (async, degrades gracefully)
      this.modules.developer.init();

      window.ANIS_OS = this; // single sanctioned global for the console / API
    },

    /** Deferred window-load work (heavy visuals, async init) */
    onLoad() {
      this.modules.hero?.start();
      this.modules.animations?.init();
      this.modules.cursor?.enableMagnetic();
      this.initBackgrounds();
      this.modules.loader?.complete();
    },

    /** Re-run AOS + Swiper so dynamically rendered feeds animate */
    refreshRevealEngines() {
      // animation.js is the authoritative motion layer — delegate to it
      if (window.ANIS_OS_ANIMATIONS?.refresh) {
        window.ANIS_OS_ANIMATIONS.refresh();
        return;
      }
      if (window.AOS) {
        window.AOS.refreshHard();
      } else {
        this.modules.animations?.fadeFallback();
      }
      this.modules.animations?.initSwiper();
    },

    /** Boot the particle + WebGL background layers */
    initBackgrounds() {
      this.initParticles();
      this.initThree();
    },

    /** Particles.js network field (defensive guard) */
    initParticles() {
      if (window.ANIS_OS_ANIMATIONS?.features?.particles) return; // owned by animation.js
      const canvas = $(CONFIG.selectors.particleCanvas);
      if (!canvas || !window.particlesJS) return;

      window.particlesJS(canvas.id, {
        particles: {
          number: { value: 70, density: { enable: true, value_area: 900 } },
          color: { value: '#06B6D4' },
          shape: { type: 'circle' },
          opacity: { value: 0.35, random: true },
          size: { value: 2, random: true },
          line_linked: {
            enable: true,
            distance: 140,
            color: '#4F46E5',
            opacity: 0.22,
            width: 1,
          },
          move: { enable: true, speed: 1.2, direction: 'none', out_mode: 'out' },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'grab' },
            onclick: { enable: true, mode: 'push' },
            resize: true,
          },
          modes: {
            grab: { distance: 160, line_linked: { opacity: 0.45 } },
            push: { particles_nb: 3 },
          },
        },
        retina_detect: true,
      });
    },

    /** Three.js starfield — guarded, uses rAF-managed render loop */
    initThree() {
      const canvas = $(CONFIG.selectors.threeCanvas);
      if (!canvas || !window.THREE || prefersReducedMotion()) return;

      try {
        const renderer = new window.THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new window.THREE.Scene();
        const camera = new window.THREE.PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          0.1,
          1000,
        );
        camera.position.z = 40;

        // Ambient drifting star cloud
        const geometry = new window.THREE.BufferGeometry();
        const count = 1800;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 1) positions[i] = (Math.random() - 0.5) * 200;
        geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));

        const material = new window.THREE.PointsMaterial({
          color: 0x8b5cf6,
          size: 0.35,
          transparent: true,
          opacity: 0.7,
          blending: window.THREE.AdditiveBlending,
        });

        const stars = new window.THREE.Points(geometry, material);
        scene.add(stars);

        // Slow axial rotation, paused when tab is hidden
        let visible = true;
        document.addEventListener('visibilitychange', () => {
          visible = !document.hidden;
        });

        const animate = () => {
          if (visible) {
            stars.rotation.y += 0.0006;
            stars.rotation.x += 0.0002;
            renderer.render(scene, camera);
          }
          requestAnimationFrame(animate);
        };
        animate();

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize, { passive: true });
      } catch (error) {
        // Fail silently — the canvas simply stays transparent
        console.warn('[ANIS OS] Three.js disabled:', error.message);
      }
    },

    /** Terminal overlay wiring + boot script */
    terminal() {
      const overlay = $(CONFIG.selectors.terminalOverlay);
      const body = $(CONFIG.selectors.terminalBody);
      if (!overlay) return;

      const open = () => {
        overlay.hidden = false;
        if (body && !body.dataset.booted) {
          body.dataset.booted = 'true';
          body.textContent = '';
          CONFIG.terminal.lines.forEach((line, i) => {
            setTimeout(() => {
              const node = document.createElement('div');
              node.textContent = line.startsWith('>') || i === 0
                ? CONFIG.terminal.prompt + ' ' + line
                : line;
              body.appendChild(node);
            }, 60 * i);
          });
        }
      };

      const close = () => { overlay.hidden = true; };

      $(CONFIG.selectors.consoleToggle)?.addEventListener('click', open);
      $(CONFIG.selectors.terminalClose)?.addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) close();
      });
    },

    /** One-time document-level delegation hooks */
    bindGlobalEvents() {
      // Footer year
      const year = $(CONFIG.selectors.footerYear);
      if (year) year.textContent = new Date().getFullYear();
    },

    /** Branded developer-console greeting */
    printBranding() {
      /* eslint-disable no-console */
      console.log(
        '%c █████╗  ███╗   ██╗██╗███████╗   %c ANIS OS v1.0.0 ',
        'background:linear-gradient(135deg,#4F46E5,#8B5CF6);color:#fff;padding:6px 10px;border-radius:6px;font-weight:bold;',
        'background:#050816;color:#06B6D4;padding:6px 10px;border-radius:6px;font-family:JetBrains Mono,monospace;',
      );
      console.log(
        '%c Designed & Developed by Anis Ansari ',
        'color:#94A3B8;font-size:12px;',
        '\n Senior Frontend Developer | React.js | UI/UX | AI \n',
      );
      console.log(
        '%c → open window.ANIS_OS for the public API',
        'color:#22C55E;font-size:11px;',
      );
      /* eslint-enable no-console */
    },
  };

  /* ====================================================================
   * 04. LOADER — Boot sequence screen
   * ================================================================== */
  class Loader {
    constructor() {
      this.el = $(CONFIG.selectors.loader);
      this.bar = $(CONFIG.selectors.loaderBar);
      this.hint = $(CONFIG.selectors.loaderHint);
      this.minDuration = 2400; // minimum brand presence time
      this.startedAt = performance.now();

      if (this.el) {
        document.documentElement.classList.add('is-loading');
        document.body.style.overflow = 'hidden';
      }
    }

    /**
     * Called on window load. Waits for the minimum duration so the boot
     * animation reads intentionally, then fades the overlay away.
     */
    complete() {
      if (!this.el) return;
      const elapsed = performance.now() - this.startedAt;
      const wait = Math.max(0, this.minDuration - elapsed);

      setTimeout(() => {
        addClass(this.el, 'is-hidden');
        document.documentElement.classList.remove('is-loading');
        document.body.style.overflow = '';
        document.documentElement.classList.add('is-booted');
      }, wait);
    }

    /** Fallback if `load` already fired before listeners attached */
    forceComplete() {
      this.complete();
    }
  }

  /* ====================================================================
   * 05. NAVIGATION — Sticky header, hide/show, active link
   * ================================================================== */
  class Navigation {
    constructor() {
      this.header = $(CONFIG.selectors.header);
      this.links = $$(CONFIG.selectors.navLinks);
      this.overlay = $(CONFIG.selectors.navOverlay);
      this.toggle = $(CONFIG.selectors.navToggle);
      this.closeBtn = $(CONFIG.selectors.navClose);
      this.overlayLinks = $$(CONFIG.selectors.navOverlayLinks);
      this.lastScrollY = window.pageYOffset;
      this.hideDistance = CONFIG.scroll.headerHideAt;
      this.observableSections = this.links
        .map((link) => $(link.getAttribute('href')))
        .filter(Boolean);

      this.onScroll = throttle(() => this.handleScroll(), 80);
      this.bindMenu();
    }

    /** Called post-data-render so section targets definitely exist */
    init() {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', debounce(() => {
        // Never trap the fullscreen menu open on desktop
        if (this.menuOpen && window.innerWidth >= 992) this.closeMenu();
        this.handleScroll();
      }, 120));
      this.handleScroll();
      this.initScrollSpy();
    }

    /** True while the mobile overlay menu is open */
    get menuOpen() {
      return !!this.overlay && this.overlay.getAttribute('aria-hidden') === 'false';
    }

    openMenu() {
      if (!this.overlay || this.menuOpen) return;
      this.overlay.setAttribute('aria-hidden', 'false');
      addClass(this.overlay, 'is-open');
      this.toggle?.setAttribute('aria-expanded', 'true');
      addClass(this.toggle, 'is-active');
      document.body.style.overflow = 'hidden';
    }

    closeMenu() {
      if (!this.overlay || !this.menuOpen) return;
      this.overlay.setAttribute('aria-hidden', 'true');
      removeClass(this.overlay, 'is-open');
      this.toggle?.setAttribute('aria-expanded', 'false');
      removeClass(this.toggle, 'is-active');
      document.body.style.overflow = '';
    }

    toggleMenu() {
      this.menuOpen ? this.closeMenu() : this.openMenu();
    }

    /** Compressed + hide-on-scroll-down / show-on-scroll-up logic */
    handleScroll() {
      const y = window.pageYOffset;

      toggleClass(this.header, 'is-scrolled', y > 10);
      if (y < 10) removeClass(this.header, 'is-hidden');

      // Keep the header fixed while the mobile menu is open
      if (this.menuOpen) {
        this.lastScrollY = y;
        return;
      }

      if (y > this.hideDistance) {
        const goingDown = y > this.lastScrollY && y - this.lastScrollY > CONFIG.scroll.headerShowAt;
        toggleClass(this.header, 'is-hidden', goingDown);
      }
      this.lastScrollY = y;
    }

    /** IntersectionObserver-driven active link highlighting */
    initScrollSpy() {
      if (!('IntersectionObserver' in window) || this.observableSections.length === 0) return;

      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            this.links.forEach((link) => {
              const active = link.getAttribute('href') === `#${id}`;
              toggleClass(link, 'is-active', active);
            });
          });
        },
        { rootMargin: '-40% 0px -55% 0px' },
      );

      this.observableSections.forEach((section) => spy.observe(section));
    }

    /** Open/close the fullscreen overlay (aria + scroll lock) */
    bindMenu() {
      this.toggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });

      this.closeBtn?.addEventListener('click', () => this.closeMenu());

      // Tap on the dimmed backdrop closes the menu
      this.overlay?.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.closeMenu();
      });

      this.overlayLinks.forEach((link) => {
        link.addEventListener('click', () => this.closeMenu());
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.menuOpen) this.closeMenu();
      });
    }
  }

  /* ====================================================================
   * 06. HERO — Typed.js, boot log, floating visual
   * ================================================================== */
  class Hero {
    constructor() {
      this.typedEl = $(CONFIG.selectors.typedText);
      this.windowBody = $(CONFIG.selectors.heroWindow);
      this.typedInstance = null;
    }

    /** Kicked off on window load (post-loader) */
    start() {
      this.initTyped();
      this.renderBootLog();
    }

    /** Typed.js typewriter for the role line */
    initTyped() {
      if (!this.typedEl) return;

      if (window.Typed && !prefersReducedMotion()) {
        this.typedInstance = new window.Typed(this.typedEl, {
          strings: CONFIG.typed.strings,
          typeSpeed: CONFIG.typed.typeSpeed,
          backSpeed: CONFIG.typed.backSpeed,
          backDelay: CONFIG.typed.backDelay,
          startDelay: 500,
          loop: CONFIG.typed.loop,
          showCursor: true,
          cursorChar: '_',
          smartBackspace: true,
        });
      } else {
        // Accessible static fallback
        this.typedEl.textContent = CONFIG.typed.strings[0];
      }
    }

    /** Animate a small "system boot" readout inside the OS window */
    renderBootLog() {
      if (!this.windowBody || prefersReducedMotion()) return;

      const lines = [
        ['mounting modules', 400],
        ['loading particles', 700],
        ['spinning 3D field', 300],
        ['compiling styles', 500],
        ['system ready ✓', 600],
      ];

      this.windowBody.innerHTML = '';
      const pre = document.createElement('pre');
      pre.className = 'hero__boot';
      this.windowBody.appendChild(pre);

      let acc = '';
      lines.forEach(([text, delay], index) => {
        setTimeout(() => {
          acc += `> ${text}\n`;
          pre.textContent = acc.trimEnd();
          if (index === lines.length - 1) {
            setTimeout(() => addClass(pre, 'is-done'), 400);
          }
        }, delay * (index + 1));
      });
    }
  }

  /* ====================================================================
   * 07. THEME ENGINE — 7 themes, picker panel, persistence
   * ================================================================== */
  class ThemeEngine {
    constructor() {
      // theme.js (assets/js/theme.js) is the authoritative theme engine.
      // When present, this inline fallback stands down to avoid conflicts.
      if (window.ANIS_OS_THEME) {
        console.debug('[ANIS OS] Theme engine delegated to theme.js');
        return;
      }
      this.storageKey = CONFIG.themes.storageKey;
      this.themes = CONFIG.themes.list;
      this.root = document.documentElement;
      this.toggle = $(CONFIG.selectors.themeToggle);
      this.switcher = $(CONFIG.selectors.themeSwitcher);
      this.current = this.restore();

      this.buildPicker();
      this.bindEvents();
      this.apply(this.current, { announce: false });
    }

    /** Read the persisted theme or fall back to the default */
    restore() {
      try {
        const saved = localStorage.getItem(this.storageKey);
        if (saved && this.themes.some((t) => t.id === saved)) return saved;
      } catch (_) { /* private-mode / quota errors → default */ }
      return CONFIG.themes.default;
    }

    /** Persist + apply a theme id */
    setTheme(id) {
      if (!this.themes.some((t) => t.id === id)) return;
      this.current = id;
      try {
        localStorage.setItem(this.storageKey, id);
      } catch (_) { /* ignore storage failures */ }
      this.apply(id, { announce: true });
    }

    /** Cycle helper for the floating quick-toggle (dark ↔ light) */
    toggleQuick() {
      const next = this.current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      this.closePicker();
    }

    /** Push the theme onto <html> and mirror a state class on <body> */
    apply(id, { announce }) {
      this.root.dataset.theme = id;
      document.body.dataset.theme = id;
      this.themes.forEach((t) => toggleClass(document.body, `theme--${t.id}`, t.id === id));

      if (announce) this.animateTransition();
    }

    /** Fade punch to make theme switches feel deliberate */
    animateTransition() {
      if (prefersReducedMotion()) return;
      addClass(document.body, 'theme-transition');
      setTimeout(() => removeClass(document.body, 'theme-transition'), 350);
    }

    /** Inject a radial picker panel hosting all 7 theme swatches */
    buildPicker() {
      if (!this.switcher || this.switcher.querySelector('[data-theme-picker]')) return;

      const panel = document.createElement('div');
      panel.className = 'theme-picker';
      panel.setAttribute('data-theme-picker', '');
      panel.setAttribute('role', 'menu');
      panel.setAttribute('aria-label', 'Choose color theme');
      panel.hidden = true;

      this.themes.forEach((theme) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-picker__item';
        btn.dataset.themeId = theme.id;
        btn.setAttribute('role', 'menuitem');
        btn.innerHTML = `
          <span class="theme-picker__swatch" style="background:${theme.color}"></span>
          <span class="theme-picker__label">${theme.label}</span>
        `;
        btn.addEventListener('click', () => {
          this.setTheme(theme.id);
          this.closePicker();
        });
        panel.appendChild(btn);
      });

      this.switcher.appendChild(panel);
    }

    bindEvents() {
      this.toggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.picker.hidden ? this.openPicker() : this.toggleQuick();
      });
      document.addEventListener('click', (e) => {
        if (this.picker && !this.picker.hidden && !this.switcher.contains(e.target)) {
          this.closePicker();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closePicker();
      });
    }

    get picker() {
      return this.switcher?.querySelector('[data-theme-picker]');
    }

    openPicker() {
      if (!this.picker) return;
      this.picker.hidden = false;
      // Reflect the active theme
      $$('.theme-picker__item', this.picker).forEach((item) =>
        toggleClass(item, 'is-active', item.dataset.themeId === this.current),
      );
    }

    closePicker() {
      if (this.picker) this.picker.hidden = true;
    }
  }

  /* ====================================================================
   * 08. CURSOR — Glow dot, follower ring, magnetic targets
   * ================================================================== */
  class Cursor {
    constructor() {
      // animation.js owns the cursor when present — stand down to avoid double rAF loops
      if (window.ANIS_OS_ANIMATIONS?.features?.cursor) return;
      this.dot = $(CONFIG.selectors.cursorDot);
      this.ring = $(CONFIG.selectors.cursorRing);
      this.enabled = hasFinePointer() && !prefersReducedMotion() && !!this.dot;

      this.mouse = { x: -100, y: -100 };
      this.dotPos = { ...this.mouse };
      this.ringPos = { ...this.mouse };

      if (this.enabled) {
        document.documentElement.classList.add('has-cursor');
        this.bind();
        this.loop();
      }
    }

    bind() {
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        this.ring && (this.ring.style.opacity = 0);
        this.dot && (this.dot.style.opacity = 0);
      });
      document.addEventListener('mouseenter', () => {
        this.ring && (this.ring.style.opacity = 1);
        this.dot && (this.dot.style.opacity = 1);
      });

      // Grow on interactive elements
      document.addEventListener('mouseover', (e) => {
        const interactive = e.target.closest('a, button, [data-cursor-hover], .tilt-card, input, textarea, .swiper');
        toggleClass(this.ring, 'is-hovering', Boolean(interactive));
      }, { passive: true });

      document.addEventListener('mousedown', () => addClass(this.ring, 'is-pressed'));
      document.addEventListener('mouseup', () => removeClass(this.ring, 'is-pressed'));
    }

    /** rAF loop with lagging interpolation for the ring */
    loop() {
      const lerp = (start, end, ease) => start + (end - start) * ease;

      this.dotPos.x = lerp(this.dotPos.x, this.mouse.x, 0.9);
      this.dotPos.y = lerp(this.dotPos.y, this.mouse.y, 0.9);
      this.ringPos.x = lerp(this.ringPos.x, this.mouse.x, 0.18);
      this.ringPos.y = lerp(this.ringPos.y, this.mouse.y, 0.18);

      if (this.dot) {
        this.dot.style.transform = `translate(${this.dotPos.x}px, ${this.dotPos.y}px) translate(-50%, -50%)`;
      }
      if (this.ring) {
        this.ring.style.transform = `translate(${this.ringPos.x}px, ${this.ringPos.y}px) translate(-50%, -50%)`;
      }

      requestAnimationFrame(() => this.loop());
    }

    /** Magnetic pull — elements drift toward the pointer when near */
    enableMagnetic() {
      if (window.ANIS_OS_ANIMATIONS?.features?.magnetic) return; // owned by animation.js
      const targets = $$(CONFIG.selectors.magneticTargets).concat(
        $$('.btn-glow, .btn-outline-light, .icon-btn'),
      );

      targets.forEach((el) => {
        const strength = Number(el.dataset.magneticStrength || 0.3);

        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const relX = e.clientX - rect.left - rect.width / 2;
          const relY = e.clientY - rect.top - rect.height / 2;
          el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
        }, { passive: true });

        el.addEventListener('mouseleave', () => {
          el.style.transform = '';
        }, { passive: true });
      });
    }
  }

  /* ====================================================================
   * 09. ANIMATIONS — AOS init, GSAP choreography, parallax, Swiper
   * ================================================================== */
  class Animations {
    constructor() {
      this.gsap = window.gsap || null;
      this.st = window.ScrollTrigger || null;
    }

    init() {
      if (window.ANIS_OS_ANIMATIONS?.features?.aos) return; // owned by animation.js
      this.initAOS();
      this.initHeroIntro();
      this.initParallax();
    }

    /** Scroll reveal (AOS) with our design tokens */
    initAOS() {
      if (!window.AOS) return this.fadeFallback();
      window.AOS.init({
        duration: CONFIG.aos.duration,
        easing: CONFIG.aos.easing,
        once: CONFIG.aos.once,
        offset: CONFIG.aos.offset,
        anchorPlacement: 'top-bottom',
      });
    }

    /** Fade-in fallback when AOS is missing */
    fadeFallback() {
      $$('[data-aos]').forEach((el, i) => {
        addClass(el, 'is-fallback-hidden');
        setTimeout(() => addClass(el, 'is-fallback-visible'), 60 * i);
      });
    }

    /** GSAP hero entrance timeline (guarded) */
    initHeroIntro() {
      if (!this.gsap || prefersReducedMotion()) return;

      if (this.st) this.gsap.registerPlugin(this.st);

      const timeline = this.gsap.timeline({ delay: 0.1 });
      timeline
        .from('[data-hero-eyebrow]', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
        .from('.hero__title', { y: 40, opacity: 0, duration: 0.9, ease: 'power4.out' }, '-=0.3')
        .from('.hero__subtitle', { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
        .from('.hero__desc', { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.45')
        .from('.hero__actions .btn', { y: 20, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.4')
        .from('.hero__visual', { y: 60, opacity: 0, scale: 0.94, duration: 1.1, ease: 'power4.out' }, '-=0.7')
        .from('.hero__scroll', { opacity: 0, duration: 0.5 }, '-=0.3');
    }

    /** Scroll-linked parallax for [data-parallax] and hero visual */
    initParallax() {
      if (!this.gsap || !this.st || prefersReducedMotion()) return;

      const heroVisual = $('.hero__visual');
      if (heroVisual) {
        this.gsap.to(heroVisual, {
          yPercent: -18,
          ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        });
      }

      $$(CONFIG.selectors.parallax).forEach((el) => {
        const speed = Number(el.dataset.parallaxSpeed || 0.15);
        this.gsap.to(el, {
          y: () => `${100 * speed * (el.dataset.parallaxDirection === 'up' ? -1 : 1)}%`,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    }

    /** Swiper carousels (experience + testimonials) */
    initSwiper() {
      if (window.ANIS_OS_ANIMATIONS?.features?.swiper) return; // owned by animation.js
      if (!window.Swiper) return;

      $$('[data-swiper]').forEach((el) => {
        const mode = el.dataset.swiper;
        const config = {
          experience: {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
            autoplay: { delay: 4200, disableOnInteraction: false },
            breakpoints: { 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } },
          },
          testimonials: {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            navigation: {
              nextEl: el.querySelector('.swiper-button-next'),
              prevEl: el.querySelector('.swiper-button-prev'),
            },
            pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
            breakpoints: { 768: { slidesPerView: 2 } },
          },
        }[mode] || { slidesPerView: 1, spaceBetween: 24 };

        new window.Swiper(el, config);
      });
    }
  }

  /* ====================================================================
   * 10. COUNTER — CountUp.js integration with rAF fallback
   * ================================================================== */
  class Counter {
    constructor() {
      this.elements = [];
      this.observer = null;
    }

    observe() {
      if (window.ANIS_OS_ANIMATIONS?.features?.counters) return; // owned by animation.js
      this.elements = $$(CONFIG.selectors.countUp);
      if (this.elements.length === 0) return;

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.run(entry.target);
                obs.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.4 },
        );
        this.elements.forEach((el) => this.observer.observe(el));
      } else {
        this.elements.forEach((el) => this.run(el));
      }
    }

    /** Execute a single counter (library-first, util fallback) */
    run(el) {
      const endValue = Number(el.dataset.countValue || 0);
      const suffix = el.dataset.countSuffix || '';
      const duration = Number(el.dataset.countDuration || CONFIG.counter.duration);
      const decimals = Number(el.dataset.countDecimals || CONFIG.counter.decimals);

      if (window.CountUp) {
        const counter = new window.CountUp(el, endValue, {
          suffix,
          duration,
          decimalPlaces: decimals,
          useEasing: true,
          useGrouping: true,
        });
        if (counter.error) {
          animateCounter(el, endValue, { suffix, duration, decimals });
        } else {
          counter.start();
        }
      } else {
        animateCounter(el, endValue, { suffix, duration, decimals });
      }
    }
  }

  /* ====================================================================
   * 11. SCROLL — Back-to-top, anchor navigation
   * ================================================================== */
  class ScrollManager {
    constructor() {
      this.backToTop = $(CONFIG.selectors.backToTop);
    }

    init() {
      this.bindAnchors();
      this.bindBackToTop();
    }

    /** Smooth-scroll every same-page anchor through scrollToSection() */
    bindAnchors() {
      $$('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (!href || href === '#') return;
          const target = $(href);
          if (!target) return;
          e.preventDefault();
          scrollToSection(target);
          history.replaceState(null, '', href);
        });
      });
    }

    bindBackToTop() {
      if (!this.backToTop) return;

      window.addEventListener('scroll', throttle(() => {
        const visible = window.pageYOffset > CONFIG.scroll.backToTopAt;
        toggleClass(this.backToTop, 'is-visible', visible);
      }, 120), { passive: true });

      this.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ====================================================================
   * 12. CARDS — Vanilla Tilt 3D integration
   * ================================================================== */
  class Cards {
    init() {
      if (window.ANIS_OS_ANIMATIONS?.features?.tilt) return; // owned by animation.js
      if (!window.VanillaTilt || prefersReducedMotion()) return;
      $$(CONFIG.selectors.tiltTargets).forEach((el) => {
        new window.VanillaTilt(el, {
          max: 10,
          speed: 600,
          glare: true,
          'max-glare': 0.25,
          scale: 1.02,
        });
      });
    }
  }

  /* ====================================================================
   * 15. TIMELINE — Entrance choreography for timeline nodes
   * ================================================================== */
  class TimelineModule {
    constructor() {
      this.root = $(CONFIG.selectors.timelineFeed);
    }

    /** Reveal each timeline card from the left as it enters the viewport */
    animate() {
      if (!this.root || prefersReducedMotion()) return;

      const items = $$('.timeline__item', this.root);
      if (items.length === 0) return;

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              addClass(entry.target, 'is-revealed');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        items.forEach((item) => io.observe(item));
      }
    }
  }

  /* ====================================================================
   * 17. DEVELOPER DASHBOARD — live GitHub analytics + growth panels
   *     Modular fetches with retry, loading/error states, graceful
   *     degradation when the GitHub API is unreachable.
   * ================================================================== */
  class DeveloperDashboard {
    constructor() {
      this.cfg = CONFIG.devDashboard;
      this.username = this.cfg.username;
      this.root = $('#developer-dashboard');
      this.endpoints = this.cfg.endpoints;
      this.repos = [];
      this.chartData = null;
      this.activity = {};
      this._running = false;
      this.LANG_COLORS = {
        JavaScript: '#F1E05A', TypeScript: '#3178C6', HTML: '#E34C26', CSS: '#563D7C',
        Python: '#3572A5', Java: '#B07219', 'C++': '#F34B7D', C: '#555555', 'C#': '#178600',
        Go: '#00ADD8', Rust: '#DEA584', Ruby: '#701516', PHP: '#4F5D95', Shell: '#89E051',
        'Jupyter Notebook': '#DA5B0B', Vue: '#41B883', Dart: '#00B4AB', Kotlin: '#A97BFF',
      };
    }

    /* ------------------------------------------------------------
       Boot
       ------------------------------------------------------------ */
    init() {
      if (!this.root) return;
      this.bindUI();
      this.hydrate();
    }

    bindUI() {
      this.retryBtn = $('[data-dashboard-retry]', this.root);
      this.activityHost = $('[data-dashboard-activity]', this.root);
      this.activityTabs = $$('[data-dashboard-tab]', this.root);
      this.contribTabs = $$('[data-dashboard-contrib-tab]', this.root);

      this.retryBtn?.addEventListener('click', () => this.hydrate());

      this.activityTabs.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.switchTab(this.activityTabs, 'dashboardTab', btn.dataset.dashboardTab);
          this.renderActivityList(btn.dataset.dashboardTab);
        });
      });

      this.contribTabs.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.switchTab(this.contribTabs, 'dashboardContribTab', btn.dataset.dashboardContribTab);
          this.renderContribSummary(btn.dataset.dashboardContribTab);
        });
      });
    }

    switchTab(tabs, attr, key) {
      tabs.forEach((btn) => {
        const active = btn.dataset[attr] === key;
        toggleClass(btn, 'is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    /* ------------------------------------------------------------
       Status pill + loading skeleton
       ------------------------------------------------------------ */
    setStatus(mode, message) {
      const dot = $('[data-dashboard-status-dot]', this.root);
      const text = $('[data-dashboard-status-text]', this.root);
      if (dot) {
        dot.className = 'devdash-status__dot';
        toggleClass(dot, `is-${mode}`, true);
      }
      if (text) text.textContent = message;
      if (this.retryBtn) this.retryBtn.hidden = mode !== 'error';
    }

    setLoading() {
      $$('[data-dashboard-stat-value]', this.root).forEach((el) => {
        addClass(el, 'is-loading');
        el.removeAttribute('data-count-up');
        el.removeAttribute('data-count-value');
        el.textContent = '…';
      });

      if (this.activityHost) {
        this.activityHost.innerHTML = '<p class="devdash-activity__empty">Loading repository signals…</p>';
      }

      const pinned = $('[data-dashboard-pinned]', this.root);
      if (pinned) pinned.innerHTML = '<p class="devdash-pinned__empty">Loading pinned repositories…</p>';

      const empty = $('[data-dashboard-chart-empty]', this.root);
      if (empty) {
        empty.textContent = 'Waiting for language data…';
        empty.hidden = false;
      }
    }

    /* ------------------------------------------------------------
       Fetch layer — timeout, retry with exponential backoff
       ------------------------------------------------------------ */
    async request(url, options = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github+json', ...(options.headers || {}) },
          ...options,
        });
        if (!response.ok) throw new Error(`GitHub ${response.status}`);
        return await response.json();
      } catch (error) {
        if (error.name !== 'AbortError') console.warn('[ANIS OS] GitHub request failed:', error.message);
        return null;
      } finally {
        clearTimeout(timer);
      }
    }

    /** Exponential-backoff retry (max `attempts`, base delay 500ms) */
    async withRetry(fn, attempts = 3) {
      for (let i = 0; i < attempts; i++) {
        const result = await fn();
        if (result !== null) return result;
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** i));
      }
      return null;
    }

    fetchProfile() { return this.withRetry(() => this.request(this.endpoints.profile(this.username))); }
    fetchRepos()   { return this.withRetry(() => this.request(this.endpoints.repos(this.username))); }

    /** Aggregated language share across the newest repositories */
    async fetchLanguages(repos = this.repos) {
      if (!Array.isArray(repos) || repos.length === 0) return null;

      const totals = {};
      await Promise.all(
        repos.slice(0, 6).map(async (repo) => {
          const langs = await this.request(this.endpoints.languages(repo.full_name));
          if (langs) {
            Object.entries(langs).forEach(([name, bytes]) => {
              totals[name] = (totals[name] || 0) + bytes;
            });
          }
        }),
      );

      const allBytes = Object.values(totals).reduce((a, b) => a + b, 0);
      if (!allBytes) return null;

      return Object.entries(totals)
        .map(([name, bytes]) => ({ name, pct: (bytes / allBytes) * 100 }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, this.cfg.chart.maxSlices);
    }

    /** Search-API aggregate counts (PRs / issues / commits) — each degrades to null */
    async fetchCount(endpoint) {
      const res = await this.withRetry(() => this.request(endpoint(this.username)));
      return res && Number.isFinite(res.total_count) ? res.total_count : null;
    }

    fetchPRs()     { return this.fetchCount(this.endpoints.prs); }
    fetchIssues()  { return this.fetchCount(this.endpoints.issues); }
    fetchCommits() { return this.fetchCount(this.endpoints.commits); }

    /** Deterministic placeholder contribution source (API-ready seam) */
    fetchContributions() {
      return Promise.resolve(this.endpoints.contributions(this.username));
    }

    /* ------------------------------------------------------------
       Hydration pipeline
       ------------------------------------------------------------ */
    async hydrate() {
      if (this._running) return;
      this._running = true;

      this.setStatus('loading', 'Syncing with GitHub…');
      this.setLoading();
      this.renderStaticStats();

      const [profile, repos, prs, issues, commits] = await Promise.all([
        this.fetchProfile(),
        this.fetchRepos(),
        this.fetchPRs(),
        this.fetchIssues(),
        this.fetchCommits(),
      ]);

      this.repos = Array.isArray(repos) ? repos : [];
      const langs = await this.fetchLanguages(this.repos);

      this.renderProfile(profile);
      this.renderStats(profile, this.repos, prs, issues, commits);
      this.renderActivity(this.repos);
      this.renderPinned(this.repos);
      this.renderContributions();
      this.renderContribSummary('week');
      this.prepareChart(langs);

      if (profile || this.repos.length) {
        this.setStatus('live', profile ? `Live · @${profile.login}` : 'Live · repository data');
      } else {
        this.setStatus('error', 'Live data unavailable — showing sample structure');
      }

      // Let the motion layer re-scan counters / reveals / charts
      if (window.ANIS_OS_ANIMATIONS?.refresh) window.ANIS_OS_ANIMATIONS.refresh();
      this._running = false;
    }

    /* ------------------------------------------------------------
       Renderers
       ------------------------------------------------------------ */
    renderStaticStats() {
      const set = (key, value, suffix) => {
        const el = this.root.querySelector(`[data-dashboard-stat="${key}"] [data-dashboard-stat-value]`);
        if (!el) return;
        removeClass(el, 'is-loading');
        el.textContent = `${value}${suffix || ''}`;
        el.setAttribute('data-count-up', '');
        el.setAttribute('data-count-value', String(value));
        if (suffix) el.setAttribute('data-count-suffix', suffix);
      };
      set('years', this.cfg.static.years, this.cfg.static.yearsSuffix);
      set('projects', this.cfg.static.projects, this.cfg.static.projectsSuffix);
    }

    renderProfile(profile) {
      const mark = $('[data-dashboard-avatar-mark]', this.root);
      const handle = $('[data-dashboard-handle]', this.root);
      const name = $('[data-dashboard-name]', this.root);
      const bio = $('[data-dashboard-bio]', this.root);
      const link = $('[data-dashboard-link]', this.root);

      if (mark) mark.textContent = (profile?.login || this.username).charAt(0).toUpperCase();
      if (handle) handle.textContent = `@${profile?.login || this.username}`;
      if (name && profile?.name) name.textContent = profile.name;
      if (bio && profile?.bio) bio.textContent = profile.bio;
      if (link && profile?.html_url) link.href = profile.html_url;
    }

    renderStats(profile, repos, prs, issues, commits) {
      const set = (key, value, suffix = '') => {
        const el = this.root.querySelector(`[data-dashboard-stat="${key}"] [data-dashboard-stat-value]`);
        if (!el) return;
        removeClass(el, 'is-loading');
        if (value == null) {
          el.textContent = '—';
          el.removeAttribute('data-count-up');
          el.removeAttribute('data-count-value');
          return;
        }
        el.textContent = `${value.toLocaleString()}${suffix}`;
        el.setAttribute('data-count-up', '');
        el.setAttribute('data-count-value', String(value));
        if (suffix) el.setAttribute('data-count-suffix', suffix);
      };

      const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

      set('repos', repos.length ? repos.length : null);
      set('followers', profile?.followers ?? null);
      set('following', profile?.following ?? null);
      set('stars', totalStars || null);
      set('commits', commits);
      set('prs', prs);
      set('issues', issues);
    }

    renderActivity(repos) {
      const byDate = (key) =>
        [...repos]
          .filter((r) => r[key])
          .sort((a, b) => new Date(b[key]) - new Date(a[key]))
          .slice(0, 6);

      this.activity = {
        latest: repos.slice(0, 6),
        'recently-updated': byDate('pushed_at'),
        'most-starred': [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6),
        'recently-created': byDate('created_at'),
      };

      const active = this.activityTabs.find((b) => b.classList.contains('is-active'))?.dataset.dashboardTab || 'latest';
      this.renderActivityList(active);
    }

    renderActivityList(key) {
      if (!this.activityHost) return;
      const list = this.activity[key] || [];

      if (!list.length) {
        this.activityHost.innerHTML = '<p class="devdash-activity__empty">No repository signals available.</p>';
        return;
      }

      this.activityHost.innerHTML = list.map((r) => `
        <a class="devdash-activity__item" href="${this.escape(r.html_url)}" target="_blank" rel="noopener">
          <span class="devdash-activity__icon"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i></span>
          <span class="devdash-activity__body">
            <strong class="devdash-activity__name">${this.escape(r.full_name || r.name)}</strong>
            <span class="devdash-activity__desc">${this.escape(r.description || 'No description')}</span>
          </span>
          <span class="devdash-activity__meta"><i class="fa-solid fa-star" aria-hidden="true"></i>${(r.stargazers_count || 0).toLocaleString()}</span>
        </a>
      `).join('');
    }

    renderPinned(repos) {
      const host = $('[data-dashboard-pinned]', this.root);
      if (!host) return;

      const pinned = [...repos]
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, 6);

      if (!pinned.length) {
        host.innerHTML = '<p class="devdash-pinned__empty">No pinned repositories available.</p>';
        return;
      }

      host.innerHTML = pinned.map((r) => {
        const lang = r.language || 'Plain Text';
        return `
          <article class="devdash-pin">
            <span class="devdash-pin__icon"><i class="fa-solid fa-code-branch" aria-hidden="true"></i></span>
            <h4 class="devdash-pin__name">${this.escape(r.full_name || r.name)}</h4>
            <p class="devdash-pin__desc">${this.escape(r.description || 'No description available.')}</p>
            <ul class="devdash-pin__tags">
              <li class="devdash-pin__tag"><span class="devdash-pin__dot" style="--tag-color:${this.langColor(lang)}"></span>${this.escape(lang)}</li>
              <li class="devdash-pin__tag"><i class="fa-solid fa-star" aria-hidden="true"></i>${(r.stargazers_count || 0).toLocaleString()}</li>
              <li class="devdash-pin__tag"><i class="fa-solid fa-code-fork" aria-hidden="true"></i>${(r.forks_count || 0).toLocaleString()}</li>
            </ul>
            <a class="devdash-pin__link" href="${this.escape(r.html_url)}" target="_blank" rel="noopener" data-ripple>Open Repository <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
          </article>
        `;
      }).join('');
    }

    /** 7×53 placeholder contribution grid (deterministic, seeded) */
    renderContributions() {
      const host = $('[data-dashboard-heatmap]', this.root);
      if (!host || host.children.length) return;

      const rng = this.mulberry32(20260801);
      const cells = [];
      for (let i = 0; i < 53 * 7; i++) {
        const roll = rng();
        const level = roll > 0.86 ? 4 : roll > 0.66 ? 3 : roll > 0.42 ? 2 : roll > 0.18 ? 1 : 0;
        cells.push({ level, delay: (i * 0.004).toFixed(3) });
      }

      host.innerHTML = cells.map((c) =>
        `<span class="devdash-heatmap__cell" data-level="${c.level}" style="--d:${c.delay}s" title="Placeholder contribution"></span>`,
      ).join('');

      requestAnimationFrame(() => addClass(host, 'is-visible'));
    }

    renderContribSummary(range) {
      const summary = $('[data-dashboard-contrib-summary]', this.root);
      if (!summary) return;

      // Proportion of the deterministic grid that falls inside the range
      const total = 371;
      const weight = range === 'week' ? 7 / 365 : range === 'month' ? 30 / 365 : 1;
      const count = Math.round(total * 5.2 * weight);
      const active = Math.round(total * 0.45 * weight);
      const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;

      summary.innerHTML = `
        <span>${count.toLocaleString()} contributions · ${active.toLocaleString()} active days in the last ${days} days (placeholder)</span>
        <span class="devdash-contrib__legend" aria-label="Contribution intensity legend">
          Less
          <span data-level="0"></span><span data-level="1"></span><span data-level="2"></span>
          <span data-level="3"></span><span data-level="4"></span>
          More
        </span>
      `;
    }

    /* ------------------------------------------------------------
       Language chart (data owner — Chart.js renders it lazily)
       ------------------------------------------------------------ */
    prepareChart(langs) {
      this.chartData = null;

      if (langs && langs.length) {
        this.chartData = {
          labels: langs.map((l) => l.name),
          values: langs.map((l) => Math.round(l.pct * 10) / 10),
          palette: this.cfg.chart.palette,
        };
      }

      this.renderLegend();

      window.dispatchEvent(new CustomEvent('anis:dashboard:data', {
        detail: { langs: this.chartData, repos: this.repos.length },
      }));
    }

    renderLegend() {
      const legend = $('[data-dashboard-legend]', this.root);
      const empty = $('[data-dashboard-chart-empty]', this.root);

      if (legend) {
        if (this.chartData) {
          const palette = this.cfg.chart.palette;
          legend.innerHTML = this.chartData.labels.map((label, i) => `
            <li class="devdash-chart__legend-item">
              <span class="devdash-chart__swatch" style="background:${palette[i % palette.length]}"></span>
              <span class="devdash-chart__label">${this.escape(label)}</span>
              <span class="devdash-chart__pct">${this.chartData.values[i]}%</span>
            </li>
          `).join('');
        } else {
          legend.innerHTML = '';
        }
      }

      if (empty) {
        empty.textContent = this.chartData ? '' : 'Language data unavailable — showing sample structure.';
        empty.hidden = !!this.chartData;
      }
    }

    /* ------------------------------------------------------------
       Helpers
       ------------------------------------------------------------ */
    langColor(lang) {
      return this.LANG_COLORS[lang] || '#94A3B8';
    }

    /** Escape untrusted strings before injecting into the DOM */
    escape(value) {
      return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));
    }

    /** Deterministic PRNG (mulberry32) so placeholder data is stable */
    mulberry32(seed) {
      let a = seed >>> 0;
      return () => {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
  }

  /* ====================================================================
   * 18. CONTACT — Client-side validation + success animation
   * ================================================================== */
  class ContactForm {
    constructor() {
      this.form = $(CONFIG.selectors.contactForm);
      this.status = $(CONFIG.selectors.formStatus);
    }

    /** Attach listeners when the form exists */
    init() {
      if (!this.form) return;
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      this.form.querySelectorAll('input, textarea, select').forEach((field) => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => this.clearError(field));
        field.addEventListener('change', () => {
          if (field.type === 'select-one') this.validateField(field);
        });
      });

      // Auto-growing message textarea
      this.form.querySelectorAll(CONFIG.selectors.formAutoGrow).forEach((area) => {
        const grow = () => {
          area.style.height = 'auto';
          area.style.height = area.scrollHeight + 'px';
          this.updateCharCount(area);
        };
        area.addEventListener('input', grow);
        grow();
      });

      // Character counter synced to the message field
      this.form.querySelectorAll(CONFIG.selectors.formCharCount).forEach((counter) => {
        const target = counter.dataset.for
          ? this.form.querySelector(`#${counter.dataset.for}`)
          : counter.parentElement?.querySelector('textarea, input');
        if (target) {
          target.addEventListener('input', () => this.updateCharCount(target));
          this.updateCharCount(target);
        }
      });

      // Copy-to-clipboard buttons for contact details
      this.form.querySelectorAll(CONFIG.selectors.copyButton).forEach((btn) => {
        btn.addEventListener('click', (e) => this.handleCopy(e, btn));
      });
    }

    /** Wrap the charcounter element so count reflects the target textarea */
    updateCharCount(area) {
      const counter = this.form.querySelector(`${CONFIG.selectors.formCharCount}[data-for="${area.id}"]`);
      if (!counter) return;
      const max = Number(area.getAttribute('maxlength')) || Infinity;
      const len = area.value.length;
      counter.textContent = `${len}${isFinite(max) ? ` / ${max}` : ''}`;
      toggleClass(counter, 'is-warning', isFinite(max) && len >= max - 20);
      toggleClass(counter, 'is-full', len >= max);
    }

    /** Copy a contact value to the clipboard with visual feedback */
    handleCopy(e, btn) {
      e.preventDefault();
      const card = btn.closest('.hire-card');
      const value = card?.querySelector('[data-copy-value]')?.textContent.trim()
        || btn.dataset.copyValue;
      if (!value) return;
      const done = () => {
        addClass(btn, 'is-copied');
        btn.setAttribute('aria-label', 'Copied!');
        setTimeout(() => {
          removeClass(btn, 'is-copied');
          btn.setAttribute('aria-label', btn.dataset.tooltip || 'Copy to clipboard');
        }, 1800);
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(done);
      } else {
        done(); // graceful fallback — clipboard API unavailable
      }
    }

    /** Per-field validation */
    validateField(field) {
      const value = field.value.trim();
      const name = field.name;
      const errors = [];

      if (name === 'name' && value.length < CONFIG.validation.minNameLength) {
        errors.push('Please enter your name.');
      }
      if (name === 'email' && !CONFIG.validation.email.test(value)) {
        errors.push('Please enter a valid email address.');
      }
      if (name === 'message' && value.length < CONFIG.validation.minMessageLength) {
        errors.push('Message must be at least 10 characters.');
      }
      if (name === 'projectType' && !value) {
        errors.push('Please choose a project type.');
      }
      if (name === 'subject' && !value) {
        errors.push('This field is required.');
      }
      // Everything else must be filled unless explicitly optional
      if (
        !CONFIG.validation.optional.includes(name) &&
        !['subject', 'projectType'].includes(name) &&
        !value
      ) {
        errors.push('This field is required.');
      }

      toggleClass(field, 'is-invalid', errors.length > 0);
      field.setAttribute('aria-invalid', errors.length > 0 ? 'true' : 'false');
      return errors;
    }

    clearError(field) {
      removeClass(field, 'is-invalid');
      field.setAttribute('aria-invalid', 'false');
      if (this.status) {
        this.status.textContent = '';
        removeClass(this.status, 'is-error');
      }
    }

    /**
     * EmailJS delivery path (placeholder). No-ops gracefully when the
     * library is absent or `CONFIG.emailjs.enabled` is false.
     */
    async sendEmail(payload) {
      const cfg = CONFIG.emailjs;
      if (!cfg.enabled || typeof window.emailjs === 'undefined') return null;
      window.emailjs.init(cfg.publicKey);
      return window.emailjs
        .send(cfg.serviceId, cfg.templateId, payload)
        .then((res) => res)
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[ANIS OS] EmailJS failed:', err);
          return null;
        });
    }

    /** Collect all supported fields into a plain template object */
    collectPayload() {
      const wanted = ['name', 'email', 'company', 'phone', 'country', 'subject', 'projectType', 'budget', 'timeline', 'message'];
      const payload = {};
      wanted.forEach((name) => {
        const el = this.form.elements[name];
        if (el) payload[name] = el.value.trim();
      });
      return payload;
    }

    /** Form submit handler with (optionally real) email delivery */
    async handleSubmit(e) {
      e.preventDefault();

      const fields = ['name', 'email', 'company', 'phone', 'country', 'subject', 'projectType', 'budget', 'timeline', 'message']
        .map((name) => this.form.elements[name])
        .filter(Boolean);

      const hasErrors = fields.some((field) => this.validateField(field).length > 0);
      if (hasErrors) {
        this.setStatus('Please correct the highlighted fields.', true);
        return;
      }

      const submitBtn = this.form.querySelector(CONFIG.selectors.formSubmit);
      const original = submitBtn?.innerHTML;
      const payload = this.collectPayload();

      // Transmitting state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Transmitting…';
        addClass(submitBtn, 'is-loading');
      }
      this.setStatus('Opening secure channel…', false);

      // Real delivery when EmailJS is configured; otherwise simulated (placeholder)
      const sent = await this.sendEmail(payload);
      if (CONFIG.emailjs.enabled && sent) {
        this.setStatus('Transmission received — I will reply shortly.', false);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1400));
        this.setStatus('Transmission received — I will reply shortly.', false);
      }

      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-check me-2"></i>Sent';
        addClass(submitBtn, 'is-sent');
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = original;
          removeClass(submitBtn, 'is-sent');
          this.form.reset();
          this.setStatus('', false);
        }, 3200);
      }
    }

    setStatus(message, isError) {
      if (!this.status) return;
      this.status.textContent = message;
      toggleClass(this.status, 'is-error', isError);
    }
  }

  /* ====================================================================
   * 18b. TERMINAL FOOTER — OS shutdown screen wiring:
   *      theme readout, uptime clock, marquee loop, dev console (Ctrl+Shift+A)
   * ================================================================== */
  class TerminalFooter {
    constructor() {
      this.footer = $(CONFIG.selectors.terminalFooter);
      this.console = $(CONFIG.selectors.devConsole);
    }

    init() {
      if (!this.footer) return;
      this.bindThemeReadout();
      this.bindUptime();
      this.renderStack();
      this.bindDevConsole();
    }

    /** Reflect the active theme in the System Information panel */
    bindThemeReadout() {
      const themeEl = $(CONFIG.selectors.footerTheme, this.footer);
      if (!themeEl) return;

      const update = () => {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        themeEl.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      };
      update();
      document.addEventListener('anis:theme-changed', update);
    }

    /** Live clock + timezone (placeholder-grade, real Intl data) */
    bindUptime() {
      const yearEl = $(CONFIG.selectors.currentYear, this.footer);
      const timeEl = $(CONFIG.selectors.localTime, this.footer);
      const tzEl = $(CONFIG.selectors.timezone, this.footer);

      if (yearEl) yearEl.textContent = new Date().getFullYear();
      if (tzEl) {
        try {
          tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Timezone';
        } catch {
          tzEl.textContent = 'Local Timezone';
        }
      }
      if (timeEl) {
        const tick = () => {
          timeEl.textContent = new Intl.DateTimeFormat([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date());
        };
        tick();
        setInterval(tick, 1000);
      }
    }

    /** Build + duplicate the tech-stack marquee for a seamless loop */
    renderStack() {
      const marquee = $(CONFIG.selectors.stackMarquee, this.footer);
      const track = marquee?.querySelector('.tf-marquee__track');
      if (!marquee || !track || track.dataset.rendered) return;
      track.dataset.rendered = 'true';

      // Duplicate the chips so translateX(-50%) loops seamlessly
      track.appendChild(track.cloneNode(true));

      const devStack = $(CONFIG.selectors.devStack);
      if (devStack) devStack.textContent = CONFIG.terminalFooter.stack.join(' · ');
    }

    /** Developer Console modal — Ctrl+Shift+A + footer trigger + Esc */
    bindDevConsole() {
      const openBtn = $(CONFIG.selectors.devConsoleOpen, this.footer);
      const closeBtn = $(CONFIG.selectors.devConsoleClose);
      if (!this.console) return;

      const commands = $(CONFIG.selectors.devConsole + ' .tf-console-cmds');
      if (commands) commands.textContent = CONFIG.terminalFooter.consoleCommands;

      const open = () => { this.console.hidden = false; };
      const close = () => { this.console.hidden = true; };

      openBtn?.addEventListener('click', open);
      closeBtn?.addEventListener('click', close);
      this.console.addEventListener('click', (e) => {
        if (e.target === this.console) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.console.hidden) close();
        // Secret shortcut: Ctrl + Shift + A
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
          e.preventDefault();
          if (this.console.hidden) open();
          else close();
        }
      });
    }
  }

  /* ====================================================================
   * 19. DATARENDERER — Hydrate feeds from assets/js/data.js
   * ================================================================== */
  class DataRenderer {
    constructor() {
      this.data = window.ANIS_OS_DATA || null;
      this.mapping = {
        timeline:       ['timelineFeed', 'timeline'],
        github:         ['githubFeed', 'github'],
        services:       ['servicesFeed', 'services'],
        learning:       ['learningFeed', 'learning'],
        testimonials:   ['testimonialsFeed', 'testimonials'],
      };
    }

    /**
     * Iterates the mapping and, when data exists, delegates to the
     * matching renderer. Resolves with a boolean: true = feeds injected.
     */
    render() {
      if (!this.data) return Promise.resolve(false);

      const jobs = Object.entries(this.mapping)
        .filter(([key]) => this.data[key])
        .map(([key, [selectorKey, dataKey]]) => {
          const feed = $(CONFIG.selectors[selectorKey]);
          if (!feed) return Promise.resolve();
          return this.build(feed, key, this.data[dataKey]);
        });

      return Promise.all(jobs).then(() => true);
    }

    /** Dispatch to the correct markup builder per feed type */
    build(feed, type, items) {
      const builders = {
        timeline: () => this.renderTimeline(feed, items),
        services: () => this.renderServices(feed, items),
        learning: () => this.renderLearning(feed, items),
        testimonials: () => this.renderTestimonials(feed, items),
      };

      const builder = builders[type];
      if (builder) builder();
      return Promise.resolve();
    }

    /* ----- Feed builders ------------------------------------------- */

    renderTimeline(feed, items) {
      feed.innerHTML = items.map((item) => `
        <div class="timeline__item">
          <span class="timeline__node" aria-hidden="true"></span>
          <div class="timeline__card">
            <span class="timeline__date">${item.date || ''}</span>
            <h3 class="timeline__title">${item.title || ''}</h3>
            <p class="timeline__body">${item.description || ''}</p>
          </div>
        </div>
      `).join('');
    }

    renderServices(feed, items) {
      feed.innerHTML = `
        <div class="services__grid">
          ${items.map((item, i) => `
            <div class="service-card" data-index="${String(i + 1).padStart(2, '0')}">
              <span class="service-card__icon"><i class="${item.icon || 'fa-solid fa-layer-group'}"></i></span>
              <h3 class="service-card__title">${item.title || ''}</h3>
              <p class="service-card__body">${item.description || ''}</p>
              <a href="#contact" class="service-card__link">${item.cta || 'Request service'} <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          `).join('')}
        </div>
      `;
    }

    renderLearning(feed, items) {
      feed.innerHTML = items.map((item) => `
        <div class="col-12 col-md-6 col-lg-4">
          <article class="card-premium p-4 h-100" data-aos="fade-up">
            <i class="${item.icon || 'fa-solid fa-graduation-cap'} text-gradient fs-3 mb-3"></i>
            <h3 class="fs-5 mb-2">${item.title || ''}</h3>
            <p class="text-muted small mb-0">${item.provider || ''} · ${item.year || ''}</p>
          </article>
        </div>
      `).join('');
    }

    renderTestimonials(feed, items) {
      feed.innerHTML = items.map((item) => `
        <div class="swiper-slide">
          <figure class="card-premium p-5 h-100">
            <blockquote class="mb-4">
              <i class="fa-solid fa-quote-left text-gradient me-2"></i>
              <p class="mb-0">${item.quote || ''}</p>
            </blockquote>
            <figcaption>
              <strong class="d-block">${item.name || ''}</strong>
              <span class="text-muted small">${item.role || ''}</span>
            </figcaption>
          </figure>
        </div>
      `).join('');
    }
  }

  /* ====================================================================
   * 20. PERFORMANCE — Passive listeners, lazy images, rAF timing
   * ================================================================== */
  class PerformanceMonitor {
    constructor() {
      this.initLazyImages();
      this.initFpsMeter();
    }

    /** IntersectionObserver lazy-loading for [data-src] images */
    initLazyImages() {
      const images = $$('img[data-src]');
      if (images.length === 0) return;

      const load = (img) => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.addEventListener('load', () => addClass(img, 'is-loaded'));
      };

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              load(entry.target);
              io.unobserve(entry.target);
            }
          });
        }, { rootMargin: '200px 0px' });
        images.forEach((img) => io.observe(img));
      } else {
        images.forEach(load);
      }
    }

    /** Lightweight FPS readout for the dev console */
    initFpsMeter() {
      let frames = 0;
      let last = performance.now();

      const tick = () => {
        frames += 1;
        const now = performance.now();
        if (now - last >= 1000) {
          window.__ANIS_FPS__ = frames;
          frames = 0;
          last = now;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ====================================================================
   * 21. BOOT SEQUENCE — Document lifecycle orchestration
   * ================================================================== */

  // DOM is fully parsed — safe to build every module
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  // Every asset (fonts, images, canvases) is loaded — start heavy work
  window.addEventListener('load', () => App.onLoad(), { once: true });

  // Safety net: never let the boot screen hang the page
  setTimeout(() => {
    if ($(CONFIG.selectors.loader) && !document.documentElement.classList.contains('is-booted')) {
      App.modules.loader?.forceComplete();
      App.onLoad();
    }
  }, 8000);

  /* ====================================================================
   * 22. DEVELOPER CONSOLE — branded greeting (fires immediately)
   * ================================================================== */
  (function printConsoleBanner() {
    /* eslint-disable no-console */
    console.log(
      '%c▄▀█ ██░ █ █▀▄ █▀█ ▄▄▄    ▄▀█ █▀ ▄█▀▄',
      'color:#06B6D4;font-family:monospace;font-size:13px;font-weight:bold;',
    );
    console.log(
      '%c▀▀█ █▄█ █▄▀ █▀▄ █▄█     █▀█ █▀ ▀▀█▀▀',
      'color:#4F46E5;font-family:monospace;font-size:13px;font-weight:bold;',
    );
    console.log(
      '%c  ANIS OS — Designed & Developed by Anis Ansari  ',
      'background:#050816;color:#FFFFFF;padding:10px 16px;border-radius:8px;font-family:Inter,sans-serif;font-weight:600;letter-spacing:0.5px;',
    );
    console.log(
      '%c  Senior Frontend Developer | React.js | UI/UX | AI  ',
      'background:linear-gradient(90deg,#4F46E5,#8B5CF6);color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;',
    );
    /* eslint-enable no-console */
  })();
})(window, document);
