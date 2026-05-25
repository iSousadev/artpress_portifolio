/* ============================================================
   ArtPress – Interactions Script
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Preloader: visual only, never a hard dependency for page access.
  const preloader = document.getElementById("preloader");
  let preloaderClosed = false;
  let preloaderSafetyTimer = null;

  function unlockPage() {
    document.body.style.overflow = "";
    document.body.classList.remove("overflow-hidden");
  }

  function hidePreloader(delay = 0) {
    if (!preloader || preloaderClosed) return;

    window.setTimeout(() => {
      if (preloaderClosed) return;
      preloaderClosed = true;
      if (preloaderSafetyTimer) {
        window.clearTimeout(preloaderSafetyTimer);
      }
      preloader.style.opacity = "0";
      preloader.setAttribute("aria-hidden", "true");

      window.setTimeout(() => {
        preloader.remove();
        unlockPage();
      }, 650);
    }, delay);
  }

  function waitForPreloaderLibraries(timeout = 1100) {
    const startedAt = window.performance?.now?.() || Date.now();

    return new Promise((resolve) => {
      function check() {
        if (
          typeof gsap !== "undefined" &&
          typeof MorphSVGPlugin !== "undefined"
        ) {
          resolve(true);
          return;
        }

        const now = window.performance?.now?.() || Date.now();
        if (now - startedAt >= timeout) {
          resolve(false);
          return;
        }

        window.setTimeout(check, 50);
      }

      check();
    });
  }

  function startFallbackPreloader() {
    if (!preloader || preloaderClosed) return;

    preloader.classList.add("is-fallback");
    window.setTimeout(() => hidePreloader(), 3700);
  }

  function startMorphPreloader() {
    if (!preloader || preloaderClosed) return false;

    if (typeof gsap === "undefined" || typeof MorphSVGPlugin === "undefined") {
      return false;
    }

    try {
      gsap.registerPlugin(MorphSVGPlugin);

      const morphTargets = [
        "speech",
        "rocket",
        "lightning",
        "thumb",
        "square",
        "grid",
        "bulb",
      ]
        .map((id) => document.getElementById(id)?.getAttribute("d"))
        .filter(Boolean);

      if (morphTargets.length === 0) {
        return false;
      }

      gsap.set("#svg-stage", {
        scale: 0.88,
        rotation: -5,
        transformOrigin: "50% 50%",
      });
      gsap.set("#preloader-text", { opacity: 0, y: 18 });

      const timeline = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onComplete: () => hidePreloader(120),
      });

      timeline
        .to(
          "#svg-stage",
          {
          duration: 0.68,
            scale: 1,
            rotation: 0,
            ease: "back.out(1.8)",
            transformOrigin: "50% 50%",
          },
          0,
        )
        .to(
          "#preloader-text",
          {
          duration: 1.05,
            opacity: 1,
            y: 0,
            ease: "power3.out",
          },
          0.15,
        );

      morphTargets.forEach((target, index) => {
        timeline.to(
          "#morph",
          {
          duration: 0.58,
            morphSVG: { shape: target, shapeIndex: "auto" },
            ease: "power2.inOut",
          },
          index === 0 ? 0.28 : ">-0.04",
        );
      });

      timeline
        .to(
          "#svg-stage",
          {
          duration: 0.48,
            scale: 1.08,
            rotation: 2,
            ease: "power2.out",
            transformOrigin: "50% 50%",
          },
          ">-0.02",
        )
        .to(
          "#preloader-text",
          {
          duration: 0.44,
            letterSpacing: "0.5em",
            ease: "power2.out",
          },
          "<",
        )
        .to(
          "#svg-stage",
          {
          duration: 0.54,
            scale: 0.98,
            opacity: 0.8,
            ease: "power2.inOut",
            transformOrigin: "50% 50%",
          },
          ">",
        )
        .to(
          "#preloader-text",
          {
          duration: 0.5,
            opacity: 0,
            y: -8,
            ease: "power2.inOut",
          },
          "<",
        );

      return true;
    } catch (error) {
      return false;
    }
  }

  if (preloader) {
    document.body.style.overflow = "hidden";
    document.body.classList.add("overflow-hidden");
    preloaderSafetyTimer = window.setTimeout(() => hidePreloader(), 7200);

    waitForPreloaderLibraries().then((hasMorph) => {
      if (preloaderClosed) return;

      if (!hasMorph || !startMorphPreloader()) {
        startFallbackPreloader();
      }
    });
  } else {
    unlockPage();
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Close mobile menu when a link is clicked
  const mobileLinks = mobileMenu?.querySelectorAll("a");
  mobileLinks?.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });

  // Public Portfolio Sync (Admin BETA demo)
  const portfolioGrid = document.getElementById("portfolio-grid");
  const portfolioStore = window.ArtPressPortfolioStore;
  const siteMediaStore = window.ArtPressSiteMediaStore;
  const themeStore = window.ArtPressThemeStore;
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let christmasCanvas = null;
  let christmasContext = null;
  let christmasParticles = [];
  let christmasAnimationId = null;
  let christmasLastTime = 0;

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applySiteMedia() {
    if (!siteMediaStore) return;

    const mediaBySlot = new Map(
      siteMediaStore.getMedia().map((item) => [item.slot, item]),
    );

    document.querySelectorAll("[data-media-slot]").forEach((image) => {
      const media = mediaBySlot.get(image.dataset.mediaSlot);
      if (!media) return;

      image.src = media.imageUrl;
      image.alt = media.alt;
    });

    refreshScrollTriggers();
  }

  function applySiteTheme() {
    const theme = themeStore ? themeStore.getTheme() : "default";

    if (theme === "christmas") {
      document.documentElement.dataset.siteTheme = "christmas";
      startChristmasParticles();
      return;
    }

    document.documentElement.dataset.siteTheme = "default";
    stopChristmasParticles();
  }

  function createChristmasParticle(
    width,
    height,
    startAbove = false,
    layer = "background",
  ) {
    const depth = Math.random();
    const isForeground = layer === "foreground";
    const isGolden = isForeground || Math.random() > 0.94;

    return {
      layer,
      x: Math.random() * width,
      y: startAbove ? Math.random() * -height : Math.random() * height,
      radius: isForeground ? 1.15 + depth * 2.8 : 0.65 + depth * 1.65,
      speed: isForeground ? 18 + depth * 36 : 7 + depth * 22,
      drift: (Math.random() - 0.5) * (isForeground ? 26 : 14),
      wave: Math.random() * Math.PI * 2,
      waveSpeed: isForeground ? 0.55 + Math.random() * 0.95 : 0.26 + Math.random() * 0.58,
      opacity: isForeground ? 0.18 + depth * 0.28 : 0.09 + depth * 0.24,
      color: isGolden ? "242, 196, 109" : "255, 255, 255",
      glow: isForeground ? 9 : 4.8,
      trail: isForeground ? 8 + depth * 16 : 0,
    };
  }

  function resizeChristmasParticles() {
    if (!christmasCanvas || !christmasContext) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const particleTargets =
      width < 768
        ? { background: 30, foreground: 6 }
        : { background: 58, foreground: 14 };

    christmasCanvas.width = Math.floor(width * ratio);
    christmasCanvas.height = Math.floor(height * ratio);
    christmasCanvas.style.width = width + "px";
    christmasCanvas.style.height = height + "px";
    christmasContext.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (reducedMotionQuery.matches) {
      christmasParticles = [];
      return;
    }

    christmasParticles = Object.entries(particleTargets).flatMap(
      ([layer, targetCount]) => {
        const particles = christmasParticles
          .filter((particle) => particle.layer === layer)
          .slice(0, targetCount);

        while (particles.length < targetCount) {
          particles.push(createChristmasParticle(width, height, false, layer));
        }

        return particles.map((particle) => ({
          ...particle,
          x: Math.min(particle.x, width),
          y: Math.min(particle.y, height),
        }));
      },
    );
  }

  function animateChristmasParticles(timestamp = 0) {
    if (!christmasCanvas || !christmasContext) return;

    if (reducedMotionQuery.matches) {
      christmasContext.clearRect(
        0,
        0,
        christmasCanvas.width,
        christmasCanvas.height,
      );
      christmasAnimationId = null;
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const delta = Math.min((timestamp - christmasLastTime) / 1000 || 0.016, 0.04);
    christmasLastTime = timestamp;

    christmasContext.clearRect(0, 0, width, height);

    christmasParticles.forEach((particle, index) => {
      particle.wave += particle.waveSpeed * delta;
      particle.y += particle.speed * delta;
      particle.x += (particle.drift + Math.sin(particle.wave) * 9) * delta;

      if (
        particle.y > height + 18 ||
        particle.x < -28 ||
        particle.x > width + 28
      ) {
        christmasParticles[index] = createChristmasParticle(
          width,
          height,
          true,
          particle.layer,
        );
        christmasParticles[index].y = -christmasParticles[index].radius * 8;
        return;
      }

      const alpha = particle.opacity * (0.72 + Math.sin(particle.wave) * 0.18);

      if (particle.trail) {
        christmasContext.strokeStyle =
          "rgba(" + particle.color + ", " + alpha * 0.35 + ")";
        christmasContext.lineWidth = Math.max(0.35, particle.radius * 0.34);
        christmasContext.beginPath();
        christmasContext.moveTo(particle.x, particle.y - particle.trail);
        christmasContext.lineTo(particle.x - particle.drift * 0.08, particle.y);
        christmasContext.stroke();
      }

      const gradient = christmasContext.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * particle.glow,
      );

      gradient.addColorStop(0, "rgba(" + particle.color + ", " + alpha + ")");
      gradient.addColorStop(
        0.38,
        "rgba(" + particle.color + ", " + alpha * 0.45 + ")",
      );
      gradient.addColorStop(1, "rgba(" + particle.color + ", 0)");

      christmasContext.fillStyle = gradient;
      christmasContext.beginPath();
      christmasContext.arc(
        particle.x,
        particle.y,
        particle.radius * particle.glow,
        0,
        Math.PI * 2,
      );
      christmasContext.fill();

      christmasContext.fillStyle = "rgba(" + particle.color + ", " + alpha + ")";
      christmasContext.beginPath();
      christmasContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      christmasContext.fill();
    });

    christmasAnimationId = window.requestAnimationFrame(animateChristmasParticles);
  }

  function startChristmasParticles() {
    if (reducedMotionQuery.matches) {
      stopChristmasParticles();
      return;
    }

    if (!christmasCanvas) {
      christmasCanvas = document.createElement("canvas");
      christmasCanvas.id = "christmas-particles";
      christmasCanvas.setAttribute("aria-hidden", "true");
      christmasContext = christmasCanvas.getContext("2d");

      if (!christmasContext) {
        christmasCanvas = null;
        return;
      }

      document.body.appendChild(christmasCanvas);
      resizeChristmasParticles();
      window.addEventListener("resize", resizeChristmasParticles);
    }

    if (!christmasAnimationId) {
      christmasLastTime = performance.now();
      christmasAnimationId = window.requestAnimationFrame(
        animateChristmasParticles,
      );
    }
  }

  function stopChristmasParticles() {
    if (christmasAnimationId) {
      window.cancelAnimationFrame(christmasAnimationId);
      christmasAnimationId = null;
    }

    window.removeEventListener("resize", resizeChristmasParticles);
    christmasParticles = [];
    christmasLastTime = 0;

    if (christmasCanvas) {
      christmasCanvas.remove();
      christmasCanvas = null;
      christmasContext = null;
    }
  }

  function refreshScrollTriggers() {
    if (
      typeof ScrollTrigger !== "undefined" &&
      typeof ScrollTrigger.refresh === "function"
    ) {
      ScrollTrigger.refresh(true);
    }
  }

  function renderPublicPortfolio() {
    if (!portfolioGrid || !portfolioStore) return;

    const publishedItems = portfolioStore
      .getItems()
      .filter((item) => item.status === "publicado");

    if (publishedItems.length === 0) {
      portfolioGrid.innerHTML = `
                <div class="lg:col-span-3 bg-surface-container border border-outline-variant/10 rounded-xl p-10 text-center">
                    <span class="material-symbols-outlined text-primary-container text-5xl mb-4">inventory_2</span>
                    <h4 class="font-headline text-2xl font-bold text-on-surface mb-2">Nenhum trabalho publicado</h4>
                    <p class="text-on-surface-variant max-w-xl mx-auto">Os itens em revisão ou arquivados ficam ocultos do site público até serem publicados no painel administrativo.</p>
                </div>
            `;
      return;
    }

    portfolioGrid.innerHTML = publishedItems
      .map(
        (item) => `
                <div class="group cursor-pointer">
                    <div class="aspect-[4/3] bg-surface-container rounded-xl overflow-hidden mb-5 border border-outline-variant/10 relative shadow-lg">
                        <img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span class="text-primary-container font-headline text-xs font-bold tracking-widest uppercase">${escapeHTML(item.category)}</span>
                    <h4 class="font-headline font-bold text-xl mb-1 text-on-surface group-hover:text-primary-container transition-colors">${escapeHTML(item.title)}</h4>
                    <p class="text-on-surface-variant text-sm">${escapeHTML(item.description || "Trabalho publicado pela equipe ArtPress")}</p>
                </div>
            `,
      )
      .join("");

    refreshScrollTriggers();
  }

  applySiteTheme();
  applySiteMedia();
  renderPublicPortfolio();

  if (portfolioStore) {
    window.addEventListener(portfolioStore.UPDATE_EVENT, renderPublicPortfolio);
    window.addEventListener("storage", (event) => {
      if (event.key === portfolioStore.STORAGE_KEY) {
        renderPublicPortfolio();
      }
    });
    window.addEventListener("focus", renderPublicPortfolio);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        renderPublicPortfolio();
      }
    });
  }

  if (siteMediaStore) {
    window.addEventListener(siteMediaStore.UPDATE_EVENT, applySiteMedia);
    window.addEventListener("storage", (event) => {
      if (event.key === siteMediaStore.STORAGE_KEY) {
        applySiteMedia();
      }
    });
    window.addEventListener("focus", applySiteMedia);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        applySiteMedia();
      }
    });
  }

  if (themeStore) {
    window.addEventListener(themeStore.UPDATE_EVENT, applySiteTheme);
    window.addEventListener("storage", (event) => {
      if (event.key === themeStore.STORAGE_KEY) {
        applySiteTheme();
      }
    });
    window.addEventListener("focus", applySiteTheme);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        applySiteTheme();
      }
    });
  }

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", applySiteTheme);
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(applySiteTheme);
  }

  // Contact Form Submission Mock
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = document.getElementById("submit-btn");
      const originalText = btn.innerHTML;

      btn.innerHTML =
        'Enviando... <span class="material-symbols-outlined">hourglass_empty</span>';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = "✓ Enviado";
        contactForm.reset();
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 3000);
      }, 1200);
    });
  }

  // Curved Marquee Interaction
  const marqueeSection = document.getElementById("curved-marquee");
  const textPath = document.getElementById("curve-text-path");
  if (marqueeSection && textPath) {
    const marqueeText =
      "ARTPRESS ✦ IMPRESSÃO PREMIUM ✦ DESIGN EXCLUSIVO ✦ COMUNICAÇÃO DE IMPACTO ✦ ";
    const svg = marqueeSection.querySelector("svg");

    const measureText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    measureText.textContent = marqueeText;
    measureText.style.visibility = "hidden";
    measureText.style.fontSize = "5rem";
    measureText.style.fontFamily = "'Space Grotesk', sans-serif";
    svg.appendChild(measureText);

    setTimeout(() => {
      let spacing = 1500;
      try {
        spacing = measureText.getComputedTextLength();
      } catch (e) {}

      const repeats = Math.ceil(2500 / spacing) + 2;
      textPath.textContent = Array(repeats).fill(marqueeText).join("");
      measureText.remove();

      let offset = -spacing;
      let speed = 1.5;
      let isDragging = false;
      let lastX = 0;
      let vel = 0;
      let dir = -1;

      function step() {
        if (!isDragging) {
          offset += speed * dir;
        } else {
          offset += vel;
        }

        if (offset <= -spacing) offset += spacing;
        if (offset > 0) offset -= spacing;

        textPath.setAttribute("startOffset", offset + "px");
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      marqueeSection.addEventListener("pointerdown", (e) => {
        isDragging = true;
        lastX = e.clientX;
        vel = 0;
        marqueeSection.setPointerCapture(e.pointerId);
        marqueeSection.classList.replace("cursor-grab", "cursor-grabbing");
      });

      marqueeSection.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        vel = dx;
      });

      const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        if (vel > 0) dir = 1;
        else if (vel < 0) dir = -1;
        marqueeSection.classList.replace("cursor-grabbing", "cursor-grab");
      };

      marqueeSection.addEventListener("pointerup", stopDrag);
      marqueeSection.addEventListener("pointercancel", stopDrag);
    }, 100); // give font slightly more time
  }

  // GSAP ScrollTrigger Animations
  let scrollAnimationsStarted = false;
  let optionalGsapLoading = false;

  function loadOptionalScript(src, isReady = () => false) {
    if (isReady()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        if (existingScript.dataset.loaded === "true" || isReady()) {
          resolve();
          return;
        }

        existingScript.addEventListener(
          "load",
          () => {
            existingScript.dataset.loaded = "true";
            resolve();
          },
          { once: true },
        );
        existingScript.addEventListener("error", reject, { once: true });
        window.setTimeout(() => {
          if (isReady()) {
            resolve();
          }
        }, 0);
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initScrollAnimations() {
    if (
      scrollAnimationsStarted ||
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined"
    ) {
      return;
    }

    scrollAnimationsStarted = true;

    try {
      gsap.registerPlugin(ScrollTrigger);

      // 1. Reveal Sections
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        const container = section.querySelector(".container");
        if (!container) return;

        gsap.from(container, {
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          y: 50,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
        });
      });

      // 2. Staggered Cards (Services & Portfolio)
      const gridContainers = document.querySelectorAll(
        "#services .grid, #portfolio-grid, #testimonials .grid",
      );
      gridContainers.forEach((grid) => {
        const cards = grid.querySelectorAll(".group");
        if (cards.length > 0) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: grid,
              start: "top 80%",
            },
            y: 60,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power2.out",
          });
        }
      });

      // 3. Watermark Parallax Effect
      const watermarks = document.querySelectorAll(
        ".absolute.inset-0.flex, .absolute.inset-x-0.bottom-0, .absolute.left-0.top-0",
      );
      watermarks.forEach((wm) => {
        if (!wm.parentElement) return;

        gsap.to(wm, {
          scrollTrigger: {
            trigger: wm.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
          y: -100,
          ease: "none",
        });
      });

      // 4. Hero Content Specific Reveal
      gsap.from("#hero h1, #hero p, #hero [data-hero-actions]", {
        duration: 1,
        y: 40,
        opacity: 0,
        stagger: 0.15,
        ease: "power4.out",
        delay: 0.35,
      });
    } catch (error) {
      refreshScrollTriggers();
    }
  }

  function loadOptionalGsap() {
    if (scrollAnimationsStarted) {
      return;
    }

    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      initScrollAnimations();
      return;
    }

    if (optionalGsapLoading) {
      return;
    }

    optionalGsapLoading = true;

    loadOptionalScript(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
      () => typeof gsap !== "undefined",
    )
      .then(() =>
        loadOptionalScript(
          "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js",
          () => typeof ScrollTrigger !== "undefined",
        ),
      )
      .then(initScrollAnimations)
      .catch(() => {
        optionalGsapLoading = false;
      });
  }

  if (document.readyState === "complete") {
    window.setTimeout(loadOptionalGsap, 1000);
  } else {
    window.addEventListener(
      "load",
      () => window.setTimeout(loadOptionalGsap, 1000),
      { once: true },
    );
  }
});
