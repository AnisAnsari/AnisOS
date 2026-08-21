/**
 * ============================================================================
 *  ANIS OS — ANIMATION ENGINE (animation.js)
 * ============================================================================
 *  Project    : ANIS OS — Ultra-Premium Futuristic Portfolio
 *  Author     : Anis Ansari
 *  Version    : 1.0.0
 *  File       : assets/js/animation.js
 *  Stack      : Vanilla JS (ES6) | GSAP + ScrollTrigger | AOS | Particles.js
 *               Vanilla Tilt | CountUp | Swiper | Lottie | Bootstrap 5
 *
 *  Objective  : A world-class, dependency-guarded animation layer comparable
 *               to Apple / Linear / Framer / Stripe / Vercel. All motion is
 *               batched through a PerformanceManager (rAF, passive listeners,
 *               visibility-aware pausing, destroyable contexts) and fully
 *               honours prefers-reduced-motion.
 *
 *  COORDINATION
 *  ──────────────────────────────────────────────────────────────────────────
 *  animation.js is the authoritative motion layer. It exposes
 *  `window.ANIS_OS_ANIMATIONS` with a `features` map; app.js reads those
 *  flags and stands down its inline fallbacks, so no module double-runs.
 *
 *  MODULE MAP
 *  ──────────────────────────────────────────────────────────────────────────
 *  PerformanceManager  — rAF registry, IO registry, tab-pause, destroy
 *  AnimationEngine     — orchestrator + refresh() + event bus
 *  LoaderAnimation     — boot progress, hint cycling, exit choreography
 *  HeroAnimation       — entrance timeline, mouse parallax, floating glow
 *  NavbarAnimation     — entrance, scroll-aware glass intensity
 *  ScrollAnimation     — progress bar, [data-parallax], [data-pin] prep
 *  CardAnimation       — Vanilla Tilt + glow sheen management
 *  CursorAnimation     — glow dot, follower ring, magnetic, text state
 *  ParticleAnimation   — particles.js network, floating orbs, noise layer
 *  CounterAnimation    — CountUp.js with rAF fallback, IO-triggered
 *  TextAnimation       — char/word splitter, [data-split] stagger
 *  SectionAnimation    — reveal on scroll, stagger groups, icon bounces
 *  TimelineAnimation   — card reveals, glowing dots, progress line
 *  AboutAnimation      — dashboard stagger, parallax, floating icons
 *  ExperienceAnimation — career journey reveals, progress spine
 *  AILabAnimation      — lab stagger, workflow sequence, skill toggles
 *  SkillsAnimation      — tech wall reveal with category/item stagger
 *  FeaturedProjectsAnimation — carousel, filters/search, case-study modal,
 *                              gallery zoom, fullscreen + lightbox
 *  ThemeTransition     — 400ms blur/scale pulse on theme change
 * ============================================================================
 */
'use strict';

(function (window, document) {
  'use strict';

  /* ====================================================================
   * 01. CORE HELPERS — tiny, dependency-free
   * ================================================================== */

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const hasClass = (el, name) => el && el.classList.contains(name);
  const addClass = (el, ...names) => el && el.classList.add(...names);
  const removeClass = (el, ...names) => el && el.classList.remove(...names);
  const toggleClass = (el, name, force) => el && el.classList.toggle(name, force);

  /** Respect users who prefer reduced motion */
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Desktop pointer (mouse + trackpad) */
  const hasFinePointer = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** Debounce — trailing-edge pause detection */
  function debounce(fn, wait = 150) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Throttle — leading-edge rate limiter */
  function throttle(fn, limit = 100) {
    let ready = true;
    return function throttled(...args) {
      if (!ready) return;
      ready = false;
      fn.apply(this, args);
      setTimeout(() => { ready = true; }, limit);
    };
  }

  /* ====================================================================
   * 02. PERFORMANCE MANAGER — motion lifecycle authority
   * ================================================================== */
  class PerformanceManager {
    constructor() {
      this.raf = new Set();        // active requestAnimationFrame ids
      this.timelines = new Set();  // active GSAP timelines
      this.observers = new Set();  // active IntersectionObservers
      this.swipers = new Set();    // active Swiper instances
      this.suspended = false;
    }

    /** Schedule work; track the id for cleanup */
    tick(callback) {
      const id = requestAnimationFrame(callback);
      this.raf.add(id);
      return id;
    }

    cancelTick(id) {
      cancelAnimationFrame(id);
      this.raf.delete(id);
    }

    /** Register a GSAP timeline for global control */
    registerTimeline(timeline) {
      if (timeline) this.timelines.add(timeline);
      return timeline;
    }

    /** Create + track an IntersectionObserver */
    createObserver(callback, options = {}) {
      const io = new IntersectionObserver(callback, options);
      this.observers.add(io);
      return io;
    }

    /** Passive-listener helper that reads well at call sites */
    on(target, eventName, handler, options = {}) {
      target.addEventListener(eventName, handler, { passive: true, ...options });
    }

    /**
     * Pause all motion when the tab is hidden; resume when visible again.
     * This keeps the composition smooth and the GPU quiet in the background.
     */
    pauseOnTabHidden() {
      const pause = () => {
        this.suspended = document.hidden;
        if (this.suspended) {
          this.timelines.forEach((tl) => tl.pause());
          if (window.gsap?.globalTimeline) window.gsap.globalTimeline.pause();
          this.swipers.forEach((s) => s.autoplay?.stop?.());
        } else {
          this.timelines.forEach((tl) => tl.resume());
          if (window.gsap?.globalTimeline) window.gsap.globalTimeline.resume();
          this.swipers.forEach((s) => s.autoplay?.start?.());
        }
      };
      document.addEventListener('visibilitychange', pause, { passive: true });
    }

    /** Tear down every animation this engine created */
    destroy() {
      this.raf.forEach((id) => cancelAnimationFrame(id));
      this.raf.clear();
      this.timelines.forEach((tl) => tl.kill());
      this.timelines.clear();
      this.observers.forEach((io) => io.disconnect());
      this.observers.clear();
      this.swipers.forEach((s) => s.destroy?.(true, true));
      this.swipers.clear();
    }
  }

  /* ====================================================================
   * 03. ANIMATION ENGINE — orchestrator & public refresh()
   * ================================================================== */
  class AnimationEngine {
    constructor() {
      this.perf = new PerformanceManager();
      this.gsap = window.gsap || null;
      this.reduced = prefersReducedMotion();
      this.finePointer = hasFinePointer();
      this.handlers = {};
      this.modules = {};

      // Libraries
      this.ScrollTrigger = window.ScrollTrigger || null;
      if (this.gsap && this.ScrollTrigger) this.gsap.registerPlugin(this.ScrollTrigger);

      // Track already-initialized Swiper hosts to keep refresh() idempotent
      this.swiperHosts = new Set();

      // Dedupe set for counters & reveals
      this.observedCounters = new WeakSet();
      this.observedReveals = new WeakSet();
    }

    /* ----- Tiny event bus ----- */

    on(name, fn) {
      (this.handlers[name] ||= []).push(fn);
      return this;
    }

    emit(name, payload) {
      (this.handlers[name] || []).forEach((fn) => fn(payload));
      return this;
    }

    /* ----- Boot ----- */

    /**
     * Run a module's init defensively: a single failing module must never
     * take down the rest of the engine (especially AOS, which reveals every
     * `[data-aos]` section title on the page).
     */
    safeInit(name, module) {
      if (!module || typeof module.init !== 'function') return;
      try {
        module.init();
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn(`[ANIS OS] Module "${name}" failed to initialise:`, err);
        }
      }
    }

    init() {
      // 1. Loader first (locks the composition during boot)
      this.modules.loader = new LoaderAnimation(this);
      this.safeInit('loader', this.modules.loader);

      // 2. Prepare hero for GSAP (disable AOS on hero to avoid double-reveal)
      this.disableAOSOnHero();

      // 3. Ambient background layers (orbs, noise, particles)
      this.modules.particles = new ParticleAnimation(this);
      this.safeInit('particles', this.modules.particles);

      // 4. Scroll systems (progress, parallax, reveals)
      this.modules.scroll = new ScrollAnimation(this);
      this.safeInit('scroll', this.modules.scroll);

      this.modules.sections = new SectionAnimation(this);
      this.safeInit('sections', this.modules.sections);

      // 5. Component animation systems
      this.modules.cursor = new CursorAnimation(this);
      this.safeInit('cursor', this.modules.cursor);

      this.modules.counter = new CounterAnimation(this);
      this.safeInit('counter', this.modules.counter);

      this.modules.text = new TextAnimation(this);
      this.safeInit('text', this.modules.text);

      this.modules.navbar = new NavbarAnimation(this);
      this.safeInit('navbar', this.modules.navbar);

      this.modules.cards = new CardAnimation(this);
      this.safeInit('cards', this.modules.cards);

      this.modules.timeline = new TimelineAnimation(this);
      this.safeInit('timeline', this.modules.timeline);

      this.modules.about = new AboutAnimation(this);
      this.safeInit('about', this.modules.about);

      this.modules.experience = new ExperienceAnimation(this);
      this.safeInit('experience', this.modules.experience);

      this.modules.aiLab = new AILabAnimation(this);
      this.safeInit('aiLab', this.modules.aiLab);

      this.modules.skills = new SkillsAnimation(this);
      this.safeInit('skills', this.modules.skills);

      this.modules.expertise = new ExpertiseAnimation(this);
      this.safeInit('expertise', this.modules.expertise);

      this.modules.projects = new FeaturedProjectsAnimation(this);
      this.safeInit('projects', this.modules.projects);

      this.modules.developer = new DeveloperDashboardAnimation(this);
      this.safeInit('developer', this.modules.developer);

      this.modules.roadmap = new RoadmapAnimation(this);
      this.safeInit('roadmap', this.modules.roadmap);

      this.modules.achievements = new AchievementsAnimation(this);
      this.safeInit('achievements', this.modules.achievements);

      this.modules.recommendations = new RecommendationsAnimation(this);
      this.safeInit('recommendations', this.modules.recommendations);

      this.modules.knowledgeHub = new KnowledgeHubAnimation(this);
      this.safeInit('knowledgeHub', this.modules.knowledgeHub);

      this.modules.terminalFooter = new TerminalFooterAnimation(this);
      this.safeInit('terminalFooter', this.modules.terminalFooter);

      this.modules.theme = new ThemeTransition(this);
      this.safeInit('theme', this.modules.theme);

      // AOS last so `[data-aos]` never fights GSAP on the hero
      this.initAOS();

      // Tab visibility pausing
      this.perf.pauseOnTabHidden();
    }

    /** Run after the loader has exited (window load path) */
    start() {
      this.modules.hero = new HeroAnimation(this);
      this.modules.hero.init();
    }

    /**
     * Called by app.js (or any renderer) once data feeds are injected.
     * Re-scans counters/reveals/tilt and (re)builds Swiper carousels —
     * all idempotent.
     */
    refresh() {
      if (window.AOS) window.AOS.refreshHard();
      this.modules.counter?.rescan();
      this.modules.sections?.rescan();
      this.modules.cards?.rescan();
      this.modules.timeline?.rescan();
      this.modules.experience?.rescan();
      this.modules.aiLab?.rescan();
      this.modules.skills?.rescan();
      this.modules.expertise?.rescan();
      this.modules.projects?.rescan();
      this.modules.developer?.rescan();
      this.modules.roadmap?.rescan();
      this.modules.achievements?.rescan();
      this.modules.recommendations?.rescan();
      this.modules.knowledgeHub?.rescan();
      this.modules.terminalFooter?.rescan();
      this.initSwiper();
      this.modules.scroll?.refresh();
    }

    /* ----- AOS ----- */

    initAOS() {
      // If the AOS library never loaded, force every `[data-aos]` element
      // visible so section titles & content are never blanked by CDN failure.
      if (!window.AOS) {
        this.enableAOSFallback();
        return;
      }
      try {
        window.AOS.init({
          duration: 800,
          easing: 'ease-out-cubic',
          once: true,
          offset: 80,
          anchorPlacement: 'top-bottom',
        });
      } catch (err) {
        this.enableAOSFallback();
        return;
      }
      // Sanity check: AOS.appied marks elements `.aos-init`. If none were
      // initialised, treat the library as broken and reveal everything.
      if (document.querySelectorAll('[data-aos].aos-init').length === 0) {
        this.enableAOSFallback();
      }
    }

    /**
     * Hard fail-safe for scroll-reveals: switches the document into
     * `aos-fallback` mode (CSS makes every [data-aos] fully visible) and
     * also strips any pre-applied inline hidden state.
     */
    enableAOSFallback() {
      const root = document.documentElement;
      if (!root.classList.contains('aos-fallback')) root.classList.add('aos-fallback');
      $$('[data-aos]').forEach((el) => {
        el.classList.remove('aos-init', 'aos-animate');
        if (el.style.opacity === '0') el.style.opacity = '';
      });
    }

    /**
     * Hero motion is owned by GSAP here, so strip AOS hooks from the hero
     * before AOS.init() runs to prevent double-reveal flicker.
     */
    disableAOSOnHero() {
      const hero = $('#hero');
      if (!hero) return;
      $$('[data-aos]', hero).forEach((el) => {
        el.removeAttribute('data-aos');
        el.classList.remove('aos-init', 'aos-animate');
      });
    }

    /* ----- Swiper ----- */

    initSwiper() {
      if (!window.Swiper) return;

      $$('[data-swiper]').forEach((el) => {
        if (this.swiperHosts.has(el)) return;
        const mode = el.dataset.swiper;
        const slides = el.querySelectorAll('.swiper-slide');

        // No slides yet (feed not injected) → defer until refresh()
        if (slides.length === 0) return;

        const config = {
          experience: {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            grabCursor: true,
            autoplay: { delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true },
            pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
            breakpoints: { 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } },
          },
          testimonials: {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            grabCursor: true,
            autoplay: { delay: 5200, disableOnInteraction: false, pauseOnMouseEnter: true },
            navigation: {
              nextEl: el.querySelector('.swiper-button-next'),
              prevEl: el.querySelector('.swiper-button-prev'),
            },
            pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
            breakpoints: { 768: { slidesPerView: 2 } },
          },
          projects: {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            grabCursor: true,
            autoplay: { delay: 5600, disableOnInteraction: false, pauseOnMouseEnter: true },
            pagination: { el: el.querySelector('.projects-swiper__pagination'), clickable: true },
            breakpoints: { 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } },
          },
          'hub-videos': {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            grabCursor: true,
            autoplay: { delay: 5200, disableOnInteraction: false, pauseOnMouseEnter: true },
            pagination: { el: el.querySelector('.hub-videos__pagination'), clickable: true },
            breakpoints: { 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } },
          },
        }[mode] || { slidesPerView: 1, spaceBetween: 24 };

        const instance = new window.Swiper(el, config);
        this.swiperHosts.add(el);
        this.perf.swipers.add(instance);
      });
    }
  }

  /* ====================================================================
   * 04. LOADER ANIMATION — boot screen choreography
   * ================================================================== */
  class LoaderAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.loader = $('#loader');
      this.bar = $('[data-loader-bar]');
      this.hint = $('[data-loader-hint]');
      this.startedAt = performance.now();
      this.hintIndex = 0;
      this.hints = [
        'Initializing environment…',
        'Loading core modules…',
        'Warming shaders…',
        'Compositing pixels…',
        'Booting interface…',
        'Ready.',
      ];
    }

    init() {
      if (!this.loader) return;

      // Logo intro (the mark already spins via CSS)
      if (this.gsap && !this.engine.reduced) {
        this.gsap.from('.loader__logo', {
          scale: 0.85,
          opacity: 0,
          duration: 0.8,
          ease: 'power4.out',
        });
        this.gsap.from('.loader__logo-mark', {
          y: -20,
          opacity: 0,
          rotate: -90,
          duration: 0.7,
          ease: 'power3.out',
        });
      }

      // Loading-text typewriter cycle
      this.cycleHints();

      // Drive the progress bar with GSAP (CSS fallback animation also present)
      if (this.gsap && this.bar && !this.engine.reduced) {
        this.gsap.to(this.bar, { width: '100%', duration: 2.1, ease: 'power2.inOut' });
      }

      // Safety net: never allow the boot screen to trap the page
      setTimeout(() => {
        if (!hasClass(this.loader, 'is-hidden')) this.hide();
      }, 6000);
    }

    /** Rotate through boot hints like a real kernel */
    cycleHints() {
      if (!this.hint) return;
      if (this.engine.reduced) {
        this.hint.textContent = 'Initializing…';
        return;
      }

      const step = () => {
        if (hasClass(this.loader, 'is-hidden')) return;
        this.hintIndex = (this.hintIndex + 1) % this.hints.length;
        const next = this.hints[this.hintIndex];

        const reveal = () => {
          if (!this.hint || hasClass(this.loader, 'is-hidden')) return;
          this.hint.textContent = next;
          if (this.gsap) {
            this.gsap.fromTo(this.hint, { opacity: 0 }, { opacity: 1, duration: 0.35 });
          }
        };

        // Fade out, swap, fade in
        if (this.gsap) {
          this.gsap.to(this.hint, {
            opacity: 0,
            duration: 0.2,
            onComplete: reveal,
          });
        } else {
          reveal();
        }

        setTimeout(step, 650);
      };

      setTimeout(step, 500);
    }

    /**
     * Finish the boot: enforce a minimum brand presence (~2.4s), fade the
     * loader out, then signal the hero to play its entrance.
     * @returns {Promise<void>}
     */
    finish() {
      return new Promise((resolve) => {
        const elapsed = performance.now() - this.startedAt;
        const wait = Math.max(0, 2400 - elapsed);

        setTimeout(() => {
          this.hide();
          this.engine.emit('loader-done');
          resolve();
        }, wait);
      });
    }

    /** Fade + slide the whole boot screen away */
    hide() {
      if (!this.loader) return;
      if (this.gsap && !this.engine.reduced) {
        this.gsap.to(this.loader, {
          autoAlpha: 0,
          yPercent: -6,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: () => addClass(this.loader, 'is-hidden'),
        });
      } else {
        addClass(this.loader, 'is-hidden');
      }
    }
  }

  /* ====================================================================
   * 05. HERO ANIMATION — entrance, mouse parallax, floating glow
   * ================================================================== */
  class HeroAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.visual = $('.hero__visual');
    }

    init() {
      if (!this.gsap) return;

      // The hero entrance begins after the loader dissolves
      this.engine.on('loader-done', () => this.playEntrance());
      setTimeout(() => this.playEntrance(), 3000);

      // Continuous systems
      this.mouseParallax();
      this.floatGlow();
      this.initMouseGlow();
      this.initRipple();
      this.initRings();
      this.initShapes();
    }

    /** Staggered GSAP entrance for every hero block */
    playEntrance() {
      if (!this.gsap || !this.engine || this.played) return;
      this.played = true;

      const tl = this.engine.perf.registerTimeline(
        this.gsap.timeline({ defaults: { ease: 'power3.out' } }),
      );

      tl.from('[data-hero-eyebrow]', { y: -18, opacity: 0, duration: 0.6 })
        .from('.hero__label', { y: 14, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.hero__title', { y: 48, opacity: 0, duration: 0.9, ease: 'power4.out' }, '-=0.4')
        .from('.hero__subtitle', { y: 24, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.hero__desc', { y: 24, opacity: 0, duration: 0.6 }, '-=0.5')
        .from('.btn-hero', { y: 20, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.45')
        .from(this.visual, { y: 56, opacity: 0, scale: 0.92, duration: 1.0, ease: 'power4.out' }, '-=0.7')
        .from('.hero__scroll', { opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-orb, .hero-shape', { opacity: 0, duration: 1.4, stagger: 0.12 }, '-=0.5');
    }

    /**
     * Depth-based parallax: the profile card drifts toward the pointer.
     * Disabled on coarse pointers and reduced-motion setups.
     */
    mouseParallax() {
      if (!this.visual || !this.gsap || !this.engine.finePointer || this.engine.reduced) return;

      let targetX = 0;
      let targetY = 0;

      this.engine.perf.on(window, 'mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 … 1
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        targetX = x * 14;
        targetY = y * 14;
      });

      const drift = () => {
        if (this.engine.perf.suspended) {
          requestAnimationFrame(drift);
          return;
        }
        // Constant lerp for buttery trailing
        this.gsap.to(this.visual, {
          x: targetX,
          y: targetY,
          rotateY: targetX * 0.5,
          rotateX: -targetY * 0.5,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        requestAnimationFrame(drift);
      };
      requestAnimationFrame(drift);
    }

    /** Gentle perpetual float for the profile card */
    floatGlow() {
      if (!this.visual || !this.gsap) return;
      this.engine.perf.registerTimeline(
        this.gsap.to(this.visual, {
          y: -12,
          duration: 4,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        }),
      );
    }

    /** Soft radial glow that trails the pointer across the hero */
    initMouseGlow() {
      const glow = $('[data-hero-mouse-glow]');
      const hero = $('#hero');
      if (!glow || !hero || !this.engine.finePointer || this.engine.reduced) return;

      let targetX = 0;
      let targetY = 0;

      this.engine.perf.on(hero, 'mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        targetX = e.clientX - rect.left - glow.offsetWidth / 2;
        targetY = e.clientY - rect.top - glow.offsetHeight / 2;
      });

      const drift = () => {
        if (this.engine.perf.suspended) {
          requestAnimationFrame(drift);
          return;
        }
        this.gsap.to(glow, {
          x: targetX,
          y: targetY,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        requestAnimationFrame(drift);
      };
      requestAnimationFrame(drift);
    }

    /** Material ripple on CTA clicks */
    initRipple() {
      $$('[data-ripple]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const rect = btn.getBoundingClientRect();
          const ripple = document.createElement('span');
          const size = Math.max(rect.width, rect.height) * 2;
          ripple.className = 'ripple';
          ripple.style.width = `${size}px`;
          ripple.style.height = `${size}px`;
          ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
          ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
          btn.appendChild(ripple);
          setTimeout(() => ripple.remove(), 700);
        });
      });
    }

    /** Animate the profile-card progress rings when they scroll into view */
    initRings() {
      const group = $('[data-ring-group]');
      if (!group) return;

      const CIRCUMFERENCE = 326.73; // 2 * PI * 52

      const animateRing = (ring) => {
        const circle = ring.querySelector('[data-ring-circle]');
        const pct = Number(ring.dataset.ring || 0);
        const target = CIRCUMFERENCE * (1 - pct / 100);

        if (this.gsap && !this.engine.reduced) {
          this.engine.perf.registerTimeline(
            this.gsap.to(circle, {
              strokeDashoffset: target,
              duration: 1.6,
              ease: 'power3.inOut',
            }),
          );
        } else {
          circle.style.strokeDashoffset = target;
        }
      };

      const io = this.engine.perf.createObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            $$('.ring', group).forEach(animateRing);
            io.disconnect();
          });
        },
        { threshold: 0.4 },
      );
      io.observe(group);
    }

    /** Parallax the floating glass shapes at different depths */
    initShapes() {
      const shapes = $$('.hero-shape');
      if (shapes.length === 0 || !this.gsap || !this.engine.ScrollTrigger || this.engine.reduced) return;

      shapes.forEach((shape, i) => {
        const speed = 0.08 + i * 0.03;
        this.engine.perf.registerTimeline(
          this.gsap.to(shape, {
            yPercent: -22,
            ease: 'none',
            scrollTrigger: {
              trigger: '#hero',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          }),
        );
        // eslint-disable-next-line no-unused-vars
        void speed;
      });
    }
  }

  /* ====================================================================
   * 06. NAVBAR ANIMATION — entrance + scroll-aware glass
   * ================================================================== */
  class NavbarAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.header = $('#site-header');
    }

    init() {
      // Overlay open/close is class-driven without GSAP (CSS transition)
      if (!this.gsap || this.engine.reduced) return;

      // Slide the header into place after boot
      this.engine.on('loader-done', () => this.playEntrance());
      setTimeout(() => this.playEntrance(), 3200);

      // Scroll-aware glass intensity (blur ramps as the user scrolls)
      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            this.header,
            { '--navbar-blur': '0px' },
            {
              '--navbar-blur': '20px',
              ease: 'none',
              scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: '+=300',
                scrub: true,
              },
            },
          ),
        );
      }

      this.bindLinkMicros();
      this.bindOverlay();
    }

    playEntrance() {
      if (!this.header || this.played) return;
      this.played = true;
      this.gsap.fromTo(
        this.header,
        { yPercent: -120, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'all', // hand transform back to CSS (.is-hidden)
        },
      );
    }

    /** Subtle lift on the brand + resume button when hovered */
    bindLinkMicros() {
      const micros = [
        $('.site-navbar__brand'),
        $('.btn-site-nav'),
      ].filter(Boolean);

      if (micros.length === 0 || !this.engine.finePointer) return;

      micros.forEach((el) => {
        el.addEventListener('mouseenter', () =>
          this.gsap.to(el, { y: -2, duration: 0.25, ease: 'power2.out' }),
        );
        el.addEventListener('mouseleave', () =>
          this.gsap.to(el, { y: 0, duration: 0.3, ease: 'power2.out' }),
        );
      });
    }

    /**
     * Choreograph the mobile fullscreen menu. app.js drives the state
     * through aria-hidden; a MutationObserver mirrors it into GSAP.
     */
    bindOverlay() {
      const overlay = $('#mobileNav');
      if (!overlay || !('MutationObserver' in window)) return;

      const inner = $('.site-navbar__overlay-inner', overlay);
      const links = $$('[data-nav-link]', overlay);
      const extras = $$(
        '.site-navbar__overlay-head, .site-navbar__overlay-actions, .site-navbar__overlay-socials',
        overlay,
      );

      const animate = () => {
        const open = overlay.getAttribute('aria-hidden') === 'false';

        // A rapid open→close must never leave orphaned tweens mid-flight
        this.overlayTl?.kill();
        this.overlayTl = null;

        if (open) {
          this.gsap.set(overlay, { autoAlpha: 1 });
          this.overlayTl = this.engine.perf.registerTimeline(
            this.gsap.timeline({ defaults: { ease: 'power3.out' } }),
          );
          this.overlayTl
            .from(inner, { y: 44, autoAlpha: 0, duration: 0.5 })
            .from(links, { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.5 }, '-=0.3')
            .from(extras, { y: 18, autoAlpha: 0, stagger: 0.07, duration: 0.45 }, '-=0.35');
        } else {
          this.overlayTl = this.engine.perf.registerTimeline(
            this.gsap.to(overlay, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }),
          );
        }
      };

      new MutationObserver((records) => {
        if (records.some((record) => record.attributeName === 'aria-hidden')) animate();
      }).observe(overlay, { attributes: true, attributeFilter: ['aria-hidden'] });
    }
  }

  /* ====================================================================
   * 07. SCROLL ANIMATION — progress bar, parallax, pin prep
   * ================================================================== */
  class ScrollAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.progressBar = null;
    }

    init() {
      this.createProgressBar();

      if (!this.gsap) return;
      this.initParallax();
      this.initPins();
    }

    /** Thin gradient progress bar fixed to the top of the viewport */
    createProgressBar() {
      if ($('#anis-scroll-progress') || !this.gsap || this.engine.reduced) return;

      this.progressBar = document.createElement('div');
      this.progressBar.id = 'anis-scroll-progress';
      this.progressBar.setAttribute('aria-hidden', 'true');
      Object.assign(this.progressBar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '3px',
        zIndex: '2000',
        background: 'linear-gradient(90deg,#4F46E5,#06B6D4,#8B5CF6)',
        transform: 'scaleX(0)',
        transformOrigin: 'left',
        pointerEvents: 'none',
      });
      document.body.appendChild(this.progressBar);

      this.engine.perf.registerTimeline(
        this.gsap.to(this.progressBar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            start: 0,
            end: 'max',
            scrub: 0.4,
          },
        }),
      );
    }

    /** Scroll-linked parallax for `[data-parallax]` elements */
    initParallax() {
      const targets = $$('[data-parallax]');
      if (targets.length === 0 || !this.engine.ScrollTrigger) return;

      targets.forEach((el) => {
        const speed = Number(el.dataset.parallaxSpeed || 0.15);
        const direction = el.dataset.parallaxDirection === 'up' ? -1 : 1;

        this.engine.perf.registerTimeline(
          this.gsap.to(el, {
            y: () => `${100 * speed * direction}%`,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }),
        );
      });
    }

    /**
     * Pin support via `[data-pin]` — elements hold their position while the
     * following sibling scrolls past. Prepared for sections that opt in.
     */
    initPins() {
      const pins = $$('[data-pin]');
      if (pins.length === 0 || !this.engine.ScrollTrigger) return;

      pins.forEach((el) => {
        this.engine.perf.registerTimeline(
          this.gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: '+=' + (Number(el.dataset.pinDistance || 60) * 10),
              pin: el,
              scrub: true,
            },
          }),
        );
      });
    }

    /** Recompute after layout changes */
    refresh() {
      this.engine.ScrollTrigger?.refresh?.();
    }
  }

  /* ====================================================================
   * 08. CARD ANIMATION — tilt, glow sheen, rescans
   * ================================================================== */
  class CardAnimation {
    constructor(engine) {
      this.engine = engine;
      this.tilted = new WeakSet();
    }

    init() {
      this.scan();
    }

    /** Apply Vanilla Tilt to every current + future `[data-tilt]` card */
    scan() {
      if (!window.VanillaTilt || this.engine.reduced) return;

      $$('[data-tilt]').forEach((el) => {
        if (this.tilted.has(el)) return;
        this.tilted.add(el);
        new window.VanillaTilt(el, {
          max: 9,
          speed: 600,
          glare: true,
          'max-glare': 0.22,
          scale: 1.02,
          gyroscope: this.engine.finePointer,
        });
      });
    }

    /** Re-scan after dynamic feeds render */
    rescan() {
      this.scan();
    }
  }

  /* ====================================================================
   * 09. CURSOR ANIMATION — dot, ring, magnetic, text state
   * ================================================================== */
  class CursorAnimation {
    constructor(engine) {
      this.engine = engine;
      this.dot = $('[data-cursor-dot]');
      this.ring = $('[data-cursor-ring]');
      this.enabled = engine.finePointer && !engine.reduced && !!this.dot;
    }

    init() {
      if (!this.enabled) return;

      document.documentElement.classList.add('has-cursor');
      this.mouse = { x: -100, y: -100 };
      this.dotPos = { ...this.mouse };
      this.ringPos = { ...this.mouse };

      this.bind();
      this.loop();
      this.magnetic();
    }

    bind() {
      this.engine.perf.on(window, 'mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      this.engine.perf.on(document, 'mouseleave', () => this.setOpacity(0));
      this.engine.perf.on(document, 'mouseenter', () => this.setOpacity(1));

      // Expanded ring over interactive elements; "text" caret over headings
      this.engine.perf.on(document, 'mouseover', (e) => {
        const target = e.target.closest
          ? e.target.closest('a, button, input, textarea, select, [data-cursor-hover], .tilt-card, .swiper')
          : null;
        toggleClass(this.ring, 'is-hovering', Boolean(target));
        const isText = e.target.closest?.('h1, h2, h3, h4, .section__title, .hero__title');
        toggleClass(this.ring, 'is-text', Boolean(isText));
      });

      this.engine.perf.on(document, 'mousedown', () => addClass(this.ring, 'is-pressed'));
      this.engine.perf.on(document, 'mouseup', () => removeClass(this.ring, 'is-pressed'));
    }

    setOpacity(value) {
      if (this.dot) this.dot.style.opacity = value;
      if (this.ring) this.ring.style.opacity = value;
    }

    /** rAF lerp loop — dot is snappy, ring trails */
    loop() {
      if (this.engine.perf.suspended) {
        requestAnimationFrame(() => this.loop());
        return;
      }

      const lerp = (start, end, ease) => start + (end - start) * ease;

      this.dotPos.x = lerp(this.dotPos.x, this.mouse.x, 0.9);
      this.dotPos.y = lerp(this.dotPos.y, this.mouse.y, 0.9);
      this.ringPos.x = lerp(this.ringPos.x, this.mouse.x, 0.18);
      this.ringPos.y = lerp(this.ringPos.y, this.mouse.y, 0.18);

      if (this.dot) {
        this.dot.style.transform =
          `translate(${this.dotPos.x}px, ${this.dotPos.y}px) translate(-50%, -50%)`;
      }
      if (this.ring) {
        this.ring.style.transform =
          `translate(${this.ringPos.x}px, ${this.ringPos.y}px) translate(-50%, -50%)`;
      }

      requestAnimationFrame(() => this.loop());
    }

    /** Magnetic pull for CTA + icon buttons */
    magnetic() {
      if (!this.engine.finePointer) return;

      const targets = $$('[data-magnetic]').concat(
        $$('.btn-glow, .btn-outline-light, .icon-btn'),
      );

      targets.forEach((el) => {
        const strength = Number(el.dataset.magneticStrength || 0.3);

        this.engine.perf.on(el, 'mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const relX = e.clientX - rect.left - rect.width / 2;
          const relY = e.clientY - rect.top - rect.height / 2;
          el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
        });

        this.engine.perf.on(el, 'mouseleave', () => {
          el.style.transform = '';
        });
      });
    }
  }

  /* ====================================================================
   * 10. PARTICLE ANIMATION — network, orbs, noise layer
   * ================================================================== */
  class ParticleAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.canvas = $('#particle-canvas');
    }

    init() {
      this.initParticles();
      this.injectOrbs();
      this.injectNoise();
    }

    /** Particles.js network field (guarded) */
    initParticles() {
      if (!this.canvas || !window.particlesJS) return;

      window.particlesJS(this.canvas.id, {
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
    }

    /** Floating aurora orbs drifting behind the content */
    injectOrbs() {
      if ($('.anis-bg-layer')) return;

      const layer = document.createElement('div');
      layer.className = 'anis-bg-layer';
      layer.setAttribute('aria-hidden', 'true');
      Object.assign(layer.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '0',
        pointerEvents: 'none',
        overflow: 'hidden',
      });

      const palette = [
        'rgba(79, 70, 229, 0.22)',
        'rgba(6, 182, 212, 0.16)',
        'rgba(139, 92, 246, 0.18)',
      ];

      for (let i = 0; i < 6; i += 1) {
        const orb = document.createElement('div');
        orb.className = 'anis-bg-orb';
        const size = 160 + Math.random() * 220;
        Object.assign(orb.style, {
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 90}%`,
          top: `${Math.random() * 90}%`,
          borderRadius: '50%',
          background: palette[i % palette.length],
          filter: 'blur(70px)',
          willChange: 'transform',
        });
        layer.appendChild(orb);

        if (this.engine.gsap && !this.engine.reduced) {
          this.engine.perf.registerTimeline(
            this.gsap.to(orb, {
              x: `+=${80 + Math.random() * 120}`,
              y: `+=${60 + Math.random() * 100}`,
              duration: 12 + Math.random() * 8,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
            }),
          );
        }
      }

      document.body.appendChild(layer);
    }

    /** Ultra-subtle film-grain noise overlay */
    injectNoise() {
      if ($('.anis-bg-noise')) return;

      const noise = document.createElement('div');
      noise.className = 'anis-bg-noise';
      noise.setAttribute('aria-hidden', 'true');
      Object.assign(noise.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '1',
        pointerEvents: 'none',
        opacity: '0.035',
        mixBlendMode: 'overlay',
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
      });
      document.body.appendChild(noise);
    }
  }

  /* ====================================================================
   * 11. COUNTER ANIMATION — CountUp.js with rAF fallback
   * ================================================================== */
  class CounterAnimation {
    constructor(engine) {
      this.engine = engine;
    }

    init() {
      this.observe();
    }

    /** Observe every counter; animate once when 40% visible */
    observe() {
      const elements = $$('[data-count-up]').filter(
        (el) => !this.engine.observedCounters.has(el),
      );
      if (elements.length === 0) return;

      const io = this.engine.perf.createObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            this.run(entry.target);
            this.engine.observedCounters.add(entry.target);
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.4 },
      );

      elements.forEach((el) => io.observe(el));
    }

    /** Re-scan for counters added by data feeds */
    rescan() {
      this.observe();
    }

    run(el) {
      const endValue = Number(el.dataset.countValue || 0);
      const suffix = el.dataset.countSuffix || '';
      const duration = Number(el.dataset.countDuration || 2);
      const decimals = Number(el.dataset.countDecimals || 0);

      if (window.CountUp) {
        const counter = new window.CountUp(el, endValue, {
          suffix,
          duration,
          decimalPlaces: decimals,
          useEasing: true,
          useGrouping: true,
        });
        if (counter.error) this.animateFallback(el, endValue, suffix, duration, decimals);
        else counter.start();
      } else {
        this.animateFallback(el, endValue, suffix, duration, decimals);
      }
    }

    /** rAF fallback with exponential easing when CountUp.js is absent */
    animateFallback(el, endValue, suffix, duration, decimals) {
      const start = performance.now();
      const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

      const frame = (now) => {
        const progress = Math.min((now - start) / (duration * 1000), 1);
        const value = endValue * easeOutExpo(progress);
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

  /* ====================================================================
   * 12. TEXT ANIMATION — splitter + staggered reveals
   * ================================================================== */
  class TextAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
    }

    init() {
      if (!this.gsap || this.engine.reduced) return;
      $$('[data-split]').forEach((el) => this.animateSplit(el));
    }

    /**
     * Split element text into word/char spans, then stagger them in.
     * `data-split="chars" | "words"` controls granularity.
     */
    animateSplit(el) {
      const splitter = new TextSplitter(el);
      const mode = el.dataset.split === 'words' ? 'words' : 'chars';
      const items = splitter.split(mode);
      if (items.length === 0) return;

      this.gsap.from(items, {
        y: 24,
        opacity: 0,
        rotateX: -45,
        duration: 0.7,
        stagger: 0.02,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    }
  }

  /**
   * Lightweight SplitText equivalent. Splits text nodes into wrapped spans
   * while preserving any child element structure (accents, icons, badges).
   */
  class TextSplitter {
    constructor(el) {
      this.el = el;
      this.original = el.innerHTML;
    }

    /** Reconstruct from the pristine markup */
    restore() {
      this.el.innerHTML = this.original;
    }

    /**
     * @param {'chars'|'words'} mode — granularity of the split
     * @returns {HTMLElement[]} the wrapped spans
     */
    split(mode = 'chars') {
      const produced = [];
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            const parts = mode === 'words'
              ? child.textContent.split(/(\s+)/)
              : child.textContent.split('');
            const fragment = document.createDocumentFragment();

            parts.forEach((part) => {
              if (!part || part === ' ') {
                fragment.appendChild(document.createTextNode(part));
                return;
              }
              const span = document.createElement('span');
              span.className = mode === 'words' ? 't-word' : 't-char';
              span.setAttribute('aria-hidden', 'true');
              span.textContent = part;
              produced.push(span);
              fragment.appendChild(span);
            });
            node.replaceChild(fragment, child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };

      walk(this.el);
      return produced;
    }
  }

  /* ====================================================================
   * 13. SECTION ANIMATION — reveals, staggers, icon bounces
   * ================================================================== */
  class SectionAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
    }

    init() {
      this.observeReveals();
      this.observeIconBounces();
    }

    /**
     * IO-driven reveal for `[data-reveal]`. Direction via
     * data-reveal="up|down|left|right|scale|blur".
     */
    observeReveals() {
      const targets = $$('[data-reveal]').filter(
        (el) => !this.engine.observedReveals.has(el),
      );
      if (targets.length === 0) return;

      const fromMap = {
        up:    { y: 40, opacity: 0 },
        down:  { y: -40, opacity: 0 },
        left:  { x: 48, opacity: 0 },
        right: { x: -48, opacity: 0 },
        scale: { scale: 0.85, opacity: 0 },
        blur:  { y: 24, opacity: 0, filter: 'blur(12px)' },
      };

      const io = this.engine.perf.createObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const from = fromMap[el.dataset.reveal] || fromMap.up;

            if (this.gsap && !this.engine.reduced) {
              this.gsap.fromTo(el, from, {
                ...from,
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.8,
                ease: 'power3.out',
                clearProps: 'all',
              });
            } else {
              addClass(el, 'is-inview');
            }

            this.engine.observedReveals.add(el);
            io.unobserve(el);
          });
        },
        { threshold: 0.15 },
      );

      targets.forEach((el) => io.observe(el));
    }

    /** Playful bounce for icons when their host card enters */
    observeIconBounces() {
      const hosts = $$('.service-card__icon, .gh-stat__icon');
      if (hosts.length === 0 || !this.gsap || this.engine.reduced) return;

      const io = this.engine.perf.createObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const icon = entry.target;
            this.gsap.from(icon, {
              scale: 0.6,
              rotate: -18,
              opacity: 0,
              duration: 0.7,
              ease: 'back.out(1.8)',
              clearProps: 'all',
            });
            io.unobserve(icon);
          });
        },
        { threshold: 0.4 },
      );

      hosts.forEach((host) => io.observe(host));
    }

    /** Re-scan for feeds injected after boot */
    rescan() {
      this.observeReveals();
      this.observeIconBounces();
    }
  }

  /* ====================================================================
   * 14. TIMELINE ANIMATION — card reveals, dots, progress line
   * ================================================================== */
  class TimelineAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
    }

    init() {
      this.scan();
    }

    scan() {
      const items = $$('.timeline__item');
      if (items.length === 0) return;

      // Animated progress spine (drawn as the user scrolls through it)
      this.injectProgressLine();

      if (!this.gsap || this.engine.reduced) return;

      const io = this.engine.perf.createObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const item = entry.target;
            this.gsap.fromTo(
              item,
              { x: -48, opacity: 0, filter: 'blur(8px)' },
              {
                x: 0,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.8,
                ease: 'power3.out',
                clearProps: 'all',
              },
            );
            io.unobserve(item);
          });
        },
        { threshold: 0.2 },
      );

      items.forEach((item) => io.observe(item));
    }

    /** Draw a real progress spine over the CSS ::before line */
    injectProgressLine() {
      if ($('.timeline__progress') || !this.gsap || this.engine.reduced) return;

      const timeline = $('.timeline');
      if (!timeline) return;

      const line = document.createElement('div');
      line.className = 'timeline__progress';
      line.setAttribute('aria-hidden', 'true');
      Object.assign(line.style, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        left: '19px',
        width: '2px',
        background: 'linear-gradient(180deg,#4F46E5,#8B5CF6)',
        transformOrigin: 'top',
        transform: 'scaleY(0)',
        zIndex: '-1',
      });
      timeline.appendChild(line);

      this.engine.perf.registerTimeline(
        this.gsap.to(line, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: timeline,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.5,
          },
        }),
      );
    }

    rescan() {
      this.scan();
    }
  }

  /* ====================================================================
   * 15. THEME TRANSITION — 400ms blur/scale pulse on theme change
   * ================================================================== */
  class ThemeTransition {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
    }

    init() {
      if (!this.gsap || this.engine.reduced) return;

      document.addEventListener('anis:theme-changed', () => this.pulse());
      document.addEventListener('anis:theme-reset', () => this.pulse());
    }

    /**
     * A 400ms "re-compose" pulse on the main content. Pure enhancement —
     * theme.js owns the actual variable swap; this just adds the blur/scale
     * sheen so a swap reads as deliberate.
     */
    pulse() {
      const main = $('#main-content');
      if (!main) return;

      this.engine.perf.registerTimeline(
        this.gsap.fromTo(
          main,
          { opacity: 0.92, scale: 0.996, filter: 'blur(6px)' },
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.4,
            ease: 'power2.out',
            clearProps: 'filter',
            overwrite: true,
          },
        ),
      );
    }
  }

  /* ====================================================================
   * 16. ABOUT ANIMATION — lightweight fade/slide reveal
   * ================================================================== */
  class AboutAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#about');
      this.played = false;
    }

    init() {
      if (!this.section) return;
      // Reduced motion, or no GSAP → reveal immediately, nothing is ever hidden.
      if (!this.gsap || this.engine.reduced) {
        this.ensureVisible();
        return;
      }
      this.entrance();
      // Safety net: guarantee the section is visible even if the reveal
      // timeline is interrupted before completion.
      this.scheduleVisibilityGuard();
    }

    /**
     * Hard guarantee that every About element is visible. Clears any inline
     * opacity/visibility/transform a reveal might have left behind so the
     * CSS defaults (visible) reassert themselves. Safe to call at any time.
     */
    ensureVisible() {
      if (!this.section || !this.section.ownerDocument) return;
      $$('[data-about-reveal]', this.section).forEach((el) => {
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.transform = '';
      });
    }

    /** Fail-safe: reveal the section regardless of animation state. */
    scheduleVisibilityGuard() {
      if (this._guardSet) return;
      this._guardSet = true;
      const run = () => this.ensureVisible();
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1400 });
      else window.setTimeout(run, 1800);
    }

    /**
     * Scroll-triggered staggered fade/slide for every `[data-about-reveal]`.
     *
     * Fail-safe: hidden states are applied ONLY inside `reveal()`, the
     * timeline clears its own inline styles on completion, and any failure
     * path restores visibility immediately — content can never stay blank.
     */
    entrance() {
      const targets = $$('[data-about-reveal]', this.section);
      if (targets.length === 0) return;

      const reveal = () => {
        if (this.played || !this.gsap) return;
        this.played = true;

        try {
          const tl = this.engine.perf.registerTimeline(
            this.gsap.timeline({
              defaults: { ease: 'power3.out', duration: 0.7 },
              onComplete: () => this.ensureVisible(),
            }),
          );
          tl.from(targets, {
            y: 32,
            autoAlpha: 0,
            stagger: 0.08,
            clearProps: 'all',
          });
        } catch (err) {
          // Never allow a GSAP failure to leave the section blank.
          this.ensureVisible();
        }
      };

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.timeline({
            scrollTrigger: {
              trigger: this.section,
              start: 'top 85%',
              once: true,
              onEnter: reveal,
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            reveal();
            io.disconnect();
          }
        }, { threshold: 0.15 });
        io.observe(this.section);
      } else {
        // No scroll detection available → show immediately, never hide.
        reveal();
      }
    }
  }

  /* ====================================================================
   * 16b. EXPERIENCE ANIMATION — alternating career timeline choreography
   * ================================================================== */
  class ExperienceAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#experience');
      this.played = false;
    }

    init() {
      if (!this.section) return;
      this.injectProgress();
      if (!this.gsap || this.engine.reduced) {
        this.ensureVisible();
        return;
      }
      this.entrance();
      this.scheduleVisibilityGuard();
    }

    /** Clear any inline styles GSAP may have set — CSS defaults reassert. */
    ensureVisible() {
      if (!this.section || !this.section.ownerDocument) return;
      $$('[data-career-reveal]', this.section).forEach((el) => {
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.transform = '';
      });
    }

    /** Safety net: guarantee visibility if the timeline is interrupted. */
    scheduleVisibilityGuard() {
      if (this._guardSet) return;
      this._guardSet = true;
      const run = () => this.ensureVisible();
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1400 });
      else window.setTimeout(run, 1800);
    }

    /** Spine that draws progressively as the user scrolls. */
    injectProgress() {
      const rail = $('.career', this.section);
      if (!rail || $('.career__progress', this.section)) return;

      const line = document.createElement('div');
      line.className = 'career__progress';
      line.setAttribute('aria-hidden', 'true');
      rail.appendChild(line);

      if (!this.gsap || this.engine.reduced) {
        line.style.transform = 'translateX(-50%) scaleY(1)';
        return;
      }

      this.engine.perf.registerTimeline(
        this.gsap.to(line, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: this.section,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.5,
          },
        }),
      );
    }

    /**
     * Alternating card reveal — left cards slide from left, right cards from right.
     * Nodes scale in, year labels fade up. All staggered on scroll.
     */
    entrance() {
      const items = $$('[data-career-item]', this.section);
      if (items.length === 0) return;

      const reveal = () => {
        if (this.played || !this.gsap) return;
        this.played = true;

        try {
          const tl = this.engine.perf.registerTimeline(
            this.gsap.timeline({
              defaults: { ease: 'power3.out', duration: 0.7 },
              onComplete: () => this.ensureVisible(),
            }),
          );

          items.forEach((item) => {
            const card = $('[data-career-reveal]', item);
            const node = $('.career__node', item);
            const year = $('.career__years', item);
            const isLeft = item.classList.contains('career__item--left');

            if (card) {
              tl.from(card, {
                x: isLeft ? -36 : 36,
                autoAlpha: 0,
                duration: 0.7,
                clearProps: 'transform,opacity,visibility',
              }, '<0.1');
            }

            if (node) {
              tl.from(node, {
                scale: 0,
                autoAlpha: 0,
                duration: 0.5,
                ease: 'back.out(2)',
                clearProps: 'transform,opacity,visibility',
              }, '<0.05');
            }

            if (year) {
              tl.from(year, {
                y: 16,
                autoAlpha: 0,
                duration: 0.5,
                clearProps: 'transform,opacity,visibility',
              }, '<0.05');
            }
          });

          /* Progression ribbon — fade up last */
          const ribbon = $('.career-progression', this.section);
          if (ribbon) {
            tl.from(ribbon, {
              y: 24,
              autoAlpha: 0,
              duration: 0.6,
              clearProps: 'all',
            }, '-=0.3');
          }
        } catch (err) {
          this.ensureVisible();
        }
      };

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.timeline({
            scrollTrigger: {
              trigger: this.section,
              start: 'top 75%',
              once: true,
              onEnter: reveal,
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            reveal();
            io.disconnect();
          }
        }, { threshold: 0.12 });
        io.observe(this.section);
      } else {
        reveal();
      }
    }

    rescan() {
      this.injectProgress();
    }
  }

  /* ====================================================================
   * 16c. AI LAB ANIMATION — lab console choreography
   * ================================================================== */
  class AILabAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#ai-lab');
      this.played = false;
      this.togglesBound = false;
    }

    init() {
      if (!this.section) return;
      this.bindToggles();
      if (!this.gsap || this.engine.reduced) return;
      this.entrance();
      this.flowReveal();
      this.parallax();
      this.floatIcons();
    }

    /** Expand/collapse the per-card skill lists (event delegation, a11y-safe) */
    bindToggles() {
      if (this.togglesBound) return;
      this.togglesBound = true;

      this.engine.perf.on(this.section, 'click', (e) => {
        const btn = e.target.closest('.lab-card__toggle');
        if (!btn) return;
        const card = btn.closest('.lab-card');
        if (!card) return;

        const open = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        const label = btn.querySelector('.lab-card__toggle-text');
        if (label) label.textContent = open ? 'Hide skills' : 'Skills';

        // Re-measure ScrollTrigger positions after the card resizes
        if (window.ANIS_OS_ANIMATIONS?.refresh) window.ANIS_OS_ANIMATIONS.refresh();
      });
    }

    /** Staggered reveal for intro, tool cards, knowledge, roadmap and banner */
    entrance() {
      const intro = $('.lab-intro', this.section);
      const blocks = $$('.lab-block', this.section);
      const cards = $$('[data-lab-card]', this.section);
      const banner = $('[data-lab-banner]', this.section);

      if (!intro && blocks.length === 0 && !banner) return;

      const play = () => {
        if (this.played) return;
        this.played = true;

        const tl = this.engine.perf.registerTimeline(
          this.gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } }),
        );

        if (intro) tl.from(intro, { y: 40, autoAlpha: 0, clearProps: 'all' });
        blocks.forEach((block) => {
          tl.from(block, { y: 48, autoAlpha: 0, clearProps: 'all' }, '+=0.05');
        });
        if (cards.length) {
          tl.from(cards, { scale: 0.92, autoAlpha: 0, stagger: 0.05, clearProps: 'all' }, '-=0.5');
        }
        if (banner) {
          tl.from(banner, { scale: 0.96, y: 40, autoAlpha: 0, clearProps: 'all' }, '-=0.2');
        }
      };

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.timeline({
            scrollTrigger: {
              trigger: this.section,
              start: 'top 75%',
              once: true,
              onEnter: play,
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            play();
            io.disconnect();
          }
        }, { threshold: 0.1 });
        io.observe(this.section);
      }
    }

    /** Sequential pop-in of the workflow steps with arrow pulses */
    flowReveal() {
      const steps = $$('[data-lab-step]', this.section);
      if (steps.length === 0) return;

      const play = () => {
        const tl = this.engine.perf.registerTimeline(
          this.gsap.timeline({ defaults: { ease: 'back.out(1.6)', duration: 0.45 } }),
        );

        steps.forEach((step) => {
          tl.from(step, { scale: 0.6, autoAlpha: 0, rotateY: 40, clearProps: 'all' }, '-=0.1');
          const link = step.nextElementSibling;
          if (link && link.classList.contains('lab-flow__link')) {
            tl.from(link, { autoAlpha: 0, scale: 0.2, clearProps: 'all' }, '-=0.2');
          }
        });
      };

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.timeline({
            scrollTrigger: {
              trigger: this.section,
              start: 'top 60%',
              once: true,
              onEnter: play,
            },
          }),
        );
      } else {
        play();
      }
    }

    /** Subtle depth parallax for the achievement banner */
    parallax() {
      if (!this.engine.finePointer) return;
      const banner = $('[data-lab-banner]', this.section);
      if (!banner) return;

      const drift = (e) => {
        const rect = banner.getBoundingClientRect();
        if (
          e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top || e.clientY > rect.bottom
        ) {
          return;
        }
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        this.gsap.to(banner, {
          x: cx * 12,
          y: cy * 8,
          duration: 1,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      };

      const reset = () => {
        this.gsap.to(banner, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      };

      this.engine.perf.on(banner, 'mousemove', drift);
      this.engine.perf.on(banner, 'mouseleave', reset);
    }

    /** Gentle perpetual float for the workflow icons (GPU-cheap) */
    floatIcons() {
      const icons = $$('.lab-flow__icon', this.section);
      if (icons.length === 0) return;
      icons.forEach((icon, index) => {
        this.engine.perf.registerTimeline(
          this.gsap.to(icon, {
            y: index % 2 === 0 ? -5 : 5,
            duration: 2.4 + (index % 3) * 0.35,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          }),
        );
      });
    }

    rescan() {
      // Static markup — nothing to re-scan
    }
  }

  /* ====================================================================
   * 16d. SKILLS — clean tech wall reveal
   * ================================================================== */
  class SkillsAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#skills');
      this.wall = this.section?.querySelector('[data-tech-wall]');
      this.categories = [];
      this.items = [];
      this.bound = false;
      this.played = false;
    }

    init() {
      if (!this.section || !this.wall) return;
      this.categories = [...this.section.querySelectorAll('[data-tech-category]')];
      this.items = [...this.section.querySelectorAll('[data-tech-item]')];

      // Assign pill index for stagger
      this.items.forEach((el, i) => { el.style.setProperty('--pill-i', i % 12); });

      this._defaultState();
      this._bind();
    }

    _defaultState() {
      if (window.ANIS_OS_ANIMATIONS?.gsap) {
        const gsap = window.ANIS_OS_ANIMATIONS.gsap;
        gsap.set(this.categories, { opacity: 0, y: 28 });
        gsap.set(this.items, { opacity: 0, y: 12 });
      }
    }

    _bind() {
      if (this.bound) return;
      this.bound = true;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) { this._forceVisible(); return; }

      if ('IntersectionObserver' in window) {
        this._io = new IntersectionObserver((entries) => {
          if (entries.some(e => e.isIntersecting)) {
            this._play();
            this._io.disconnect();
          }
        }, { threshold: 0.08 });
        this._io.observe(this.section);
      } else {
        this._forceVisible();
      }
    }

    _play() {
      if (this.played) return;
      this.played = true;

      const gsap = window.ANIS_OS_ANIMATIONS?.gsap;
      if (!gsap) { this._forceVisible(); return; }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      this.categories.forEach((cat, ci) => {
        const catItems = [...cat.querySelectorAll('[data-tech-item]')];
        tl.to(cat, { opacity: 1, y: 0, duration: .45 }, ci * .08);
        tl.to(catItems, { opacity: 1, y: 0, duration: .3, stagger: .04 }, ci * .08 + .15);
      });
    }

    _forceVisible() {
      this.wall?.classList.add('is-visible');
      if (window.ANIS_OS_ANIMATIONS?.gsap) {
        const gsap = window.ANIS_OS_ANIMATIONS.gsap;
        gsap.set(this.categories, { opacity: 1, y: 0, clearProps: 'all' });
        gsap.set(this.items, { opacity: 1, y: 0, clearProps: 'all' });
      }
    }

    refresh() {
      if (window.ANIS_OS_ANIMATIONS?.refresh) window.ANIS_OS_ANIMATIONS.refresh();
    }

    rescan() {
      this.init();
    }
  }

  /* ====================================================================
   * 16f. PROJECT DETAILS — content backing the case-study cards
   * ================================================================== */

  const ART_VARIANTS = {
    dashboard: () => `
    <span class="art-bg art-bg--1"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-panel m-panel--nav"></span>
      <span class="m-kpi"></span>
      <span class="m-kpi"></span>
      <span class="m-kpi"></span>
      <span class="m-kpi"></span>
      <span class="m-bar"></span>
      <span class="m-bar"></span>
      <span class="m-bar"></span>
      <span class="m-bar"></span>
      <span class="m-bar"></span>
    </span>`,
    saas: () => `
    <span class="art-bg art-bg--2"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-topbar"></span>
      <span class="m-hero"></span>
      <span class="m-col m-col--a"></span>
      <span class="m-col m-col--b"></span>
      <span class="m-btn"></span>
    </span>`,
    ai: () => `
    <span class="art-bg art-bg--3"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-chat"></span>
      <span class="m-chat m-chat--bot"></span>
      <span class="m-chat"></span>
      <span class="m-terminal"></span>
    </span>`,
    corporate: () => `
    <span class="art-bg art-bg--4"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-topbar"></span>
      <span class="m-image"></span>
      <span class="m-rows m-rows--a"></span>
      <span class="m-rows m-rows--b"></span>
    </span>`,
    realestate: () => `
    <span class="art-bg art-bg--5"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-pin"></span>
      <span class="m-card m-card--property"></span>
      <span class="m-card m-card--property"></span>
    </span>`,
    travel: () => `
    <span class="art-bg art-bg--6"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-cover"></span>
      <span class="m-card m-card--tile"></span>
      <span class="m-card m-card--tile"></span>
      <span class="m-card m-card--tile"></span>
    </span>`,
    email: () => `
    <span class="art-bg art-bg--7"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-sidebar"></span>
      <span class="m-email m-email--a"></span>
      <span class="m-email m-email--b"></span>
      <span class="m-grip"></span>
      <span class="m-grip"></span>
    </span>`,
    os: () => `
    <span class="art-bg art-bg--8"></span>
    <span class="art-grid"></span>
    <span class="art-glare"></span>
    <span class="art-scene">
      <span class="m-window"></span>
      <span class="m-dock"></span>
      <span class="m-dock-icon"></span>
      <span class="m-dock-icon"></span>
      <span class="m-dock-icon"></span>
    </span>`,
  };

  const PROJECT_DETAILS = {
    'enterprise-admin-dashboard': {
      index: '01',
      title: 'Enterprise Admin Dashboard',
      blurb: 'A real-time operations console unifying KPIs, analytics, and team workflows into a single command surface.',
      role: 'Lead Frontend Developer',
      type: 'Web App',
      duration: '4 months',
      categoryLabel: 'Dashboard · React · Python',
      art: 'dashboard',
      status: 'completed',
      businessGoal: 'Cut reporting lag from days to real time so operations leadership acts on the same shift, not last week.',
      projectVision: 'One command surface unifying revenue, fleet utilisation, service levels, and agent performance for the whole operations team.',
      targetUsers: 'Operations leadership, team leads, and the internal data team.',
      industry: 'Logistics & Supply Chain',
      teamSize: '4 — 1 lead frontend, 1 API, 1 data, 1 PM',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Defined the KPI-first information architecture and interaction model',
        'Built the component design system in Figma',
        'Developed the React dashboard and chart layer',
        'Led the design-to-tech handoff and performance budgets',
      ],
      painPoints: [
        'Reports were 3–5 days stale, so decisions were made on old data',
        'No drill-down: leaders could not go from an aggregate to a single record',
        'Every new metric required an engineer to hand-build a chart',
        'Permissions were enforced in the UI only, which teams regularly bypassed',
      ],
      goals: [
        'Deliver sub-2s morning-glance dashboards',
        'Enable drill-down from any KPI to its source records',
        'Standardise a metrics schema across 12 upstream systems',
        'Enforce role-scoped visibility at the API layer',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'A React SPA consuming a thin Python API layer that proxies and normalises a dozen internal services into one schema.' },
        { title: 'UX & Interaction', body: 'A morning-glance hierarchy surfaces anomalies, then lets users drill from any KPI down to a single record.' },
        { title: 'Scalability', body: 'Pre-aggregated endpoints plus memoised selectors keep renders under 16ms even while live data streams in.' },
        { title: 'Performance', body: 'WebSocket deltas update only the affected cells, holding 60fps interactions at a 120ms average query time.' },
        { title: 'Responsive', body: 'A fluid grid reflows from a dense desktop ops console to a focused mobile field view.' },
        { title: 'Accessibility', body: 'Keyboard-navigable tables, semantic landmarks, and ARIA live regions announce streaming updates.' },
      ],
      techStack: {
        frontend: ['React.js', 'Bootstrap 5', 'Recharts', 'Redux Toolkit'],
        backend: ['Python', 'REST API', 'WebSockets'],
        design: ['Figma', 'Design Tokens'],
        git: ['Git', 'GitHub Actions', 'ESLint'],
      },
      features: [
        'Real-time KPI streaming',
        'Drill-down to source records',
        'Role-scoped data access',
        'Custom report builder',
        'Morning-glance anomaly alerts',
        'Responsive ops console',
      ],
      metrics: [
        { value: '60%', label: 'faster reporting', note: 'vs. legacy weekly exports', percent: 88 },
        { value: '12', label: 'systems unified', note: 'single schema', percent: 74 },
        { value: '4h', label: 'saved weekly', note: 'per leadership member', percent: 62 },
        { value: '120ms', label: 'avg. query time', note: 'p95 across dashboards', percent: 92 },
      ],
      caseOutcomes: [
        'The normalisation layer cut integration time for new data sources from weeks to days.',
        'Live rendering stayed smooth with two-second stream intervals across the whole team.',
        'Role-scoped API security passed review and removed the UI-only permission gaps.',
      ],
      learnings: [
        'Design for the glance first — dense tables win over pretty widgets when the job is monitoring.',
        'A shared metrics schema is worth more than any charting library.',
        'Performance is a feature: budget renders before you write the first chart.',
      ],
      related: ['modern-saas-platform', 'portfolio-os', 'ai-workspace'],
      technologies: ['React.js', 'Bootstrap 5', 'REST API', 'Python', 'Redux Toolkit', 'Recharts'],
      overview: "Built as the single source of truth for a logistics company's operations leadership: one dashboard aggregating revenue, fleet utilisation, service levels, and agent performance from more than a dozen upstream systems.",
      problem: 'Leadership relied on spreadsheets and weekly exports. Reports were three to five days stale, impossible to drill into, and every new metric required an engineer to hand-build a chart.',
      research: 'Interviewed ops managers, team leads, and the data team. The biggest ask was speed — a morning glance that surfaces anomalies — followed by the ability to drill from an aggregate number down to a single record.',
      designProcess: 'Ran a discovery sprint, mapped the decision hierarchy, then prototyped a KPI-first layout in low fidelity before moving to a component-level design system in Figma. Each screen was validated with the ops team before build.',
      wireframes: [
        { title: 'Ops Overview', art: 'dashboard' },
        { title: 'Fleet Monitor', art: 'dashboard' },
        { title: 'Agent Desk', art: 'saas' },
        { title: 'Reports', art: 'dashboard' },
      ],
      uiScreens: [
        { title: 'Command Center', art: 'dashboard' },
        { title: 'Live Analytics', art: 'dashboard' },
        { title: 'Team Workflows', art: 'saas' },
        { title: 'Mobile Ops View', art: 'os' },
      ],
      architecture: 'A React SPA consuming a thin Python API layer that proxies a dozen internal services. Charts are rendered client-side from pre-aggregated endpoints; WebSockets stream live KPI deltas so the dashboard updates without page reloads.',
      challenges: [
        'Reconciling inconsistent data formats from 12 upstream systems',
        'Keeping the UI responsive while streaming live updates every two seconds',
        'Enforcing a permission model so each role sees only its slice of data',
      ],
      solutions: [
        'Built a normalisation layer in the API that emits one schema for every source',
        'Throttled WebSocket batches and used memoised selectors to keep renders under 16ms',
        'Enforced role-scoped row and column security at the API, not just in the UI',
      ],
      businessImpact: [
        { value: '60%', label: 'faster reporting' },
        { value: '12', label: 'systems unified' },
        { value: '4h', label: 'weekly hours saved' },
        { value: '120ms', label: 'avg. query time' },
      ],
      performance: [
        { label: 'Lighthouse Performance', value: '98%' },
        { label: 'First Contentful Paint', value: '0.9s' },
        { label: 'Dashboard Load', value: '1.1s' },
        { label: 'Interaction Latency', value: '85ms' },
      ],
      futureImprovements: [
        'Predictive alerts using rolling regression on KPI trends',
        'Exportable executive summary generated on demand',
        'Mobile-first PWA with offline mode for field leadership',
      ],
    },
    'modern-saas-platform': {
      index: '02',
      title: 'Modern SaaS Platform',
      blurb: 'A subscription product with guided onboarding, self-serve billing, and an analytics dashboard that answers product questions without support.',
      role: 'Frontend Developer',
      type: 'Web App',
      duration: '5 months',
      categoryLabel: 'React · Dashboard · Frontend',
      art: 'saas',
      status: 'completed',
      businessGoal: 'Lift activation and self-serve conversion by making the first session valuable within minutes.',
      projectVision: 'A subscription analytics tool where connecting a data source is the only step between signup and a first meaningful chart.',
      targetUsers: 'Product and growth teams in early-stage SaaS companies.',
      industry: 'SaaS / Product Analytics',
      teamSize: '5 — frontend, backend, product, design, PM',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Designed the guided onboarding flow and information architecture',
        'Built the Redux store and lazy-loaded feature routing',
        'Implemented the analytics dashboard and virtualised tables',
        'Collaborated on the design-token re-skinning system',
      ],
      painPoints: [
        'New signups stalled right after connecting a data source',
        'Billing was a wall of text that scared users away from self-serve',
        'The dashboard assumed domain knowledge most users did not yet have',
        'Large result sets made tables and dashboards sluggish',
      ],
      goals: [
        'Get users to a first meaningful chart in under five minutes',
        'Make billing fully self-serve with clear price comparisons',
        'Let power users skip onboarding without losing context',
        'Keep dashboards interactive with large datasets',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'Client-side routing with lazy-loaded chunks and a Redux store hydrated from a versioned REST API.' },
        { title: 'UX & Interaction', body: 'Progressive disclosure: pick a template, connect a source, preview live data, land in a contextual dashboard.' },
        { title: 'Scalability', body: 'Virtualised tables and streaming queries render incrementally as results arrive.' },
        { title: 'Performance', body: 'A design-token system allows per-tier re-skinning with zero component changes; TTI of 1.4s.' },
        { title: 'Responsive', body: 'Every dashboard surface reflows to a focused mobile summary.' },
        { title: 'Accessibility', body: 'Skip-tour paths, clear focus order, and keyboard shortcuts throughout.' },
      ],
      techStack: {
        frontend: ['React', 'JavaScript', 'Redux', 'Vite'],
        backend: ['Node.js', 'REST API'],
        design: ['Figma', 'Design System'],
        git: ['Git', 'GitHub', 'Vitest'],
      },
      features: [
        'Guided onboarding templates',
        'Self-serve billing with comparisons',
        'Analytics dashboard',
        'Template gallery',
        'Skip-tour + shortcuts palette',
        'Virtualised data tables',
      ],
      metrics: [
        { value: '34%', label: 'activation uplift', note: 'users reaching first chart', percent: 84 },
        { value: '28%', label: 'fewer tickets', note: 'resolved self-serve', percent: 78 },
        { value: '3×', label: 'faster first chart', note: 'vs. previous flow', percent: 90 },
        { value: '22%', label: 'conversion uplift', note: 'trial → paid', percent: 72 },
      ],
      caseOutcomes: [
        'The three-step billing flow with inline comparisons removed the biggest self-serve blocker.',
        'An explicit skip path satisfied power users without hurting guided users.',
        'Virtualised tables made large-result dashboards feel instant.',
      ],
      learnings: [
        'Onboarding is a funnel: instrument every step before optimising any.',
        'Self-serve only works when pricing is scannable in under five seconds.',
        'Virtualisation is the difference between a demo and a product.',
      ],
      related: ['enterprise-admin-dashboard', 'email-builder', 'travel-content-platform'],
      technologies: ['React', 'JavaScript', 'Redux', 'REST API', 'Vite'],
      overview: 'A subscription analytics tool where teams connect their data sources and immediately start exploring product metrics. The focus was a guided onboarding that gets users to their first chart in minutes, not days.',
      problem: 'Activation lagged badly. New signups had no idea where to start, billing was a wall of text, and the dashboard assumed domain knowledge most users did not yet have.',
      research: 'Analysed session recordings of more than 200 first-run users and ran 14 onboarding interviews. The single biggest drop-off was between connecting a data source and seeing a meaningful chart.',
      designProcess: 'Designed a progressive disclosure flow: pick a template, connect a source, preview live data, then land in a contextual dashboard. Every step showed the value of the next step before requiring input.',
      wireframes: [
        { title: 'Onboarding', art: 'saas' },
        { title: 'Billing', art: 'saas' },
        { title: 'Dashboard', art: 'dashboard' },
        { title: 'Templates', art: 'saas' },
      ],
      uiScreens: [
        { title: 'Guided Onboarding', art: 'saas' },
        { title: 'Self-serve Billing', art: 'saas' },
        { title: 'Analytics Dashboard', art: 'dashboard' },
        { title: 'Template Gallery', art: 'saas' },
      ],
      architecture: 'Client-side routing with lazy-loaded feature chunks, a Redux store hydrated from a versioned REST API, and a design-token system that lets the product re-skin per customer tier without component changes.',
      challenges: [
        'Making billing flows clear enough to be fully self-serve',
        'Balancing onboarding guidance against advanced users wanting to skip',
        'Keeping dashboards fast with large result sets',
      ],
      solutions: [
        'Split billing into a three-step flow with inline price comparisons',
        'Added an explicit skip-tour path plus an always-visible shortcuts palette',
        'Virtualised tables and shipped query streaming with incremental renders',
      ],
      businessImpact: [
        { value: '34%', label: 'activation uplift' },
        { value: '28%', label: 'support tickets reduced' },
        { value: '3×', label: 'faster time-to-first-chart' },
        { value: '22%', label: 'conversion uplift' },
      ],
      performance: [
        { label: 'Lighthouse Performance', value: '96%' },
        { label: 'Time to Interactive', value: '1.4s' },
        { label: 'Dashboard Load', value: '0.8s' },
        { label: 'Bundle (gzip)', value: '168KB' },
      ],
      futureImprovements: [
        'Native data-source connectors built in-house',
        'Custom report builder with scheduled email digests',
        'AI-assisted query-to-chart assistant',
      ],
    },
    'ai-workspace': {
      index: '03',
      title: 'AI Workspace',
      blurb: 'A conversational workspace pairing local LLMs with context-aware project tooling, prompt libraries, and reusable AI workflows.',
      role: 'Product Designer + Frontend Developer',
      type: 'AI App',
      duration: '3 months',
      categoryLabel: 'AI · UI/UX · Frontend',
      art: 'ai',
      status: 'in-progress',
      businessGoal: 'Make AI assistance practical for real work by anchoring it to project context — locally.',
      projectVision: 'A workspace where users talk to their projects — code, drafts, and workflows — with local-first privacy as the default.',
      targetUsers: 'Designers, developers, and small product teams working with sensitive data.',
      industry: 'Productivity / AI Tools',
      teamSize: '3 — product designer, frontend, AI engineer',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Designed the three-pane conversation–context–canvas model',
        'Built the streaming chat renderer and prompt library',
        'Implemented the local IndexedDB persistence layer',
        'Prototyped and piloted the flow with 40 early users',
      ],
      painPoints: [
        'Teams hopped between chat tools and actual work files, losing context',
        'Sensitive data had to leave the machine to reach a cloud LLM',
        'Prompts were rewritten from scratch every single time',
        'Long conversations blew past model context limits',
      ],
      goals: [
        'Keep all conversation and files on-device by default',
        'Make context explicit and inspectable, not implicit',
        'Reuse prompts and AI steps as shareable building blocks',
        'Stream long outputs without jank',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'A single-page app talking to a local inference bridge over WebSockets, with heavy inference isolated in a Web Worker.' },
        { title: 'UX & Interaction', body: 'Three-pane layout — conversation, context, canvas — keeps every AI step auditable.' },
        { title: 'Scalability', body: 'Automatic summarisation of stale context with a visual context budget.' },
        { title: 'Performance', body: 'A typed-cursor streaming renderer keeps token output smooth at 60fps.' },
        { title: 'Responsive', body: 'Panes collapse into tabs on mobile without losing the workflow.' },
        { title: 'Accessibility', body: 'Capability chips explain model limits; the canvas is fully keyboard-controllable.' },
      ],
      techStack: {
        frontend: ['JavaScript', 'HTML5', 'Web Workers'],
        backend: ['Local Inference Bridge', 'WebSockets'],
        design: ['Figma', 'Interaction Prototypes'],
        git: ['Git', 'IndexedDB'],
      },
      features: [
        'Local-first privacy',
        'Context-anchored chat',
        'Prompt library',
        'Reusable AI workflows',
        'Context budget visualiser',
        'Capability chips per model',
      ],
      metrics: [
        { value: '45%', label: 'time saved', note: 'on repetitive tasks', percent: 82 },
        { value: '0', label: 'data leaves device', note: 'by default', percent: 68 },
        { value: '6×', label: 'prompt reuse', note: 'via the library', percent: 88 },
        { value: '240ms', label: 'stream latency', note: 'first token', percent: 94 },
      ],
      caseOutcomes: [
        'The three-pane layout cut context-loss complaints to near zero in the pilot.',
        'Automatic summarisation kept 40+ turn conversations usable.',
        'The prompt library became the most-used feature in week one.',
      ],
      learnings: [
        'Context is the product: make it visible and users trust the AI.',
        'Local-first is a privacy story users actually understand.',
        'Streaming UIs need a typed cursor, not just chunked text.',
      ],
      related: ['portfolio-os', 'enterprise-admin-dashboard', 'email-builder'],
      technologies: ['JavaScript', 'HTML5', 'WebSockets', 'LLM API', 'IndexedDB', 'Web Workers'],
      overview: 'A workspace where users talk to their projects: ask questions about code, generate drafts from templates, and chain AI steps into reusable workflows — with local-first privacy as the default.',
      problem: 'Teams were jumping between a chat tool and their actual work files. Context was lost, prompts were repetitive, and sensitive data had to leave the machine to reach a cloud LLM.',
      research: 'Studied prompt logs from 40 designers and developers. The recurring pain was context loss and rewriting the same instructions; privacy was the top blocker for adopting AI at work.',
      designProcess: 'Prototyped a three-pane layout — conversation, context, and canvas — and tested it in a two-week pilot before building. Kept the chat surface familiar while making context explicit and inspectable.',
      wireframes: [
        { title: 'Chat', art: 'ai' },
        { title: 'Prompt Library', art: 'ai' },
        { title: 'Workflow Canvas', art: 'saas' },
        { title: 'Settings', art: 'ai' },
      ],
      uiScreens: [
        { title: 'Conversation', art: 'ai' },
        { title: 'Prompt Library', art: 'ai' },
        { title: 'Workflow Canvas', art: 'saas' },
        { title: 'Model Preferences', art: 'os' },
      ],
      architecture: 'A single-page app that talks to a local inference bridge over WebSockets. Prompt templates and run history live in IndexedDB; heavy inference runs in a Web Worker so the UI never janks.',
      challenges: [
        'Streaming token output smoothly in the browser',
        'Managing context windows across long conversations',
        'Explaining model capabilities to non-technical users',
      ],
      solutions: [
        'Incremental streaming with a typed cursor renderer',
        'Automatic summarisation of stale context with a visual context budget',
        'Inline capability chips that show what each model can and cannot do',
      ],
      businessImpact: [
        { value: '45%', label: 'repetitive-task time cut' },
        { value: '0', label: 'data sent to cloud by default' },
        { value: '6×', label: 'prompt reuse via library' },
        { value: '90+', label: 'workflows in pilot' },
      ],
      performance: [
        { label: 'Streaming Latency', value: '240ms' },
        { label: 'Messages Load', value: '30ms' },
        { label: 'Workflow Exec', value: '2.1s' },
        { label: 'Bundle (gzip)', value: '142KB' },
      ],
      futureImprovements: [
        'Shared workspace for teams with per-document permissions',
        'Local fine-tuned models via ONNX runtime',
        'Voice-first prompt authoring',
      ],
    },
    'corporate-business-website': {
      index: '04',
      title: 'Corporate Business Website',
      blurb: 'A high-conversion corporate presence with structured content, sub-second load, and an editorial-grade CMS the team can own.',
      role: 'UI/UX Designer + WordPress Developer',
      type: 'CMS / Landing',
      duration: '6 weeks',
      categoryLabel: 'WordPress · Frontend',
      art: 'corporate',
      status: 'completed',
      businessGoal: 'Turn the corporate site into a lead engine and give marketing full editorial ownership.',
      projectVision: 'A fast, structured, editor-friendly corporate presence that answers buyer questions before a call.',
      targetUsers: 'Prospective clients, the marketing team, and the sales team.',
      industry: 'Corporate / B2B Services',
      teamSize: '2 — designer-developer + client marketing',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Led UX, information architecture, and UI design',
        'Built the custom WordPress theme and block library',
        'Implemented SEO schema and performance optimisation',
        'Trained the marketing team on self-service publishing',
      ],
      painPoints: [
        'Marketing could not publish without a developer in the loop',
        'Service pages did not answer the questions buyers actually asked',
        'The site was slow on shared hosting, hurting rankings',
        'Editors could break layouts with unstructured tools',
      ],
      goals: [
        'Ship a page in minutes without engineering help',
        'Structure service pages around the buyer journey',
        'Deliver sub-second LCP on shared hosting',
        'Lock editors into safe, composable blocks',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'A custom WordPress theme on the block editor with flexible content fields; server-side rendering keeps SEO strong.' },
        { title: 'UX & Interaction', body: 'A flexible component library composed of validated patterns instead of bespoke layouts.' },
        { title: 'Scalability', body: 'Brotli, aggressive caching, and inline critical CSS hold up on shared hosting.' },
        { title: 'Performance', body: 'Critical CSS is inlined for first paint; images are lazy-loaded with AVIF/WebP.' },
        { title: 'Responsive', body: 'Every block is fluid from phone to 4K with zero editor effort.' },
        { title: 'Accessibility', body: 'Schema-rich content, semantic landmarks, and keyboard-friendly navigation.' },
      ],
      techStack: {
        frontend: ['WordPress', 'Bootstrap 5', 'PHP'],
        backend: ['Advanced Custom Fields', 'Custom Theme'],
        design: ['Figma', 'Component Library'],
        git: ['Git', 'Staging Deploys'],
      },
      features: [
        'Editor-safe block library',
        'Schema-rich structured content',
        'Per-block SEO fields',
        'Sub-second first paint',
        'Conversion-focused service pages',
        'Editorial blog with categories',
      ],
      metrics: [
        { value: '41%', label: 'qualified inquiries', note: '6-month lift', percent: 86 },
        { value: '0.9s', label: 'LCP', note: 'on shared hosting', percent: 96 },
        { value: '2×', label: 'organic traffic', note: 'in six months', percent: 76 },
        { value: '100%', label: 'self-published', note: 'by the marketing team', percent: 100 },
      ],
      caseOutcomes: [
        'Marketing shipped their first page in minutes, with zero breakage reports.',
        'Structured service pages lifted qualified inquiries by 41% in six months.',
        'Inline critical CSS and Brotli hit sub-second LCP on cheap hosting.',
      ],
      learnings: [
        'Locking editors into safe blocks is a feature, not a limitation.',
        'Performance on shared hosting is about honouring the platform, not fighting it.',
        'IA work pays back in conversions, not just rankings.',
      ],
      related: ['travel-content-platform', 'real-estate-portal', 'portfolio-os'],
      technologies: ['WordPress', 'Bootstrap 5', 'PHP', 'Custom Theme', 'Advanced Custom Fields'],
      overview: "A corporate site rebuilt around conversion: clear service pages, an editorial blog, and structured lead generation — running on WordPress so the client's marketing team can ship changes without engineering.",
      problem: "The old site was slow, dated, and editor-hostile. Marketing could not publish without a developer, and the service pages were not structured to answer the questions buyers actually ask.",
      research: 'Mapped the buyer journey with the sales team, ran a content audit of every page, and studied competitor sites for information architecture patterns that rank and convert.',
      designProcess: 'Established a flexible component library (hero, stats, case studies, testimonials) built as flexible-content blocks, so every page is composed from validated patterns rather than bespoke layouts.',
      wireframes: [
        { title: 'Home', art: 'corporate' },
        { title: 'Services', art: 'corporate' },
        { title: 'Case Study', art: 'corporate' },
        { title: 'Blog', art: 'corporate' },
      ],
      uiScreens: [
        { title: 'Homepage', art: 'corporate' },
        { title: 'Services Page', art: 'corporate' },
        { title: 'Case Study', art: 'corporate' },
        { title: 'Blog Archive', art: 'corporate' },
      ],
      architecture: 'A custom WordPress theme using the block editor with flexible fields. Server-side rendering keeps SEO strong; a lightweight asset pipeline delivers critical CSS inline for first paint.',
      challenges: [
        'Fitting enterprise-grade SEO into a content-managed site',
        'Keeping editors safe from layout breakage',
        'Shipping sub-second loads on shared hosting',
      ],
      solutions: [
        'Schema-rich structured content with per-block SEO fields',
        'A locked-down block set that editors compose rather than style',
        'Brotli, aggressive caching, and inline critical CSS',
      ],
      businessImpact: [
        { value: '41%', label: 'qualified inquiries up' },
        { value: '0.9s', label: 'LCP on shared hosting' },
        { value: '2×', label: 'organic traffic in 6 mo' },
        { value: '100%', label: 'publishable by marketing' },
      ],
      performance: [
        { label: 'Lighthouse Performance', value: '97%' },
        { label: 'Largest Contentful Paint', value: '0.9s' },
        { label: 'Cumulative Layout Shift', value: '0.02' },
        { label: 'Time to Interactive', value: '1.2s' },
      ],
      futureImprovements: [
        'Multilingual rollout with automated hreflang',
        'Internal search that surfaces case studies by industry',
        'Conversion analytics tied to each lead form',
      ],
    },
    'real-estate-portal': {
      index: '05',
      title: 'Real Estate Portal',
      blurb: 'A property marketplace with map-based discovery, advanced filtering, saved searches, and streamlined lead capture.',
      role: 'UI/UX Designer',
      type: 'Web App',
      duration: '3 months',
      categoryLabel: 'UI/UX · Dashboard',
      art: 'realestate',
      status: 'completed',
      businessGoal: 'Shorten the path from browse to qualified lead and let agents act on real intent.',
      projectVision: 'A map-first property marketplace where filtering feels effortless and every lead is a serious one.',
      targetUsers: 'Serious buyers and renters; the agents and agencies behind the listings.',
      industry: 'Real Estate / PropTech',
      teamSize: '4 — design, frontend, backend, product',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Led UX research and the map-first interaction model',
        'Designed the full UI in Figma with a collapsible filter panel',
        'Prototyped and moderated usability tests on the filter taxonomy',
        'Owned the design handoff and responsive build',
      ],
      painPoints: [
        'Agents drowned in unqualified lead noise',
        'The map was a bolt-on that frustrated serious buyers',
        'The filter taxonomy confused first-time users',
        'The listing-to-lead step had a high bounce rate',
      ],
      goals: [
        'Make the map the primary interface, not a secondary view',
        'Design a filter model users understand in seconds',
        'Capture intent with a frictionless two-field form',
        'Send agents leads that are actually qualified',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'A responsive single-page app over a REST API with URL-synced filter state for shareability.' },
        { title: 'UX & Interaction', body: 'Map-first flow with a collapsible filter panel and a results rail.' },
        { title: 'Scalability', body: 'Adaptive map clustering that degrades gracefully to pins as you zoom out.' },
        { title: 'Performance', body: '60fps map panning and 650ms result loads, even in dense urban grids.' },
        { title: 'Responsive', body: 'The map stays first on mobile; filters slide in as a sheet.' },
        { title: 'Accessibility', body: 'Filter state lives in the URL, so every view is deep-linkable and shareable.' },
      ],
      techStack: {
        frontend: ['JavaScript', 'Maps API', 'Bootstrap 5'],
        backend: ['REST API', 'Listing Feed'],
        design: ['Figma', 'UX Research'],
        git: ['Git', 'Prototype Tests'],
      },
      features: [
        'Map-first discovery',
        'Two-level filter taxonomy',
        'Saved searches',
        'Two-field lead form',
        'URL-synced filter state',
        'Adaptive map clustering',
      ],
      metrics: [
        { value: '2×', label: 'qualified leads', note: 'per agent per month', percent: 90 },
        { value: '38%', label: 'longer sessions', note: 'time on portal', percent: 80 },
        { value: '54%', label: 'saved-search leads', note: 'share of pipeline', percent: 74 },
        { value: '26%', label: 'bounce drop', note: 'on listing pages', percent: 84 },
      ],
      caseOutcomes: [
        'Map-first design doubled qualified leads per agent per month.',
        'The two-level taxonomy tested at near-zero confusion in moderated sessions.',
        'A contextual two-field lead form cut listing-to-lead bounce by 26%.',
      ],
      learnings: [
        'Map-first means designing the map as the canvas, then everything else.',
        'A filter taxonomy needs testing, not committee.',
        'Qualified leads beat raw volume every time.',
      ],
      related: ['travel-content-platform', 'corporate-business-website', 'email-builder'],
      technologies: ['Figma', 'JavaScript', 'Maps API', 'REST API', 'Prototyping'],
      overview: 'A property marketplace designed to shorten the path from browse to qualified lead: map-first discovery, granular filters, saved searches, and a lead form that captures intent without friction.',
      problem: 'Agents were drowning in unqualified leads. The existing portal let anyone submit a form, so listings attracted noise, and the map experience was a bolt-on that frustrated serious buyers.',
      research: 'Shadowed three agents and interviewed 12 buyers. Serious buyers filter hard (price, area, property type, school zones) and expect the map to be the primary interface, not a secondary view.',
      designProcess: 'Designed the map-first flow in Figma with a collapsible filter panel and a results rail. Ran moderated tests on the filter taxonomy before settling on a two-level category model.',
      wireframes: [
        { title: 'Map Browse', art: 'realestate' },
        { title: 'Filters', art: 'realestate' },
        { title: 'Listing Detail', art: 'corporate' },
        { title: 'Saved Search', art: 'dashboard' },
      ],
      uiScreens: [
        { title: 'Map Discovery', art: 'realestate' },
        { title: 'Advanced Filters', art: 'realestate' },
        { title: 'Listing Detail', art: 'corporate' },
        { title: 'Lead Form', art: 'saas' },
      ],
      architecture: 'A responsive single-page app over a REST API, with map clustering for performance, URL-synced filter state for shareability, and a lead pipeline that enriches submissions before the agent sees them.',
      challenges: [
        'Balancing map density with legibility at every zoom',
        'Making the filter taxonomy intuitive at first glance',
        'Reducing bounce on the listing-to-lead step',
      ],
      solutions: [
        'Adaptive clustering that degrades gracefully to pins',
        'Two-level categories with smart defaults and a clear-all reset',
        'A two-field lead form that expands contextually after first submission',
      ],
      businessImpact: [
        { value: '2×', label: 'qualified leads' },
        { value: '38%', label: 'longer sessions' },
        { value: '54%', label: 'leads via saved searches' },
        { value: '26%', label: 'bounce rate drop' },
      ],
      performance: [
        { label: 'Map Pan', value: '60fps' },
        { label: 'Results Load', value: '650ms' },
        { label: 'First Paint', value: '1.0s' },
        { label: 'Lead Form Conversion', value: '9.4%' },
      ],
      futureImprovements: [
        'Mortgage estimate calculator embedded in listings',
        'Neighbourhood scorecards powered by open data',
        'Instant viewing bookings from saved searches',
      ],
    },
    'travel-content-platform': {
      index: '06',
      title: 'Travel Content Platform',
      blurb: 'A magazine-grade travel platform built for editorial storytelling, immersive imagery, and mobile-first reading.',
      role: 'Frontend Developer',
      type: 'Content Platform',
      duration: '2 months',
      categoryLabel: 'Frontend · UI/UX',
      art: 'travel',
      status: 'completed',
      businessGoal: 'Reverse falling read time and mobile bounce with a fast, editorial-grade reading experience.',
      projectVision: 'A magazine-grade travel platform built for storytelling first and speed always.',
      targetUsers: 'Mobile-first readers and the editorial team.',
      industry: 'Media / Publishing',
      teamSize: '3 — frontend, editorial, visual design',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Designed the editorial grid and typographic system',
        'Built the CSS art system for story openers',
        'Implemented reading progress and lazy-loading',
        'Owned performance budgets across devices',
      ],
      painPoints: [
        'Dense wall-of-text articles collapsed read time',
        'Slow, unoptimised images hurt mobile readers',
        'The legacy CMS produced inconsistent layouts',
        'Galleries felt bolted-on rather than part of the story',
      ],
      goals: [
        'Cut mobile bounce with sub-second loads',
        'Make long-form comfortable to read on any screen',
        'Build story openers that feel crafted without heavy assets',
        'Keep editorial rhythm across breakpoints',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'Semantic HTML5 with CSS Grid, lazy-loaded responsive images, and a tiny vanilla-JS layer.' },
        { title: 'UX & Interaction', body: 'A reading-progress indicator and sticky in-article navigation keep readers oriented.' },
        { title: 'Scalability', body: 'A fluid type-and-grid system that reflows instead of stacking awkwardly.' },
        { title: 'Performance', body: 'AVIF/WebP with blur-up placeholders holds LCP to 1.1s on mobile data.' },
        { title: 'Responsive', body: 'Editorial rhythm preserved from phone to desktop via fluid grids.' },
        { title: 'Accessibility', body: 'Clear heading hierarchy, alt-rich imagery, and reduced-motion support.' },
      ],
      techStack: {
        frontend: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap 5'],
        backend: ['CMS Integration'],
        design: ['Editorial Design', 'Typography'],
        git: ['Git', 'Perf Budgets'],
      },
      features: [
        'Reading progress',
        'Cinematic image ledes',
        'Blur-up placeholders',
        'Sticky article nav',
        'Guide hub templates',
        'CSS-art story openers',
      ],
      metrics: [
        { value: '28%', label: 'read time up', note: 'average session', percent: 86 },
        { value: '31%', label: 'mobile bounce down', note: 'after redesign', percent: 82 },
        { value: '1.1s', label: 'LCP', note: 'on slow mobile data', percent: 92 },
        { value: '3×', label: 'pageviews/session', note: 'via cross-linking', percent: 78 },
      ],
      caseOutcomes: [
        'Cinematic ledes and shorter paragraphs lifted average read time by 28%.',
        'Lazy-loaded AVIF images cut mobile bounce by 31%.',
        'The CSS-art system gave every story a crafted opener with zero image budget.',
      ],
      learnings: [
        'Typography is the interface for long-form.',
        'Placeholders beat blank screens for perceived speed.',
        'A small art system scales across hundreds of stories.',
      ],
      related: ['corporate-business-website', 'portfolio-os', 'real-estate-portal'],
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap 5'],
      overview: 'An editorial travel platform where long-form stories, immersive galleries, and destination guides are built for reading comfort on any screen — heavy on typography, light on clutter.',
      problem: "The publication's legacy system produced dense, wall-of-text articles with slow, non-optimised images. Read time was falling, and mobile readers — the majority — were bouncing.",
      research: 'Analysed heatmaps across 50 articles and surveyed 300 readers. The clear wins were shorter paragraphs, cinematic image ledes, and progressive loading that never blanks the page.',
      designProcess: 'Designed an editorial grid with a strong type hierarchy, a full-bleed hero, and sticky in-article navigation. Built a lightweight CSS art system so story openers feel crafted without heavy assets.',
      wireframes: [
        { title: 'Article', art: 'travel' },
        { title: 'Guide Hub', art: 'travel' },
        { title: 'Gallery', art: 'travel' },
        { title: 'Destinations', art: 'travel' },
      ],
      uiScreens: [
        { title: 'Story Opener', art: 'travel' },
        { title: 'Guide Hub', art: 'travel' },
        { title: 'Photo Gallery', art: 'travel' },
        { title: 'Destination Index', art: 'travel' },
      ],
      architecture: 'Semantic HTML5 with CSS Grid layouts and lazy-loaded responsive images. A small vanilla-JS layer handles reading progress, gallery lightboxes, and intersection-triggered reveals.',
      challenges: [
        'Keeping 4K hero imagery fast on mobile data',
        'Preserving editorial rhythm across breakpoints',
        'Supporting low-end Android devices smoothly',
      ],
      solutions: [
        'Responsive srcset with AVIF/WebP and blur-up placeholders',
        'Fluid type and grid that reflow rather than stack awkwardly',
        'Progressive enhancement with graceful CSS degradation',
      ],
      businessImpact: [
        { value: '28%', label: 'read time growth' },
        { value: '31%', label: 'mobile bounce drop' },
        { value: '1.1s', label: 'LCP across devices' },
        { value: '3×', label: 'pageviews per session' },
      ],
      performance: [
        { label: 'Lighthouse Performance', value: '98%' },
        { label: 'Hero Image Load', value: '380ms' },
        { label: 'Largest Contentful Paint', value: '1.1s' },
        { label: 'Cumulative Layout Shift', value: '0.01' },
      ],
      futureImprovements: [
        'Offline reading via service workers',
        'Author bios and related-story recommendation engine',
        'Interactive itineraries with saved-plan sync',
      ],
    },
    'email-builder': {
      index: '07',
      title: 'Email Builder',
      blurb: 'A visual drag-and-drop email builder producing responsive, on-brand campaigns with reusable component blocks.',
      role: 'Lead Product Designer + Frontend Developer',
      type: 'Web App',
      duration: '4 months',
      categoryLabel: 'Frontend · UI/UX',
      art: 'email',
      status: 'completed',
      businessGoal: 'Turn campaign production from a developer backlog into a self-serve marketer flow.',
      projectVision: 'Drag-and-drop email that produces responsive, on-brand HTML marketers trust to send.',
      targetUsers: 'Marketing teams and brand managers.',
      industry: 'MarTech / Marketing',
      teamSize: '4 — product design, frontend, email platform, marketing liaison',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Led UX and the canvas–inspector interaction model',
        'Designed the drag-and-drop block system',
        'Built the React canvas and export compiler',
        'Validated rendering across email clients',
      ],
      painPoints: [
        'Every campaign required a developer and took days',
        'Emails rendered differently across clients',
        'Brand compliance was enforced by memory',
        'Marketers could not iterate without a handoff',
      ],
      goals: [
        'Ship a campaign in under an hour',
        'Emit bulletproof HTML that renders everywhere',
        'Enforce brand rules inside the tool itself',
        'Preview multiple clients side by side',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'A React canvas with a normalised JSON model — blocks are data, not DOM.' },
        { title: 'UX & Interaction', body: 'Left canvas / right inspector with a drag palette of reusable blocks.' },
        { title: 'Scalability', body: 'Versioned templates let teams iterate safely and publish on approval.' },
        { title: 'Performance', body: 'The export compiler runs in 120ms and flags unsupported CSS per client.' },
        { title: 'Responsive', body: 'Blocks are fluid by default; preview mode checks mobile and desktop.' },
        { title: 'Accessibility', body: 'Keyboard-driven palette, visible focus states, and clear drag affordances.' },
      ],
      techStack: {
        frontend: ['React', 'JavaScript', 'Drag & Drop'],
        backend: ['Email API', 'Template Service'],
        design: ['Figma', 'Design Tokens'],
        git: ['Git', 'CI Export Tests'],
      },
      features: [
        'Drag-and-drop canvas',
        'Reusable block palette',
        'Live multi-client preview',
        'Brand-safe validation',
        'Versioned templates',
        'Bulletproof HTML export',
      ],
      metrics: [
        { value: '85%', label: 'faster builds', note: 'days → hours', percent: 94 },
        { value: '3×', label: 'campaign output', note: 'per month', percent: 80 },
        { value: '0', label: 'dev handoffs', note: 'for campaigns', percent: 100 },
        { value: '22%', label: 'open-rate lift', note: 'on-brand renders', percent: 70 },
      ],
      caseOutcomes: [
        'Self-serve flow cut campaign build time by 85% and tripled output.',
        'The whitelist compiler produced emails that rendered consistently across clients.',
        'Brand validation in the tool made compliance automatic instead of remembered.',
      ],
      learnings: [
        'Email is a compiler problem, not a layout problem.',
        'Constraint with flexibility is what teams actually want.',
        'Multi-client preview is the feature that earns trust.',
      ],
      related: ['modern-saas-platform', 'enterprise-admin-dashboard', 'ai-workspace'],
      technologies: ['React', 'Drag & Drop', 'JavaScript', 'Email API', 'HTML Email'],
      overview: 'A visual email builder that turns campaign creation from a ticket backlog into a self-serve flow. Marketers drag blocks onto a canvas and export responsive, on-brand HTML that works in every major client.',
      problem: "Every campaign required a developer, took days, and rendered differently across clients. Marketers could not iterate without a handoff, and brand compliance was enforced by memory.",
      research: "Shadowed the marketing team through three campaign builds and catalogued the 12 most common email layouts. The core need was constraint with flexibility: templates they could bend, not break.",
      designProcess: 'Designed a left canvas / right inspector layout with a drag palette of blocks. Versioned templates let teams iterate safely, and a live preview mode showed multiple clients simultaneously.',
      wireframes: [
        { title: 'Canvas', art: 'email' },
        { title: 'Block Palette', art: 'email' },
        { title: 'Inspector', art: 'email' },
        { title: 'Preview', art: 'saas' },
      ],
      uiScreens: [
        { title: 'Drag & Drop Canvas', art: 'email' },
        { title: 'Block Palette', art: 'email' },
        { title: 'Properties Panel', art: 'email' },
        { title: 'Client Preview', art: 'saas' },
      ],
      architecture: 'A React canvas with a normalized JSON model — blocks are data, not DOM. Export transpiles that JSON into email-safe table HTML, and a validation pass flags unsupported CSS per client.',
      challenges: [
        'Generating HTML email that renders consistently',
        'Supporting drag interactions across touch and desktop',
        'Preventing layout breakage from bad block combinations',
      ],
      solutions: [
        'A whitelist compiler that emits bulletproof table markup',
        'Pointer-event abstractions shared by mouse and touch',
        'Real-time validation with inline fix suggestions',
      ],
      businessImpact: [
        { value: '85%', label: 'faster campaign builds' },
        { value: '3×', label: 'campaign output' },
        { value: '0', label: 'developer handoffs' },
        { value: '22%', label: 'open-rate uplift' },
      ],
      performance: [
        { label: 'Canvas Interaction', value: '60fps' },
        { label: 'Email Export', value: '120ms' },
        { label: 'Template Load', value: '90ms' },
        { label: 'Preview Render', value: '240ms' },
      ],
      futureImprovements: [
        'AI-assisted copy and subject-line scoring',
        'A/B testing built into the export flow',
        'Team libraries with brand-controlled blocks',
      ],
    },
    'portfolio-os': {
      index: '08',
      title: 'Portfolio Operating System',
      blurb: 'This site — a desktop-inspired operating system for a personal brand, blending product thinking, motion design, and AI-assisted engineering.',
      role: 'Creator · Product Designer · Frontend Engineer',
      type: 'Design System',
      duration: 'Ongoing',
      categoryLabel: 'React · AI · Frontend · UI/UX',
      art: 'os',
      status: 'open-source',
      businessGoal: 'Present the author as a product thinker and engineer through a living, evolving portfolio.',
      projectVision: 'A desktop-OS metaphor for a portfolio where every section is an app and the site itself is the demo.',
      targetUsers: 'Recruiters, hiring managers, clients, and fellow engineers.',
      industry: 'Personal Branding / Design Engineering',
      teamSize: '1 — creator: design, engineering, content',
      demoURL: '',
      githubURL: '',
      myRole: [
        'Defined the OS metaphor and design system from tokens up',
        'Engineered every section as a reusable module',
        'Designed and built the CSS-art system with zero images',
        'Coordinated all motion through one performance-aware engine',
      ],
      painPoints: [
        'Static portfolios age fast and read as brochures',
        'They show output but not how the author thinks',
        'They cannot evolve with a growing skill set',
        'Heavy templates hurt performance and originality',
      ],
      goals: [
        'Make the portfolio itself demonstrate the craft',
        'Ship sub-second loads with zero external images',
        'Let every section be iterated on independently',
        'Honour reduced-motion and accessibility throughout',
      ],
      solutionNotes: [
        { title: 'Architecture', body: 'HTML5, CSS3, vanilla ES6, with GSAP, Swiper, and CountUp layered via CDN — no build step.' },
        { title: 'UX & Interaction', body: 'The OS metaphor is structure, not decoration — windows, dock, and theme switcher teach the navigation.' },
        { title: 'Scalability', body: 'One refresh() contract coordinates every module, so new apps slot in cleanly.' },
        { title: 'Performance', body: 'A performance manager batches rAF, pauses on hidden tabs, and destroys cleanly.' },
        { title: 'Responsive', body: 'Every app reflows from desktop to phone without losing the metaphor.' },
        { title: 'Accessibility', body: 'Semantic HTML, ARIA, focus management, and full reduced-motion support.' },
      ],
      techStack: {
        frontend: ['HTML5', 'CSS3', 'GSAP', 'Vanilla JS'],
        backend: ['Bootstrap 5', 'CDN Assets'],
        design: ['Design Tokens', 'CSS Art'],
        git: ['Git', 'GitHub Pages'],
      },
      features: [
        'Desktop-OS shell',
        'Theme switcher',
        'CSS-art system',
        'Performance-managed motion',
        'Reduced-motion support',
        'Reusable section modules',
      ],
      metrics: [
        { value: '100%', label: 'hand-crafted', note: 'no external images', percent: 100 },
        { value: '20+', label: 'technologies', note: 'showcased in situ', percent: 88 },
        { value: '0KB', label: 'framework bundle', note: 'vanilla-first', percent: 90 },
        { value: '99%', label: 'Lighthouse', note: 'performance score', percent: 97 },
      ],
      caseOutcomes: [
        'The site itself demos the stack: every technology listed is running on this page.',
        'A zero-image CSS-art system keeps the whole experience fast and original.',
        'The module contract made this case-study engine a clean, self-contained task.',
      ],
      learnings: [
        'A portfolio should demonstrate process, not just results.',
        'Constraints (no images, no build) breed memorable craft.',
        'Motion is only premium when it is performant and respectful.',
      ],
      related: ['enterprise-admin-dashboard', 'ai-workspace', 'travel-content-platform'],
      technologies: ['HTML5', 'CSS3', 'GSAP', 'Vanilla JS', 'Bootstrap 5'],
      overview: "The site you're looking at: a desktop-OS metaphor applied to a portfolio, where every section is an app. A living design system that treats the portfolio itself as a product to be iterated on.",
      problem: 'Traditional portfolios are static brochures — they age fast, communicate little about how the author actually works, and cannot evolve with a growing skill set.',
      research: 'Studied operating-system interfaces and premium product portfolios to find patterns that feel alive without being noisy. The insight: users of a portfolio want to feel how someone thinks, not just see output.',
      designProcess: 'Defined the OS metaphor (windows, dock, theme switcher), then built the design system top-down: tokens, section shells, then per-section animations. Each new feature ships as a reusable module.',
      wireframes: [
        { title: 'Desktop', art: 'os' },
        { title: 'Window Manager', art: 'os' },
        { title: 'Dock', art: 'os' },
        { title: 'Theme System', art: 'os' },
      ],
      uiScreens: [
        { title: 'Boot Screen', art: 'os' },
        { title: 'Desktop', art: 'os' },
        { title: 'App Grid', art: 'os' },
        { title: 'Theme Switcher', art: 'os' },
      ],
      architecture: 'Pure web standards — HTML5, CSS3, vanilla ES6 — with GSAP, Swiper, and CountUp layered on via CDN. A shared animation engine coordinates every module and honours prefers-reduced-motion.',
      challenges: [
        'Keeping motion premium without hurting performance',
        'Extending the OS metaphor to every section without becoming gimmicky',
        'Shipping complex interactions with zero build tooling',
      ],
      solutions: [
        'A performance manager that batches rAF, pauses on hidden tabs, and destroys cleanly',
        'A restrained visual language that treats the OS metaphor as structure, not decoration',
        'Component-scoped modules coordinated through one refresh() contract',
      ],
      businessImpact: [
        { value: '100%', label: 'hand-crafted' },
        { value: '0', label: 'external images' },
        { value: '20+', label: 'technologies showcased' },
        { value: '1', label: 'living, always-updating system' },
      ],
      performance: [
        { label: 'Lighthouse Performance', value: '99%' },
        { label: 'Bundle (gzip)', value: '~0KB' },
        { label: 'Time to Interactive', value: '0.9s' },
        { label: 'Reduced-motion', value: 'honoured' },
      ],
      futureImprovements: [
        'Persistence layer for theme and layout preferences',
        'Interactive OS-style command palette across the site',
        'More case studies with deeper galleries as the system grows',
      ],
    },
  };

  /* ====================================================================
   * 16g. FEATURED PROJECTS — carousel, filters/search, case-study modal,
   *      gallery zoom, fullscreen + lightbox
   * ================================================================== */
  class FeaturedProjectsAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#projects');
      this.host = null;
      this.carousel = null;
      this.gallerySwiper = null;
      this.thumbSwiper = null;
      this.relatedSwiper = null;
      this.modalTls = [];
      this.modal = $('#projects-modal');
      this.lightbox = $('[data-projects-lightbox]');
      this.lightboxStage = $('[data-projects-lightbox-stage]');
      this.bound = false;
      this.entered = false;
      this.played = false;
      this.activeCategory = 'all';
      this.query = '';
      this.searchTimer = 0;
      this.currentDetail = null;
      this.lightboxIndex = 0;
      this.zoom = 1;
      this.toastEl = null;
      this.toastTimer = 0;
      this.focusTrapHandler = null;
      this.lastFocused = null;
    }

    init() {
      if (!this.section) return;
      this.host = $('[data-swiper="projects"]', this.section);
      this.bind();
      if (this.host) this.initCarousel();
      this.entrance();
    }

    /* ----- Event wiring (delegated, a11y-safe) ----- */
    bind() {
      if (this.bound) return;
      this.bound = true;

      this.engine.perf.on(document, 'click', (e) => {
        const caseBtn = e.target.closest('[data-project-case]');
        if (caseBtn) {
          const slide = caseBtn.closest('[data-project-slide]');
          this.openCase(slide ? slide.dataset.project : null);
          return;
        }

        const demoCard = e.target.closest('[data-project-demo]');
        if (demoCard) {
          e.preventDefault();
          const slide = demoCard.closest('[data-project-slide]');
          const detail = slide ? PROJECT_DETAILS[slide.dataset.project] : null;
          this.openExternal(detail ? detail.demoURL : null, 'Live demo', 'fa-arrow-up-right-from-square');
          return;
        }
        const githubCard = e.target.closest('[data-project-github]');
        if (githubCard) {
          e.preventDefault();
          const slide = githubCard.closest('[data-project-slide]');
          const detail = slide ? PROJECT_DETAILS[slide.dataset.project] : null;
          this.openExternal(detail ? detail.githubURL : null, 'Repository', 'fa-github');
          return;
        }

        const filter = e.target.closest('[data-projects-filter]');
        if (filter) { this.setCategory(filter.dataset.projectsFilter); return; }

        const clear = e.target.closest('[data-projects-clear]');
        if (clear) { this.clearSearch(); return; }

        const modalDemo = e.target.closest('[data-project-modal-demo]');
        if (modalDemo) {
          e.preventDefault();
          this.openExternal(this.currentDetail ? this.currentDetail.demoURL : null, 'Live demo', 'fa-arrow-up-right-from-square');
          return;
        }
        const modalGithub = e.target.closest('[data-project-modal-github]');
        if (modalGithub) {
          e.preventDefault();
          this.openExternal(this.currentDetail ? this.currentDetail.githubURL : null, 'Repository', 'fa-github');
          return;
        }
        if (e.target.closest('[data-project-download]')) { this.downloadCase(); return; }
        if (e.target.closest('[data-project-share]')) { this.shareProject(); return; }

        const closeBtn = e.target.closest('[data-projects-modal-close]');
        if (closeBtn) {
          const href = closeBtn.getAttribute && closeBtn.getAttribute('href');
          if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.slice(1);
            this.closeModal();
            if (targetId) {
              window.setTimeout(() => {
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, this.gsap && !this.engine.reduced ? 340 : 0);
            }
          } else {
            this.closeModal();
          }
          return;
        }

        const chHead = e.target.closest('.challenge-card__head');
        if (chHead) {
          this.toggleChallenge(chHead);
          return;
        }

        const relatedCard = e.target.closest('.related-card');
        if (relatedCard && relatedCard.dataset.project) {
          this.openCase(relatedCard.dataset.project);
          return;
        }

        const gallerySlide = e.target.closest('.projects-gallery .gallery-slide');
        if (gallerySlide) {
          const slide = gallerySlide.closest('.swiper-slide');
          this.openLightbox(parseInt(slide.dataset.galleryIndex, 10) || 0);
          return;
        }

        const lb = e.target.closest('[data-projects-lightbox]');
        if (!lb) return;
        if (e.target.closest('[data-projects-lightbox-close]')) { this.closeLightbox(); return; }
        if (e.target.closest('[data-projects-lightbox-prev]')) { this.prevLightbox(); return; }
        if (e.target.closest('[data-projects-lightbox-next]')) { this.nextLightbox(); return; }
        if (e.target.closest('[data-projects-lightbox-zoom-in]')) { this.setZoom(this.zoom + 0.3); return; }
        if (e.target.closest('[data-projects-lightbox-zoom-out]')) { this.setZoom(this.zoom - 0.3); return; }
        if (e.target.closest('[data-projects-lightbox-reset]')) { this.setZoom(1); return; }
        if (e.target === this.lightbox) this.closeLightbox();
      });

      const input = $('[data-projects-search]');
      if (input) {
        this.engine.perf.on(input, 'input', () => {
          clearTimeout(this.searchTimer);
          this.searchTimer = setTimeout(() => this.setQuery(input.value.trim()), 150);
        });
      }

      const clear = $('[data-projects-clear]');
      if (clear) {
        this.engine.perf.on(clear, 'keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.clearSearch();
          }
        });
      }

      this.engine.perf.on(document, 'keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (this.lightbox && !this.lightbox.hidden) this.closeLightbox();
        else if (this.modal && !this.modal.hidden) this.closeModal();
      });

      this.engine.perf.on(document, 'keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target && e.target.closest ? e.target.closest('.related-card') : null;
        if (card && card.dataset.project) {
          e.preventDefault();
          this.openCase(card.dataset.project);
        }
      });
    }

    /* ----- Carousel ----- */
    initCarousel() {
      if (!window.Swiper || !this.host) return;
      if (this.carousel) {
        this.carousel.destroy(true, true);
        this.carousel = null;
      }
      const loop = this.activeCategory === 'all' && !this.query;
      this.carousel = new window.Swiper(this.host, {
        slidesPerView: 1,
        spaceBetween: 24,
        loop,
        grabCursor: true,
        autoplay: loop
          ? { delay: 5600, disableOnInteraction: false, pauseOnMouseEnter: true }
          : false,
        pagination: { el: $('.projects-swiper__pagination', this.host), clickable: true },
        breakpoints: { 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } },
      });
      this.engine.swiperHosts.add(this.host);
      this.engine.perf.swipers.add(this.carousel);
    }

    rescan() {
      if (this.host && !this.engine.swiperHosts.has(this.host)) this.initCarousel();
    }

    /* ----- Category filtering + live search ----- */
    setCategory(category) {
      if (category === this.activeCategory) return;
      this.activeCategory = category;
      $$('[data-projects-filter]').forEach((btn) => {
        const active = btn.dataset.projectsFilter === category;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      this.applyFilters();
    }

    setQuery(query) {
      this.query = query.toLowerCase();
      const clear = $('[data-projects-clear]');
      if (clear) clear.classList.toggle('is-visible', this.query.length > 0);
      this.applyFilters();
    }

    clearSearch() {
      const input = $('[data-projects-search]');
      if (input) { input.value = ''; input.focus(); }
      this.setQuery('');
    }

    shouldShow(slide) {
      const category = slide.dataset.category || '';
      if (this.activeCategory !== 'all' && !category.split(/\s+/).includes(this.activeCategory)) return false;
      if (!this.query) return true;
      const detail = PROJECT_DETAILS[slide.dataset.project];
      const hay = [
        detail?.title || '',
        detail?.categoryLabel || '',
        category,
        ...(detail?.technologies || []),
      ].join(' ').toLowerCase();
      return hay.includes(this.query) || (slide.textContent || '').toLowerCase().includes(this.query);
    }

    applyFilters() {
      if (!this.host) return;
      let visibleCount = 0;
      $$('[data-project-slide]', this.host).forEach((slide) => {
        const show = this.shouldShow(slide);
        slide.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      const empty = $('[data-projects-empty]');
      if (empty) empty.hidden = visibleCount > 0;
      this.initCarousel();
      const originals = $$('[data-project-slide]', this.host).filter((s) => s.style.display !== 'none');
      if (originals.length && this.gsap && !this.engine.reduced) {
        this.gsap.fromTo(
          originals,
          { autoAlpha: 0.5, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', overwrite: 'auto' },
        );
      }
    }

    /* ----- Case study modal — Project Detail Engine ----- */
    openCase(projectId) {
      const detail = PROJECT_DETAILS[projectId];
      if (!detail || !this.modal) return;
      this.destroyGallery();
      this.currentDetail = detail;
      this.populateModal(detail);
      this.modal.hidden = false;
      this.initGallery();
      document.body.style.overflow = 'hidden';
      const scroll = $('[data-projects-scroll]', this.modal);
      if (scroll) scroll.scrollTop = 0;
      this.activateFocusTrap();
      const closeBtn = $('[data-projects-modal-close]', this.modal);
      if (closeBtn) closeBtn.focus();
      if (this.gsap && !this.engine.reduced) {
        const panel = $('.projects-modal__panel', this.modal);
        this.engine.perf.registerTimeline(
          this.gsap.timeline({ defaults: { ease: 'power3.out' } })
            .fromTo(this.modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
            .fromTo(panel, { scale: 0.92, y: 28, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: 0.55 }, '-=0.1')
            .fromTo($('[data-projects-hero]', this.modal), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, '-=0.35'),
        );
      }
      this.initReveals();
      this.initMetrics();
    }

    closeModal() {
      if (!this.modal || this.modal.hidden) return;
      const done = () => {
        this.modal.hidden = true;
        document.body.style.overflow = '';
        this.destroyGallery();
        this.deactivateFocusTrap();
        this.currentDetail = null;
      };
      if (this.gsap && !this.engine.reduced) {
        const panel = $('.projects-modal__panel', this.modal);
        this.engine.perf.registerTimeline(
          this.gsap.timeline({ defaults: { ease: 'power3.in' } })
            .to(panel, { scale: 0.94, y: 16, autoAlpha: 0, duration: 0.25 })
            .to(this.modal, { autoAlpha: 0, duration: 0.2, onComplete: done }, '-=0.05'),
        );
      } else {
        done();
      }
    }

    populateModal(detail) {
      const index = $('[data-projects-index]', this.modal);
      const title = $('[data-projects-title]', this.modal);
      const heroArt = $('[data-projects-hero-art]', this.modal);
      const category = $('[data-projects-category]', this.modal);
      const coverTitle = $('[data-projects-cover-title]', this.modal);
      const coverSub = $('[data-projects-cover-sub]', this.modal);
      const status = $('[data-projects-status]', this.modal);
      const content = $('[data-projects-content]', this.modal);
      if (index) index.textContent = detail.index;
      if (title) title.textContent = detail.title;
      if (heroArt) heroArt.innerHTML = ART_VARIANTS[detail.art] ? ART_VARIANTS[detail.art]() : '';
      if (category) category.textContent = detail.categoryLabel;
      if (coverTitle) coverTitle.textContent = detail.title;
      if (coverSub) coverSub.textContent = detail.blurb;
      if (status) this.setStatus(status, detail.status);
      if (content) content.innerHTML = this.buildContent(detail);
      this.buildRelated(detail);
      const demoLink = $('[data-project-modal-demo]', this.modal);
      const githubLink = $('[data-project-modal-github]', this.modal);
      if (demoLink) demoLink.href = detail.demoURL && /^https?:\/\//.test(detail.demoURL) ? detail.demoURL : '#';
      if (githubLink) githubLink.href = detail.githubURL && /^https?:\/\//.test(detail.githubURL) ? detail.githubURL : '#';
    }

    setStatus(el, status) {
      const labels = { completed: 'Completed', 'in-progress': 'In Progress', learning: 'Learning', 'open-source': 'Open Source' };
      const key = labels[status] ? status : 'completed';
      el.textContent = labels[key];
      el.className = `projects-modal__status is-${key}`;
      el.hidden = false;
    }

    buildContent(detail) {
      const fact = (label, value) => `
        <div class="case-fact">
          <span class="case-fact__label">${label}</span>
          <span class="case-fact__value">${value || '—'}</span>
        </div>`;
      const chipList = (items) => `
        <ul class="case-stack">${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;

      const processSteps = [
        { icon: 'fa-magnifying-glass', title: 'Research', body: detail.research },
        { icon: 'fa-route', title: 'User Flow & Strategy', body: detail.designProcess },
        { icon: 'fa-pen-nib', title: 'Wireframing', body: `Structured the information architecture and low-fidelity flows across ${detail.wireframes ? detail.wireframes.length : 0} key views before any visual design.` },
        { icon: 'fa-palette', title: 'High-Fidelity Design', body: `Translated validated flows into component-level screens for ${detail.uiScreens ? detail.uiScreens.length : 0} primary surfaces, aligned to the product design system.` },
        { icon: 'fa-code', title: 'Development', body: detail.architecture },
        { icon: 'fa-flask', title: 'Testing & Launch', body: 'Quality gate via Lighthouse audits, cross-browser validation, and responsive checks before handover; shipped and iterated on real user feedback.' },
      ];
      const stackGroups = detail.techStack || {};
      const stackMeta = {
        frontend: { label: 'Frontend', icon: 'fa-window-restore' },
        backend: { label: 'Backend', icon: 'fa-server' },
        design: { label: 'Design', icon: 'fa-pen-ruler' },
        git: { label: 'Git & Tooling', icon: 'fa-code-branch' },
      };
      const metrics = detail.metrics || (detail.businessImpact || []).map((m) => ({ value: m.value, label: m.label, note: '', percent: 75 }));
      const challenges = (detail.challenges || []).map((ch, i) => ({
        challenge: ch,
        solution: (detail.solutions || [])[i] || 'See the solutions approach below for how this was addressed.',
        outcome: (detail.caseOutcomes || [])[i] || 'See the key metrics above for measured impact.',
      }));
      const solutionIcons = ['fa-diagram-project', 'fa-wand-magic-sparkles', 'fa-shield-halved', 'fa-gauge-high', 'fa-mobile-screen', 'fa-universal-access'];

      let n = 0;
      const section = (icon, title, body) => `
        <section class="case-section">
          <div class="case-section__head">
            <span class="case-section__index">${String(++n).padStart(2, '0')}</span>
            <h3><i class="fa-solid ${icon}" aria-hidden="true"></i>${title}</h3>
          </div>
          <div class="case-section__body">${body}</div>
        </section>`;

      const overviewFacts = `
        <p class="case-overview__lead">${detail.overview}</p>
        <div class="case-facts">
          ${fact('Business Goal', detail.businessGoal)}
          ${fact('Project Vision', detail.projectVision)}
          ${fact('Target Users', detail.targetUsers)}
          ${fact('Industry', detail.industry)}
          ${fact('Role', detail.role)}
          ${fact('Timeline', detail.duration)}
          ${fact('Team Size', detail.teamSize)}
          ${fact('Type', detail.type)}
        </div>`;

      const myRole = `
        <ul class="role-list">
          ${(detail.myRole || []).map((r) => `<li><i class="fa-solid fa-user-check" aria-hidden="true"></i>${r}</li>`).join('')}
        </ul>`;

      const businessProblem = `
        <div class="case-problem">
          <p class="case-problem__text">${detail.problem}</p>
          <div class="case-problem__cols">
            <div class="case-problem__col case-problem__col--pain">
              <h4><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>Pain Points</h4>
              <ul>${(detail.painPoints || []).map((p) => `<li><i class="fa-solid fa-xmark" aria-hidden="true"></i>${p}</li>`).join('')}</ul>
            </div>
            <div class="case-problem__col case-problem__col--goals">
              <h4><i class="fa-solid fa-bullseye" aria-hidden="true"></i>Goals</h4>
              <ul>${(detail.goals || []).map((g) => `<li><i class="fa-solid fa-check" aria-hidden="true"></i>${g}</li>`).join('')}</ul>
            </div>
          </div>
        </div>`;

      const solution = `
        <div class="case-solution">
          ${(detail.solutionNotes || []).map((s, i) => `
            <div class="case-solution__item">
              <i class="fa-solid ${solutionIcons[i % solutionIcons.length]}" aria-hidden="true"></i>
              <h4>${s.title}</h4>
              <p>${s.body}</p>
            </div>`).join('')}
        </div>`;

      const designProcess = `
        <div class="case-process">
          ${processSteps.map((step, i) => `
            <div class="case-process__step">
              <span class="case-process__dot">${String(i + 1).padStart(2, '0')}</span>
              <div>
                <span>${step.title}</span>
                <p>${step.body}</p>
              </div>
            </div>`).join('')}
        </div>`;

      const techStack = `
        <div class="case-stack-groups">
          ${['frontend', 'backend', 'design', 'git'].map((key) => {
            const items = stackGroups[key];
            if (!items || !items.length) return '';
            const meta = stackMeta[key];
            return `
              <div class="case-stack-group">
                <h4><i class="fa-solid ${meta.icon}" aria-hidden="true"></i>${meta.label}</h4>
                ${chipList(items)}
              </div>`;
          }).join('')}
        </div>`;

      const features = `
        <ul class="case-features">
          ${(detail.features || []).map((f) => `<li><i class="fa-solid fa-bolt" aria-hidden="true"></i>${f}</li>`).join('')}
        </ul>`;

      const gallery = `
        <div class="projects-gallery">
          <div class="swiper projects-gallery__main" data-projects-gallery>
            <div class="swiper-wrapper"></div>
            <div class="swiper-button-prev" aria-hidden="true"></div>
            <div class="swiper-button-next" aria-hidden="true"></div>
          </div>
          <div class="swiper projects-gallery__thumbs" data-projects-thumbs>
            <div class="swiper-wrapper"></div>
          </div>
        </div>`;

      const keyMetrics = `
        <div class="case-metrics">
          ${metrics.map((m) => `
            <div class="circle-meter">
              <div class="circle-meter__ring-wrap">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle class="circle-meter__track" cx="60" cy="60" r="52"></circle>
                  <circle class="circle-meter__ring" cx="60" cy="60" r="52" data-percent="${m.percent || 75}"></circle>
                </svg>
                <span class="circle-meter__value">${m.value}</span>
              </div>
              <span class="circle-meter__label">${m.label}</span>
              ${m.note ? `<span class="circle-meter__note">${m.note}</span>` : ''}
            </div>`).join('')}
        </div>`;

      const challengeCards = `
        <div class="case-challenges">
          ${challenges.map((c, i) => `
            <div class="challenge-card">
              <button type="button" class="challenge-card__head" aria-expanded="false" aria-controls="challenge-panel-${i}">
                <span>${i + 1}. ${c.challenge}</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </button>
              <div class="challenge-card__panel" id="challenge-panel-${i}">
                <div class="challenge-card__inner">
                  <div class="challenge-card__row">
                    <h4><i class="fa-solid fa-lightbulb" aria-hidden="true"></i>Solution</h4>
                    <p>${c.solution}</p>
                  </div>
                  <div class="challenge-card__row">
                    <h4><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>Outcome</h4>
                    <p>${c.outcome}</p>
                  </div>
                </div>
              </div>
            </div>`).join('')}
        </div>`;

      const learnings = `
        <ul class="case-learnings">
          ${(detail.learnings || []).map((l) => `<li><i class="fa-solid fa-lightbulb" aria-hidden="true"></i><span>${l}</span></li>`).join('')}
        </ul>`;

      const future = `
        <ul class="case-future">
          ${(detail.futureImprovements || []).map((f) => `<li><i class="fa-solid fa-rocket" aria-hidden="true"></i>${f}</li>`).join('')}
        </ul>`;

      return [
        section('fa-circle-info', 'Project Overview', overviewFacts),
        section('fa-user-tie', 'My Role', myRole),
        section('fa-triangle-exclamation', 'Business Problem', businessProblem),
        section('fa-diagram-project', 'Solution', solution),
        section('fa-pen-ruler', 'Design Process', designProcess),
        section('fa-layer-group', 'Tech Stack', techStack),
        section('fa-bolt', 'Features', features),
        section('fa-window-restore', 'Project Gallery', gallery),
        section('fa-chart-line', 'Key Metrics', keyMetrics),
        section('fa-mountain', 'Challenges', challengeCards),
        section('fa-graduation-cap', 'Learnings', learnings),
        section('fa-rocket', 'Future Improvements', future),
      ].join('');
    }

    initMetrics() {
      const content = $('[data-projects-content]', this.modal);
      if (!content) return;
      $$('.circle-meter__ring', content).forEach((ring) => {
        const r = parseFloat(ring.getAttribute('r')) || 52;
        const C = 2 * Math.PI * r;
        const pct = Math.min(100, Math.max(0, parseFloat(ring.dataset.percent) || 0));
        const target = C * (1 - pct / 100);
        if (this.gsap && !this.engine.reduced) {
          this.engine.perf.registerTimeline(
            this.gsap.fromTo(ring, { strokeDashoffset: C }, { strokeDashoffset: target, duration: 1.4, ease: 'power2.out', delay: 0.5 }),
          );
        } else {
          ring.style.strokeDashoffset = String(target);
        }
      });
    }

    initReveals() {
      const sections = $$('.case-section', this.modal);
      if (!sections.length) return;
      if (this.engine.ScrollTrigger && this.gsap && !this.engine.reduced) {
        const scrollEl = $('[data-projects-scroll]', this.modal);
        if (!scrollEl) return;
        sections.forEach((sec) => {
          const tl = this.gsap.timeline({
            scrollTrigger: { trigger: sec, scroller: scrollEl, start: 'top 88%', once: true },
          });
          tl.fromTo(sec, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' });
          this.modalTls.push(tl);
          this.engine.perf.registerTimeline(tl);
        });
        window.setTimeout(() => { if (this.engine.ScrollTrigger) this.engine.ScrollTrigger.refresh(); }, 80);
      } else if (this.gsap && !this.engine.reduced) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(sections, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', delay: 0.25 }),
        );
      }
    }

    buildRelated(detail) {
      const wrap = $('[data-projects-related]', this.modal);
      if (!wrap) return;
      if (this.relatedSwiper) { this.relatedSwiper.destroy(true, true); this.relatedSwiper = null; }
      const ids = (detail.related || []).filter((id) => PROJECT_DETAILS[id]);
      if (!ids.length) { wrap.hidden = true; wrap.innerHTML = ''; return; }
      wrap.hidden = false;
      wrap.innerHTML = `
        <div class="case-section__head">
          <span class="case-section__index">NEXT</span>
          <h3><i class="fa-solid fa-arrow-right-long" aria-hidden="true"></i>Related Projects</h3>
        </div>
        <div class="swiper related-slider" data-swiper="projects-related">
          <div class="swiper-wrapper">
            ${ids.map((id) => {
              const p = PROJECT_DETAILS[id];
              return `
                <div class="swiper-slide">
                  <article class="related-card" data-project="${id}" tabindex="0" role="button" aria-label="Open ${p.title}">
                    <div class="related-card__media">
                      ${ART_VARIANTS[p.art] ? ART_VARIANTS[p.art]() : ''}
                      <span class="related-card__cat">${p.categoryLabel}</span>
                    </div>
                    <div class="related-card__body">
                      <h4 class="related-card__title">${p.title}</h4>
                      <p class="related-card__sub">${p.type} · ${p.duration}</p>
                    </div>
                  </article>
                </div>`;
            }).join('')}
          </div>
        </div>`;
      if (window.Swiper) {
        const el = $('[data-swiper="projects-related"]', wrap);
        this.relatedSwiper = new window.Swiper(el, {
          slidesPerView: 1,
          spaceBetween: 16,
          grabCursor: true,
          breakpoints: { 640: { slidesPerView: 2 }, 960: { slidesPerView: 3 } },
        });
        this.engine.perf.swipers.add(this.relatedSwiper);
      }
    }

    /* ----- Gallery (main + thumbnails) ----- */
    initGallery() {
      this.destroyGallery();
      const detail = this.currentDetail;
      if (!detail || !window.Swiper) return;
      const main = $('[data-projects-gallery]', this.modal);
      if (!main) return;
      const screens = detail.uiScreens || [];
      main.querySelector('.swiper-wrapper').innerHTML = screens.map((s, i) => `
        <div class="swiper-slide" data-gallery-index="${i}">
          <div class="gallery-slide">
            <div class="gallery-slide__art">${ART_VARIANTS[s.art] ? ART_VARIANTS[s.art]() : ''}</div>
            <span class="gallery-slide__caption">${s.title}</span>
          </div>
        </div>`).join('');
      this.gallerySwiper = new window.Swiper(main, {
        slidesPerView: 1,
        spaceBetween: 0,
        grabCursor: true,
        navigation: {
          nextEl: main.querySelector('.swiper-button-next'),
          prevEl: main.querySelector('.swiper-button-prev'),
        },
      });
      this.engine.perf.swipers.add(this.gallerySwiper);

      const thumbs = $('[data-projects-thumbs]', this.modal);
      if (thumbs && screens.length > 1) {
        thumbs.querySelector('.swiper-wrapper').innerHTML = screens.map((s) => `
          <div class="swiper-slide">${ART_VARIANTS[s.art] ? ART_VARIANTS[s.art]() : ''}</div>`).join('');
        this.thumbSwiper = new window.Swiper(thumbs, {
          slidesPerView: 4,
          spaceBetween: 12,
          freeMode: true,
          watchSlidesProgress: true,
        });
        this.engine.perf.swipers.add(this.thumbSwiper);
        this.gallerySwiper.controller.control = this.thumbSwiper;
        this.thumbSwiper.controller.control = this.gallerySwiper;
      }
    }

    destroyGallery() {
      if (this.gallerySwiper) { this.gallerySwiper.destroy(true, true); this.gallerySwiper = null; }
      if (this.thumbSwiper) { this.thumbSwiper.destroy(true, true); this.thumbSwiper = null; }
      if (this.relatedSwiper) { this.relatedSwiper.destroy(true, true); this.relatedSwiper = null; }
      if (this.modalTls.length) {
        this.modalTls.forEach((tl) => {
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
        });
        this.modalTls = [];
      }
    }

    toggleChallenge(head) {
      const card = head.closest('.challenge-card');
      if (!card) return;
      const panel = card.querySelector('.challenge-card__panel');
      const open = card.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(open));
      if (this.gsap && !this.engine.reduced) {
        this.gsap.to(panel, { height: open ? 'auto' : 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      } else {
        panel.style.height = open ? 'auto' : 0;
      }
    }

    shareProject() {
      const detail = this.currentDetail;
      const title = detail ? detail.title : 'A project';
      const url = location.href.split('#')[0];
      if (navigator.share) {
        navigator.share({ title, text: `Check out ${title}`, url }).catch(() => {});
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(`${title} — ${url}`)
          .then(() => this.toast('Link copied to clipboard', 'fa-share-nodes'))
          .catch(() => this.toast('Could not copy link', 'fa-triangle-exclamation'));
        return;
      }
      this.toast('Copy the URL to share this project', 'fa-share-nodes');
    }

    downloadCase() {
      const detail = this.currentDetail;
      this.toast(`${detail ? detail.title : 'Case study'} PDF — coming soon`, 'fa-file-arrow-down');
    }

    openExternal(url, label, icon) {
      if (url && /^https?:\/\//.test(url)) {
        window.open(url, '_blank', 'noopener');
      } else {
        this.toast(`${label} — coming soon`, icon || 'fa-circle-check');
      }
    }

    activateFocusTrap() {
      this.lastFocused = document.activeElement;
      this.focusTrapHandler = (e) => {
        if (e.key !== 'Tab' || !this.modal || this.modal.hidden) return;
        const focusables = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea', this.modal)
          .filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };
      document.addEventListener('keydown', this.focusTrapHandler, true);
    }

    deactivateFocusTrap() {
      if (this.focusTrapHandler) {
        document.removeEventListener('keydown', this.focusTrapHandler, true);
        this.focusTrapHandler = null;
      }
      if (this.lastFocused && typeof this.lastFocused.focus === 'function') this.lastFocused.focus();
      this.lastFocused = null;
    }

    /* ----- Lightbox ----- */
    openLightbox(index) {
      if (!this.currentDetail || !this.lightbox || !this.lightboxStage) return;
      const screens = this.currentDetail.uiScreens;
      if (!screens.length) return;
      this.lightboxIndex = ((index % screens.length) + screens.length) % screens.length;
      const screen = screens[this.lightboxIndex];
      this.zoom = 1;
      this.lightboxStage.classList.remove('is-zoomed');
      this.lightboxStage.innerHTML = `<div class="projects-art">${ART_VARIANTS[screen.art] ? ART_VARIANTS[screen.art]() : ''}</div>`;
      const caption = $('[data-projects-lightbox-caption]', this.lightbox);
      if (caption) caption.textContent = screen.title;
      this.lightbox.hidden = false;
    }

    closeLightbox() {
      if (!this.lightbox || this.lightbox.hidden) return;
      this.lightbox.hidden = true;
      this.lightboxStage.innerHTML = '';
    }

    prevLightbox() {
      this.openLightbox(this.lightboxIndex - 1);
    }

    nextLightbox() {
      this.openLightbox(this.lightboxIndex + 1);
    }

    setZoom(level) {
      this.zoom = Math.min(2.2, Math.max(1, level));
      const art = $('.projects-art', this.lightboxStage);
      if (!art) return;
      if (this.gsap && !this.engine.reduced) {
        this.gsap.to(art, { scale: this.zoom, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      } else {
        this.lightboxStage.classList.toggle('is-zoomed', this.zoom > 1.2);
      }
    }

    /* ----- Feedback toast ----- */
    toast(message, icon = 'fa-circle-check') {
      if (!this.toastEl) {
        this.toastEl = document.createElement('div');
        this.toastEl.className = 'projects-toast';
        document.body.appendChild(this.toastEl);
      }
      this.toastEl.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${message}</span>`;
      this.toastEl.classList.add('is-visible');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.toastEl.classList.remove('is-visible'), 2400);
    }

    /* ----- Entrance choreography ----- */
    entrance() {
      if (this.entered) return;
      this.entered = true;
      const toolbar = $('[data-projects-toolbar]', this.section);
      const stats = $('[data-projects-stats]', this.section);
      const play = () => {
        if (this.played) return;
        this.played = true;
        if (!this.gsap || this.engine.reduced) return;
        const tl = this.engine.perf.registerTimeline(
          this.gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } }),
        );
        if (toolbar) tl.from(toolbar, { y: 32, autoAlpha: 0, clearProps: 'all' });
        if (this.host) tl.from(this.host, { y: 40, autoAlpha: 0, scale: 0.98, clearProps: 'all' }, '-=0.3');
        if (stats) tl.from(stats, { y: 40, autoAlpha: 0, stagger: 0.1, clearProps: 'all' }, '-=0.4');
      };
      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.timeline({
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: play,
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            play();
            io.disconnect();
          }
        }, { threshold: 0.1 });
        io.observe(this.section);
      }
    }
  }

  /* ====================================================================
   * 16b. DEVELOPER DASHBOARD ANIMATION — chart, choreography, ripple
   * ================================================================== */
  class DeveloperDashboardAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#developer-dashboard');
      this.played = false;
      this.chart = null;
      this.data = null;
      this.chartSrc = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
      this._chartPromise = null;
    }

    init() {
      window.addEventListener('anis:dashboard:data', (e) => this.onData(e.detail), { passive: true });
      if (!this.section) return;

      this.bindRipple();

      // Reduced motion: never animate, but still render data-driven visuals
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.1 });
        io.observe(this.section);
      }
    }

    /** Delegated material ripple — covers static + injected interactive nodes */
    bindRipple() {
      this.section.addEventListener('click', (e) => {
        const target = e.target.closest(
          '[data-ripple], .devdash-tabs__btn, .devdash-status__retry, .devdash-profile__link, .devdash-pin__link',
        );
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 2;
        ripple.className = 'ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        target.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
    }

    /** Panel stagger reveal when the section enters the viewport */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-dev-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 44, opacity: 0, filter: 'blur(8px)' },
            {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.12,
              clearProps: 'all',
            },
          ),
        );
      }

      this.buildChart();
      this.drawWorkflow();
    }

    onData(detail) {
      this.data = detail || null;
      if (this.played) this.buildChart();
    }

    /** Dynamic loader — Chart.js is only fetched when the chart is revealed */
    loadChart() {
      if (window.Chart) return Promise.resolve(window.Chart);
      if (this._chartPromise) return this._chartPromise;
      this._chartPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = this.chartSrc;
        script.async = true;
        script.onload = () => resolve(window.Chart || null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      });
      return this._chartPromise;
    }

    async buildChart() {
      const canvas = $('[data-dashboard-chart]', this.section);
      const empty = $('[data-dashboard-chart-empty]', this.section);
      if (!canvas || !this.data || !this.data.langs || !this.data.langs.labels) return;

      const Chart = await this.loadChart();
      if (!Chart) return; // CDN blocked → app.js legend is the fallback

      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }

      const { labels, values, palette } = this.data.langs;
      const colors = palette || ['#4F46E5', '#06B6D4', '#8B5CF6', '#22C55E', '#F59E0B'];

      this.chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: 'rgba(0,0,0,0.15)',
            borderWidth: 2,
            hoverOffset: 10,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '68%',
          animation: this.engine.reduced ? false : { duration: 1200, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(2, 6, 23, 0.9)',
              titleColor: '#F8FAFC',
              bodyColor: '#CBD5E1',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
              },
            },
          },
        },
        plugins: [this.centerTextPlugin()],
      });

      if (empty) {
        empty.textContent = '';
        empty.hidden = true;
      }
    }

    /** Draw the dominant language + share in the doughnut hole */
    centerTextPlugin() {
      const section = this.section;
      return {
        id: 'devdashCenterText',
        afterDraw(chart) {
          const { ctx, chartArea, data } = chart;
          if (!chartArea || !data || !data.labels) return;

          const values = data.datasets[0].data;
          const topIndex = values.reduce(
            (best, value, i) => (value > best.value ? { value, i } : best),
            { value: -1, i: 0 },
          ).i;

          const cx = (chartArea.left + chartArea.right) / 2;
          const cy = (chartArea.top + chartArea.bottom) / 2;
          const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace';
          const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#E2E8F0';
          const textTertiary = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#94A3B8';

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.font = `700 18px ${mono}`;
          ctx.fillStyle = textPrimary;
          ctx.fillText(String(data.labels[topIndex] || '').slice(0, 12), cx, cy - 12);

          ctx.font = `500 13px ${mono}`;
          ctx.fillStyle = textTertiary;
          ctx.fillText(`${values[topIndex]}%`, cx, cy + 14);
          ctx.restore();
        },
      };
    }

    /** Step-by-step workflow choreography */
    drawWorkflow() {
      const steps = $$('[data-flow-step]', this.section);
      if (!steps.length) return;

      if (this.gsap && !this.engine.reduced) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            steps,
            { y: 26, opacity: 0, scale: 0.9 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.7,
              ease: 'back.out(1.6)',
              stagger: 0.09,
              clearProps: 'all',
            },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the section became visible while data loaded */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 15b. PROFESSIONAL EXPERTISE ANIMATION — capability showcase motion
   * ================================================================== */
  class ExpertiseAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#expertise');
      this.played = false;
    }

    init() {
      if (!this.section) return;

      this.bindChips();

      // Reduced motion: never choreograph, keep interactivity only
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.1 });
        io.observe(this.section);
      }
    }

    /** Toggleable technology chips — press to highlight the stack */
    bindChips() {
      $$('.exp-chip', this.section).forEach((chip) => {
        if (chip.classList.contains('exp-chip--static')) return;
        chip.addEventListener('click', () => {
          const pressed = chip.getAttribute('aria-pressed') === 'true';
          chip.setAttribute('aria-pressed', String(!pressed));
          chip.classList.toggle('is-active', !pressed);
        });
      });
    }

    /** Panel + workflow stagger when the section enters the viewport */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-exp-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 44, opacity: 0, filter: 'blur(8px)' },
            {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.12,
              clearProps: 'all',
            },
          ),
        );
      }

      this.drawWorkflow();
    }

    /** Step-by-step workflow choreography */
    drawWorkflow() {
      const steps = $$('[data-exp-flow]', this.section);
      if (!steps.length) return;

      if (this.gsap && !this.engine.reduced) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            steps,
            { y: 26, opacity: 0, scale: 0.9 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.7,
              ease: 'back.out(1.6)',
              stagger: 0.09,
              clearProps: 'all',
            },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the section became visible early */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 15c. LEARNING ROADMAP ANIMATION — roadmap reveals, workflow, expand
   * ================================================================== */
  class RoadmapAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#roadmap');
      this.played = false;
    }

    init() {
      if (!this.section) return;

      this.bindExpand();

      // Reduced motion: keep interactivity, skip choreography
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.05 });
        io.observe(this.section);
      }
    }

    /** Expandable future-learning cards — toggle + ARIA sync */
    bindExpand() {
      $$('.rm-expand-card__toggle', this.section).forEach((btn) => {
        btn.addEventListener('click', () => {
          const wasExpanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!wasExpanded));
          btn.closest('.rm-expand-card').classList.toggle('is-open', !wasExpanded);
          const detail = btn.parentElement.querySelector('.rm-expand-card__detail');
          if (detail) detail.hidden = wasExpanded;
        });
      });
    }

    /** Staggered reveal for every roadmap grid group */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-rm-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 32, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.07,
              clearProps: 'all',
            },
          ),
        );
      }

      this.drawWorkflow();
      this.drawVision();
    }

    /** Progress bar fill + step entrance for the learning loop */
    drawWorkflow() {
      const steps = $$('[data-rm-flow]', this.section);
      if (this.gsap && !this.engine.reduced && steps.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            steps,
            { y: 22, opacity: 0, scale: 0.92 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: 'back.out(1.7)',
              stagger: 0.08,
              clearProps: 'all',
            },
          ),
        );
      }

      const fill = $('[data-rm-flow-progress]', this.section);
      if (this.gsap && !this.engine.reduced && fill) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            fill,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.9, ease: 'power2.inOut', delay: 0.4 },
          ),
        );
      }
    }

    /** Career spine draw + role cards slide-in */
    drawVision() {
      const items = $$('[data-rm-vision]', this.section);
      if (this.gsap && !this.engine.reduced && items.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            items,
            { x: -28, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.12,
              clearProps: 'all',
            },
          ),
        );
      }

      const rail = $('[data-rm-vision-rail]', this.section);
      if (this.gsap && !this.engine.reduced && rail) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            rail,
            { scaleY: 0 },
            { scaleY: 1, duration: 1.1, ease: 'power2.inOut', transformOrigin: 'top center' },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the section became visible early */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 15d. ACHIEVEMENTS HUB ANIMATION — milestone reveals, leadership draw,
   *      certification expand
   * ================================================================== */
  class AchievementsAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#achievements');
      this.played = false;
    }

    init() {
      if (!this.section) return;

      this.bindExpand();

      // Reduced motion: keep interactivity, skip choreography
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.05 });
        io.observe(this.section);
      }
    }

    /** Expandable certification cards — toggle + ARIA sync */
    bindExpand() {
      $$('.ach-cert__toggle', this.section).forEach((btn) => {
        btn.addEventListener('click', () => {
          const wasExpanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!wasExpanded));
          btn.closest('.ach-cert').classList.toggle('is-open', !wasExpanded);
          const detail = document.getElementById(btn.getAttribute('aria-controls'));
          if (detail) detail.hidden = wasExpanded;
        });
      });
    }

    /** Staggered reveal for every achievement grid group */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-ach-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 32, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.07,
              clearProps: 'all',
            },
          ),
        );
      }

      this.drawLeading();
    }

    /** Leadership spine draw + journey items slide-in */
    drawLeading() {
      const items = $$('[data-ach-lead]', this.section);
      if (this.gsap && !this.engine.reduced && items.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            items,
            { x: -28, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.12,
              clearProps: 'all',
            },
          ),
        );
      }

      const rail = $('[data-ach-lead-rail]', this.section);
      if (this.gsap && !this.engine.reduced && rail) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            rail,
            { scaleY: 0 },
            { scaleY: 1, duration: 1.1, ease: 'power2.inOut', transformOrigin: 'top center' },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the section became visible early */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 15e. RECOMMENDATIONS ANIMATION — reputation dashboard reveals,
   *      timeline draw, CTA magnetic/ripple wiring
   * ================================================================== */
  class RecommendationsAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#recommendations');
      this.played = false;
    }

    init() {
      if (!this.section) return;

      // Reduced motion: keep interactivity, skip choreography
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.05 });
        io.observe(this.section);
      }
    }

    /** Staggered reveal for every recommendations grid group */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-rec-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 32, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.07,
              clearProps: 'all',
            },
          ),
        );
      }

      this.drawTimeline();
    }

    /** Recognition spine draw + milestone cards slide-in */
    drawTimeline() {
      const milestones = $$('[data-rec-milestone]', this.section);
      if (this.gsap && !this.engine.reduced && milestones.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            milestones,
            { x: -28, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.12,
              clearProps: 'all',
            },
          ),
        );
      }

      const rail = $('[data-rec-rail]', this.section);
      if (this.gsap && !this.engine.reduced && rail) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            rail,
            { scaleY: 0 },
            { scaleY: 1, duration: 1.1, ease: 'power2.inOut', transformOrigin: 'top center' },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the section became visible early */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 15f. KNOWLEDGE HUB ANIMATION — filters, live search, reveals, journal
   * ================================================================== */
  class KnowledgeHubAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('#knowledge-hub');
      this.activeCategory = 'all';
      this.query = '';
      this.played = false;
    }

    init() {
      if (!this.section) return;

      this.bindFilters();
      this.bindSearch();
      this.bindBookmarks();
      this.bindNewsletter();

      // Reduced motion: keep interactivity, skip choreography
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 70%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.05 });
        io.observe(this.section);
      }
    }

    /** Category filter buttons — flip active state + re-filter */
    bindFilters() {
      $$('.hub-filter', this.section).forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.dataset.hubFilter === this.activeCategory) return;
          this.activeCategory = btn.dataset.hubFilter;
          $$('.hub-filter', this.section).forEach((b) => {
            const active = b.dataset.hubFilter === this.activeCategory;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', String(active));
          });
          this.applyFilters();
        });
      });
    }

    /** Live search input + clear button */
    bindSearch() {
      const input = $('[data-hub-search]', this.section);
      const clear = $('[data-hub-clear]', this.section);
      if (!input) return;
      input.addEventListener('input', (e) => {
        this.query = e.target.value.trim().toLowerCase();
        if (clear) clear.classList.toggle('is-visible', this.query.length > 0);
        this.applyFilters();
      });
      if (clear) {
        clear.addEventListener('click', () => {
          input.value = '';
          this.query = '';
          clear.classList.remove('is-visible');
          input.focus();
          this.applyFilters();
        });
      }
    }

    /** Decorative bookmark toggle (local UI state only) */
    bindBookmarks() {
      $$('[data-bookmark]', this.section).forEach((btn) => {
        btn.addEventListener('click', () => {
          const marked = btn.getAttribute('aria-pressed') === 'true';
          btn.setAttribute('aria-pressed', String(!marked));
          btn.classList.toggle('is-bookmarked', !marked);
          const icon = btn.querySelector('i');
          if (icon) icon.className = marked ? 'fa-regular fa-bookmark' : 'fa-solid fa-bookmark';
        });
      });
    }

    /** Placeholder newsletter — prevent default until wired to a provider */
    bindNewsletter() {
      const form = $('[data-newsletter]', this.section);
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Placeholder: real subscription hooks in here later.
      });
    }

    shouldShow(card) {
      const category = card.dataset.hubCat || '';
      if (this.activeCategory !== 'all' && !category.split(/\s+/).includes(this.activeCategory)) return false;
      if (!this.query) return true;
      const hay = [
        card.dataset.hubTitle || '',
        category,
        card.textContent || '',
      ].join(' ').toLowerCase();
      return hay.includes(this.query);
    }

    applyFilters() {
      let visibleCount = 0;
      $$('[data-hub-card]', this.section).forEach((card) => {
        const show = this.shouldShow(card);
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      const empty = $('[data-hub-empty]');
      if (empty) empty.hidden = visibleCount > 0;
      if (visibleCount && this.gsap && !this.engine.reduced) {
        const visible = $$('[data-hub-card]', this.section).filter((c) => c.style.display !== 'none');
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            visible,
            { autoAlpha: 0.4, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out', overwrite: 'auto' },
          ),
        );
      }
    }

    /** Staggered reveal for every knowledge-hub group */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-hub-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 32, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.07,
              clearProps: 'all',
            },
          ),
        );
      }

      this.drawJournal();
      this.engine.initSwiper();
    }

    /** Learning journal spine draw + entry cards slide-in */
    drawJournal() {
      const items = $$('[data-hub-journal]', this.section);
      if (this.gsap && !this.engine.reduced && items.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            items,
            { x: -28, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.12,
              clearProps: 'all',
            },
          ),
        );
      }

      const rail = $('[data-hub-journal-rail]', this.section);
      if (this.gsap && !this.engine.reduced && rail) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            rail,
            { scaleY: 0 },
            { scaleY: 1, duration: 1.1, ease: 'power2.inOut', transformOrigin: 'top center' },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the section became visible early */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 17. TERMINAL FOOTER ANIMATION — OS shutdown-screen reveal
   * ================================================================== */
  class TerminalFooterAnimation {
    constructor(engine) {
      this.engine = engine;
      this.gsap = engine.gsap;
      this.section = $('[data-terminal-footer]');
      this.played = false;
    }

    init() {
      if (!this.section) return;

      // Reduced motion: keep static layout, skip choreography
      if (!this.gsap || this.engine.reduced) {
        this.played = true;
        return;
      }

      if (this.engine.ScrollTrigger) {
        this.engine.perf.registerTimeline(
          this.gsap.to({}, {
            scrollTrigger: {
              trigger: this.section,
              start: 'top 80%',
              once: true,
              onEnter: () => this.entrance(),
            },
          }),
        );
      } else if ('IntersectionObserver' in window) {
        const io = this.engine.perf.createObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.entrance();
            io.disconnect();
          }
        }, { threshold: 0.05 });
        io.observe(this.section);
      }
    }

    /** Staggered rise of hero, nav row, stack, panels, and bottom bar */
    entrance() {
      if (this.played) return;
      this.played = true;

      const targets = $$('[data-footer-reveal]', this.section);
      if (this.gsap && !this.engine.reduced && targets.length) {
        this.engine.perf.registerTimeline(
          this.gsap.fromTo(
            targets,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.1,
              clearProps: 'all',
            },
          ),
        );
      }
    }

    /** Re-check on refresh() in case the footer became visible early */
    rescan() {
      if (this.played || !this.section) return;
      const rect = this.section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) this.entrance();
    }
  }

  /* ====================================================================
   * 18. PUBLIC API — namespace + feature flags for app.js coordination
   * ================================================================== */
  const engine = new AnimationEngine();

  /** Synchronous flag surface — app.js reads these at its own init */
  const PUBLIC_API = {
    features: Object.freeze({
      cursor: true,     // app.js Cursor stands down
      magnetic: true,   // app.js magnetic stands down
      tilt: true,       // app.js Cards stands down
      counters: true,   // app.js Counter stands down
      particles: true,  // app.js particles init stands down
      aos: true,        // app.js Animations AOS/GSAP-hero stands down
      swiper: true,     // app.js initSwiper stands down
      developerDashboard: true, // Developer Dashboard motion (Chart.js + reveals)
      expertise: true,  // Professional Expertise showcase motion + chips
      roadmap: true,    // Learning Roadmap reveal, workflow + expand cards
      achievements: true, // Achievements Hub reveals, leadership draw + expand cards
      recommendations: true, // Recommendations reveals, timeline draw
      knowledgeHub: true, // Knowledge Hub filters, search + reveals
      terminalFooter: true, // Terminal Footer shutdown-screen reveal
    }),
    engine,
    refresh: () => engine.refresh(),
    perf: engine.perf,
    isActive: () => !engine.reduced,
  };

  window.ANIS_OS_ANIMATIONS = PUBLIC_API;

  /* ====================================================================
   * 18. BOOT SEQUENCE — initialize when the DOM is ready
   * ================================================================== */
  function boot() {
    engine.init();

    // Loader exit + hero entrance run on the load event (assets ready)
    window.addEventListener(
      'load',
      () => {
        engine.modules.loader.finish().then(() => {
          engine.start();
        });
      },
      { once: true, passive: true },
    );

    // Safety: if load has already fired (very fast/static hosts)
    if (document.readyState === 'complete') {
      window.dispatchEvent(new Event('load'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window, document);
