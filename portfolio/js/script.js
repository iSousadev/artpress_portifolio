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
