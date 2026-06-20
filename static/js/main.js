/* ============================================================
   SAHIL AHAMED — ETHEREAL PORTFOLIO
   Main JavaScript Controller
   ============================================================
   Features:
     1. Loading Screen Animation
     2. Three.js Particle Field (Hero Background)
     3. GSAP Scroll Animations & Hero Entrance
     4. Navigation (scroll spy, hamburger, scrolled state)
     5. Custom Cursor (desktop, fine-pointer only)
     6. Typewriter Effect
     7. Contact Form Submission
     8. Magnetic Button Effect
     9. prefers-reduced-motion Support
   ============================================================ */

(() => {
  'use strict';

  /* ----------------------------------------------------------
     0.  GLOBALS & HELPERS
  ---------------------------------------------------------- */

  const isMobile        = window.innerWidth < 768;
  const isDesktop       = window.innerWidth >= 1024;
  const prefersReduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer  = window.matchMedia('(pointer: fine)').matches;

  /** Shorthand selectors */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Clamp utility */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Lerp utility */
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Store cleanup callbacks */
  const cleanups = [];

  /* ----------------------------------------------------------
     1.  LOADING SCREEN ANIMATION
  ---------------------------------------------------------- */

    const initLoader = () => {
    const loader = $('#cinematic-loader');
    const burstCenter = $('.cl-burst-center');
    const particleLayer = $('.cl-particle-layer');
    const posterContainer = $('.cl-poster-container');
    const posterImg = $('.cl-poster-img');
    const progressFill = $('.cl-progress-fill');

    if (!loader) return Promise.resolve();

    return new Promise((resolve) => {
      // Exit loader sequence
      const exitLoader = () => {
        const exitTl = gsap.timeline({
          onComplete: () => {
            loader.style.display = 'none';
            resolve();
          }
        });

        if (prefersReduced) {
          exitTl.to(loader, { opacity: 0, duration: 0.5 });
          return;
        }

        exitTl.to(posterContainer, { 
          scale: 1.1, 
          duration: 0.6, 
          ease: "power2.in" 
        }, 0)
        .to(loader, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in"
        }, 0.2);
      };

      if (prefersReduced) {
        // Fallback for reduced motion
        gsap.to(posterContainer, { opacity: 1, duration: 0.5 });
        setTimeout(exitLoader, 1500); // Wait 1.5s then exit
        return;
      }

      // 4-Phase Cinematic Sequence
      const tl = gsap.timeline();
      
      // Phase 1: Burst-in (0.0 - 0.5s)
      tl.set(loader, { autoAlpha: 1 })
        .set(burstCenter, { scale: 0, opacity: 1 })
        .set(particleLayer, { scale: 0.8, opacity: 0 })
        .set(posterContainer, { scale: 0.92, clipPath: "circle(0% at 50% 50%)" })
        .set(progressFill, { scaleX: 0, transformOrigin: "left center" });

      tl.to(burstCenter, {
        scale: 4,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out"
      }, 0)
      .to(particleLayer, {
        scale: 1.5,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out"
      }, 0)
      .to(particleLayer, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in"
      }, 0.3);

      // Phase 2: Image Reveal (0.4s - 1.2s)
      tl.to(posterContainer, {
        clipPath: "circle(100% at 50% 50%)",
        duration: 0.8,
        ease: "power3.inOut"
      }, 0.3)
      .to(posterContainer, {
        scale: 1,
        duration: 1.0,
        ease: "power2.out"
      }, 0.3);

      // Phase 3: Text/detail emphasis (1.0s - 1.8s)
      tl.to(progressFill, {
        scaleX: 1,
        duration: 0.8,
        ease: "power1.inOut"
      }, 1.0);

      // Phase 4: Wait for load or Timeout (max 2.5s)
      let isLoaded = false;
      const minDurationPassed = new Promise(res => setTimeout(res, 1800)); // Minimum display time
      
      const checkExit = () => {
        if (isLoaded) {
          exitLoader();
        }
      };

      // When window loads or maximum 2.5s timeout reached
      const timeoutFallback = setTimeout(() => {
        isLoaded = true;
        checkExit();
      }, 2500);

      window.addEventListener('load', () => {
        minDurationPassed.then(() => {
          isLoaded = true;
          clearTimeout(timeoutFallback);
          checkExit();
        });
      });
      
      // If it's already loaded
      if (document.readyState === 'complete') {
        minDurationPassed.then(() => {
            isLoaded = true;
            clearTimeout(timeoutFallback);
            checkExit();
        });
      }
    });
  };

  /* ----------------------------------------------------------
     2.  THREE.JS PARTICLE FIELD  (Hero Background)
  ---------------------------------------------------------- */

  let threeCleanup = null;

  const initThreeScene = () => {
    const canvas = $('#hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    /* --- Scene, Camera, Renderer --- */
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* --- Particles --- */
    const particleCount = isMobile ? 500 : 1500;
    const positions     = new Float32Array(particleCount * 3);
    const colors        = new Float32Array(particleCount * 3);

    const primaryBlue = new THREE.Color('#3a7bd5');
    const skyBlue     = new THREE.Color('#85b7eb');

    for (let i = 0; i < particleCount; i++) {
      // Random point in a sphere of radius ~15
      const r     = 15 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Randomly pick blue or sky blue
      const col = Math.random() > 0.5 ? primaryBlue : skyBlue;
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    // Helper to generate a soft round particle texture dynamically
    const createCircleTexture = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 16;
      pCanvas.height = 16;
      const pCtx = pCanvas.getContext('2d');
      const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 16, 16);
      return new THREE.CanvasTexture(pCanvas);
    };

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      map: createCircleTexture(),
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* --- Wireframe Icosahedron --- */
    const icoGeo = new THREE.IcosahedronGeometry(2.5, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x3a7bd5,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    scene.add(icosahedron);

    /* --- Mouse Parallax --- */
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    /* --- Resize Handler --- */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    /* --- Animation Loop --- */
    let frameId = null;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Particle drift (sin/cos wave)
      const posArr = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        posArr[ix + 1] += Math.sin(elapsed + i * 0.1) * 0.002;
        posArr[ix]     += Math.cos(elapsed + i * 0.05) * 0.001;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Wireframe rotation
      icosahedron.rotation.x += 0.001;
      icosahedron.rotation.y += 0.002;

      // Smooth mouse parallax for camera
      target.x = lerp(target.x, mouse.x * 2, 0.05);
      target.y = lerp(target.y, mouse.y * 2, 0.05);
      camera.position.x = target.x;
      camera.position.y = target.y;

      renderer.render(scene, camera);
    };

    if (!prefersReduced) {
      animate();
    } else {
      // Render one static frame
      renderer.render(scene, camera);
    }

    /* --- Cleanup --- */
    threeCleanup = () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      particleGeo.dispose();
      particleMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      renderer.dispose();
    };
    cleanups.push(() => threeCleanup && threeCleanup());
  };

  /* ----------------------------------------------------------
     3.  GSAP ANIMATIONS
  ---------------------------------------------------------- */

  /** 3a — Hero Entrance (called after loader completes) */
  const playHeroEntrance = () => {
    if (prefersReduced) {
      // Set everything to final state
      gsap.set(['.hero__label', '.hero__title', '#hero-typed', '.hero__tagline', '.hero__ctas', '.hero__scroll-indicator'], {
        opacity: 1,
        y: 0,
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });

    tl.fromTo('.hero__label',
      { y: 40, opacity: 0 }, { y: 0, opacity: 1 })
      .fromTo('.hero__title',
        { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.65')
      .fromTo('#hero-typed',
        { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.65')
      .fromTo('.hero__tagline',
        { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.65')
      .fromTo('.hero__ctas',
        { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.65')
      .fromTo('.hero__scroll-indicator',
        { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.65');
  };

  /** 3b — ScrollTrigger Section Reveals */
  const initScrollAnimations = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    if (prefersReduced) {
      // Set all scroll-animated elements to their final state
      gsap.set(['.section__label', '.section__title', '.glass-card', '.service-card', '.skill-pill', '.timeline-step'], {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    /* Section labels & titles */
    $$('.section').forEach((section) => {
      const label = $('.section__label', section);
      const title = $('.section__title', section);

      if (label) {
        gsap.fromTo(label,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      if (title) {
        gsap.fromTo(title,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            delay: 0.1,
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    });

    /* Glass cards & service cards — stagger */
    $$('.section').forEach((section) => {
      const cards = $$('.glass-card, .service-card', section);
      if (cards.length) {
        gsap.fromTo(cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    });

    /* Skill pills */
    const pills = $$('.skill-pill');
    if (pills.length) {
      gsap.fromTo(pills,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: pills[0].closest('.section') || pills[0],
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    /* Timeline steps */
    const steps = $$('.timeline-step');
    if (steps.length) {
      gsap.fromTo(steps,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: steps[0].closest('.section') || steps[0],
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  };

  /** 3c — Stats Counter Animation */
  const initStatsCounter = () => {
    const statNumbers = $$('.stat-number');
    if (!statNumbers.length) return;

    if (prefersReduced) {
      statNumbers.forEach((el) => {
        el.textContent = el.dataset.target || '0';
      });
      return;
    }

    const aboutSection = $('#about') || statNumbers[0].closest('.section');
    if (!aboutSection) return;

    statNumbers.forEach((el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        snap: { val: 1 },
        scrollTrigger: {
          trigger: aboutSection,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          el.textContent = Math.round(obj.val);
        },
      });
    });
  };

  /** 3d — Process Timeline Horizontal Scroll (desktop) */
  const initHorizontalTimeline = () => {
    if (!isDesktop || prefersReduced) return;

    const timeline = $('#process-timeline');
    if (!timeline) return;

    const section = timeline.closest('.section');
    if (!section) return;

    const scrollWidth = timeline.scrollWidth - window.innerWidth;
    if (scrollWidth <= 0) return;

    gsap.to(timeline, {
      x: -scrollWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${scrollWidth}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  };

  /* ----------------------------------------------------------
     4.  NAVIGATION
  ---------------------------------------------------------- */

  const initNavigation = () => {
    const navbar    = $('#navbar');
    const hamburger = $('#hamburger');
    const navLinks  = $('#nav-links') || $('.navbar__links');
    const links     = $$('.nav-link');
    const sections  = $$('.section[id]');

    if (!navbar) return;

    const setMobileNavOpen = (isOpen) => {
      if (!hamburger || !navLinks) return;
      hamburger.classList.toggle('active', isOpen);
      navLinks.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    };

    /* Scrolled state */
    const updateNavbar = () => {
      if (window.scrollY > 100) {
        navbar.classList.add('navbar--scrolled');
      } else {
        navbar.classList.remove('navbar--scrolled');
      }
    };
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar(); // initial state
    cleanups.push(() => window.removeEventListener('scroll', updateNavbar));

    /* Smooth scroll on click (uses event delegation for all internal anchors) */
    const handleAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#' || !href.startsWith('#')) return;

      const target = $(href);
      if (target) {
        e.preventDefault();

        let scrollTarget = target;
        const isServiceOrSkill = link.classList.contains('service-card') || link.classList.contains('skill-pill');

        // If it's a portfolio link with category filter, trigger tab switch
        const category = link.getAttribute('data-category');
        if (category && href === '#portfolio') {
          const filterBtn = document.querySelector(`#filter-tabs .filter-tab[data-category="${category}"]`);
          if (filterBtn) {
            filterBtn.click();
          }
        }

        // If clicked from services or skill pills, go directly to the respective content grid/tabs rather than header
        if (isServiceOrSkill) {
          if (href === '#portfolio') {
            const gridTarget = $('#filter-tabs') || $('#portfolio-grid');
            if (gridTarget) scrollTarget = gridTarget;
          } else if (href === '#photography') {
            const gridTarget = $('#photography-grid');
            if (gridTarget) scrollTarget = gridTarget;
          } else if (href === '#thumbnails') {
            const gridTarget = $('#thumbnails-grid');
            if (gridTarget) scrollTarget = gridTarget;
          } else if (href === '#ai-video') {
            const gridTarget = $('.ai-section__comparison') || $('.ai-section__container');
            if (gridTarget) scrollTarget = gridTarget;
          }
        }

        // Calculate offset position for the fixed navbar (plus extra breathing space)
        const navbarHeight = $('#navbar')?.offsetHeight || 70;
        const offset = isServiceOrSkill ? 30 : 20; // slightly more breathing room for cards
        const elementPosition = scrollTarget.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });

        // Close mobile nav if needed
        if (hamburger && navLinks && (link.classList.contains('nav-link') || link.closest('#nav-links') || link.closest('.navbar__links'))) {
          setMobileNavOpen(false);
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);
    cleanups.push(() => document.removeEventListener('click', handleAnchorClick));

    /* Active section detection */
    const highlightActive = () => {
      let currentId = '';
      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 3) {
          currentId = sec.id;
        }
      });
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
      });
    };
    window.addEventListener('scroll', highlightActive, { passive: true });
    highlightActive();
    cleanups.push(() => window.removeEventListener('scroll', highlightActive));

    /* Hamburger toggle */
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        setMobileNavOpen(!navLinks.classList.contains('active'));
      });

      const closeNavOnEscape = (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
          setMobileNavOpen(false);
          hamburger.focus({ preventScroll: true });
        }
      };
      document.addEventListener('keydown', closeNavOnEscape);
      cleanups.push(() => document.removeEventListener('keydown', closeNavOnEscape));
    }
  };

  /* ----------------------------------------------------------
     5.  CUSTOM CURSOR  (Desktop / Fine Pointer Only)
  ---------------------------------------------------------- */

  const initCustomCursor = () => {
    if (!hasFinePointer || prefersReduced) return;

    const cursor   = $('#cursor');
    const follower = $('#cursor-follower');
    if (!cursor || !follower) return;

    let hasMoved = false;

    // Hide default cursor
    document.documentElement.style.cursor = 'none';

    const onMove = (e) => {
      if (!hasMoved) {
        cursor.classList.add('visible');
        follower.classList.add('visible');
        hasMoved = true;
      }
      gsap.set(cursor, { x: e.clientX, y: e.clientY });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3, ease: 'power2.out' });
    };
    document.addEventListener('mousemove', onMove);

    const onDocLeave = () => {
      cursor.classList.remove('visible');
      follower.classList.remove('visible');
    };
    const onDocEnter = () => {
      if (hasMoved) {
        cursor.classList.add('visible');
        follower.classList.add('visible');
      }
    };
    document.addEventListener('mouseleave', onDocLeave);
    document.addEventListener('mouseenter', onDocEnter);

    /* Hover interactions using event delegation */
    const onEnter = () => {
      gsap.to(cursor,   { scale: 1.5, backgroundColor: '#8B5CF6', duration: 0.25 });
      gsap.to(follower, { scale: 1.6, borderColor: '#8B5CF6', duration: 0.25 });
    };
    const onLeave = () => {
      gsap.to(cursor,   { scale: 1, backgroundColor: '', duration: 0.25, clearProps: 'backgroundColor' });
      gsap.to(follower, { scale: 1, borderColor: '', duration: 0.25, clearProps: 'borderColor' });
    };

    const handleOver = (e) => {
      const target = e.target.closest('a, button, .cta-btn, .nav-link, .service-card, .glass-card, .video-card, .filter-tab, .lightbox__btn');
      if (target) {
        onEnter();
      }
    };
    const handleOut = (e) => {
      const target = e.target.closest('a, button, .cta-btn, .nav-link, .service-card, .glass-card, .video-card, .filter-tab, .lightbox__btn');
      if (target) {
        onLeave();
      }
    };

    document.addEventListener('mouseover', handleOver);
    document.addEventListener('mouseout', handleOut);

    cleanups.push(() => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onDocLeave);
      document.removeEventListener('mouseenter', onDocEnter);
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mouseout', handleOut);
      document.documentElement.style.cursor = '';
    });
  };

  /* ----------------------------------------------------------
     6.  TYPEWRITER EFFECT
  ---------------------------------------------------------- */

  const initTypewriter = () => {
    const el = $('#hero-typed');
    if (!el) return;

    const words = [
      'Video Editor',
      'Cinematographer',
      'AI Creator',
      'Photographer',
      'Visual Storyteller',
    ];

    if (prefersReduced) {
      el.textContent = words[0];
      return;
    }

    let wordIdx  = 0;
    let charIdx  = 0;
    let isDeleting = false;
    let timeoutId  = null;

    const TYPE_SPEED   = 80;
    const DELETE_SPEED = 40;
    const PAUSE_TIME   = 2000;

    const tick = () => {
      const currentWord = words[wordIdx];

      if (!isDeleting) {
        // Typing
        charIdx++;
        el.textContent = currentWord.substring(0, charIdx);

        if (charIdx === currentWord.length) {
          // Finished typing — pause then start deleting
          isDeleting = true;
          timeoutId = setTimeout(tick, PAUSE_TIME);
          return;
        }
        timeoutId = setTimeout(tick, TYPE_SPEED);
      } else {
        // Deleting
        charIdx--;
        el.textContent = currentWord.substring(0, charIdx);

        if (charIdx === 0) {
          isDeleting = false;
          wordIdx = (wordIdx + 1) % words.length;
          timeoutId = setTimeout(tick, TYPE_SPEED);
          return;
        }
        timeoutId = setTimeout(tick, DELETE_SPEED);
      }
    };

    // Start after a short delay for the hero entrance
    timeoutId = setTimeout(tick, 600);

    cleanups.push(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
  };

  /* ----------------------------------------------------------
     7.  CONTACT FORM SUBMISSION
  ---------------------------------------------------------- */

  const initContactForm = () => {
    const form = $('#contact-form');
    if (!form) return;

    // Elements
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const formOverlay = $('#form-overlay');
    const successPopup = $('#success-popup');
    const successName = $('#success-name');
    const successClose = $('#success-close');
    const errorToast = $('#error-toast');

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Helper to show inline error
    const showError = (inputEl, message) => {
      inputEl.classList.add('has-error');
      const formGroup = inputEl.closest('.form-group');
      if (formGroup) {
        let errorEl = formGroup.querySelector('.field-error');
        if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'field-error';
          formGroup.appendChild(errorEl);
        }
        errorEl.textContent = message;
      }
    };

    // Helper to clear inline error
    const clearError = (inputEl) => {
      inputEl.classList.remove('has-error');
      const formGroup = inputEl.closest('.form-group');
      if (formGroup) {
        const errorEl = formGroup.querySelector('.field-error');
        if (errorEl) {
          errorEl.remove();
        }
      }
    };

    // Input validation listeners to clear errors on type/change
    const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => clearError(input));
      input.addEventListener('change', () => clearError(input));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Step A: Validation
      let isValid = true;
      inputs.forEach(input => {
        clearError(input);

        // Required check
        if (input.hasAttribute('required') && !input.value.trim()) {
          const fieldLabel = input.previousElementSibling ? input.previousElementSibling.textContent : 'Field';
          showError(input, `${fieldLabel} is required.`);
          isValid = false;
        } 
        // Email format check
        else if (input.type === 'email' && !emailRegex.test(input.value.trim())) {
          showError(input, 'Please enter a valid email address.');
          isValid = false;
        }
      });

      if (!isValid) return;

      // Step B: Show sending state
      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        submitBtn.style.pointerEvents = 'none';
        if (btnText) btnText.textContent = 'SENDING...';
      }
      if (formOverlay) {
        formOverlay.classList.add('visible');
      }

      // Collect data
      const formData = {};
      new FormData(form).forEach((value, key) => {
        formData[key] = value;
      });

      try {
        // Step C: Post request
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const result = await res.json();

        // Step D/E: Handle response
        if (res.ok && result.status === 'success') {
          // Success Path
          if (successName) {
            successName.textContent = formData.name;
          }
          if (successPopup) {
            successPopup.classList.add('visible');
            successPopup.setAttribute('aria-hidden', 'false');
          }

          // Reset the form
          form.reset();

          // Auto-close success popup after 5 seconds
          const autoCloseTimeout = setTimeout(() => {
            closeSuccess();
          }, 5000);

          const closeSuccess = () => {
            if (successPopup) {
              successPopup.classList.remove('visible');
              successPopup.setAttribute('aria-hidden', 'true');
            }
            successClose.removeEventListener('click', closeSuccess);
            clearTimeout(autoCloseTimeout);
          };

          successClose.addEventListener('click', closeSuccess);
        } else {
          // Failure Path
          throw new Error(result.message || 'Failed to send.');
        }

      } catch (err) {
        console.error('Contact form submit error:', err);
        // Show error toast
        if (errorToast) {
          errorToast.classList.add('visible');
          errorToast.setAttribute('aria-hidden', 'false');
          
          setTimeout(() => {
            errorToast.classList.remove('visible');
            errorToast.setAttribute('aria-hidden', 'true');
          }, 4000);
        }
      } finally {
        // Hide loading/sending states
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.style.pointerEvents = '';
          if (btnText) btnText.textContent = 'Send Message';
        }
        if (formOverlay) {
          formOverlay.classList.remove('visible');
        }
      }
    });
  };

  /* ----------------------------------------------------------
     7.5.  ABOUT IMAGE 3D TILT PARALLAX EFFECT
  ---------------------------------------------------------- */

  const initAboutImageTilt = () => {
    const card = $('.about__image');
    const wrapper = $('.about__image-wrapper');
    if (!card || !wrapper || isMobile || prefersReduced) return;

    const onMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      const tiltX = -y * 15;
      const tiltY = x * 15;
      
      const transX = x * 8;
      const transY = y * 8;

      gsap.to(card, {
        rotationX: tiltX,
        rotationY: tiltY,
        x: transX,
        y: transY,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      const img = card.querySelector('img');
      if (img) {
        gsap.to(img, {
          x: -x * 12,
          y: -y * 12,
          scale: 1.06,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto'
      });

      const img = card.querySelector('img');
      if (img) {
        gsap.to(img, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      }
    };

    wrapper.addEventListener('mousemove', onMouseMove);
    wrapper.addEventListener('mouseleave', onMouseLeave);

    cleanups.push(() => {
      wrapper.removeEventListener('mousemove', onMouseMove);
      wrapper.removeEventListener('mouseleave', onMouseLeave);
    });
  };

  /* ----------------------------------------------------------
     8.  MAGNETIC BUTTON EFFECT  (Desktop Only)
  ---------------------------------------------------------- */

  const initMagneticButtons = () => {
    if (!isDesktop || prefersReduced) return;

    const buttons = $$('.cta-btn');

    buttons.forEach((btn) => {
      const onMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x    = e.clientX - rect.left - rect.width / 2;
        const y    = e.clientY - rect.top  - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const onLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        });
      };

      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);

      cleanups.push(() => {
        btn.removeEventListener('mousemove', onMove);
        btn.removeEventListener('mouseleave', onLeave);
      });
    });
  };

  /* ----------------------------------------------------------
     9.  BOOTSTRAP — WIRE EVERYTHING UP
  ---------------------------------------------------------- */

  const boot = async () => {
    // Start loader, Three scene can initialize in parallel
    initThreeScene();

    await initLoader();

    // After loader
    playHeroEntrance();
    initTypewriter();
    initScrollAnimations();
    initStatsCounter();
    initHorizontalTimeline();
    initNavigation();
    initCustomCursor();
    initContactForm();
    initAboutImageTilt();
    initMagneticButtons();
  };

  /* Start on DOMContentLoaded (or immediately if already loaded) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ----------------------------------------------------------
     CLEANUP ON PAGE UNLOAD
  ---------------------------------------------------------- */
  window.addEventListener('beforeunload', () => {
    cleanups.forEach((fn) => {
      try { fn(); } catch (_) { /* swallow */ }
    });
  });
})();
