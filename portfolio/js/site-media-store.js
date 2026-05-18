/* ============================================================
   ArtPress – Landing media local demo store
   ============================================================ */

(function () {
  const STORAGE_KEY = "artpress.site.media.v1";
  const UPDATE_EVENT = "artpress:site-media-updated";

  const INITIAL_MEDIA = [
    {
      slot: "hero.main",
      label: "Imagem principal do Hero",
      section: "Hero",
      imageUrl: "assets/optimized/hero-main.webp",
      alt: "Impressão Premium",
    },
    {
      slot: "services.digital",
      label: "Serviço: Impressão Digital",
      section: "Serviços",
      imageUrl: "assets/optimized/service-digital.webp",
      alt: "Impressão Digital",
    },
    {
      slot: "services.banners",
      label: "Serviço: Banners e Faixas",
      section: "Serviços",
      imageUrl: "assets/optimized/service-banners.webp",
      alt: "Banners e Faixas",
    },
    {
      slot: "services.cards",
      label: "Serviço: Cartões de Visita",
      section: "Serviços",
      imageUrl: "assets/optimized/service-cards.webp",
      alt: "Cartões de Visita",
    },
    {
      slot: "services.packaging",
      label: "Serviço: Embalagens Personalizadas",
      section: "Serviços",
      imageUrl: "assets/optimized/service-packaging.webp",
      alt: "Embalagens Personalizadas",
    },
    {
      slot: "services.facades",
      label: "Serviço: Fachadas & C. Visual",
      section: "Serviços",
      imageUrl: "assets/optimized/service-facades.webp",
      alt: "Fachadas & C. Visual",
    },
    {
      slot: "about.main",
      label: "Imagem da seção Sobre",
      section: "Sobre",
      imageUrl: "assets/optimized/about-main.webp",
      alt: "Tecnologia e Criatividade",
    },
  ];

  const INITIAL_BY_SLOT = new Map(
    INITIAL_MEDIA.map((item) => [item.slot, { ...item }]),
  );
  const LEGACY_IMAGE_URLS = new Map([
    ["images/foto 7.png", "assets/optimized/hero-main.webp"],
    ["img/Impressão Digital.png", "assets/optimized/service-digital.webp"],
    ["img/Banners e Faixas.png", "assets/optimized/service-banners.webp"],
    ["img/Cartões de Visita.png", "assets/optimized/service-cards.webp"],
    ["img/Embalagens Personalizadas.png", "assets/optimized/service-packaging.webp"],
    ["img/Fachadas & C. Visual.png", "assets/optimized/service-facades.webp"],
    ["images/foto 5.png", "assets/optimized/about-main.webp"],
  ]);
  let memoryMedia = cloneMedia(INITIAL_MEDIA);

  function cloneMedia(media) {
    return media.map((item) => ({ ...item }));
  }

  function canUseLocalStorage() {
    try {
      const testKey = "__artpress_media_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeItem(item) {
    if (!item || typeof item !== "object") return null;

    const slot = String(item.slot || "").trim();
    const base = INITIAL_BY_SLOT.get(slot);
    if (!base) return null;

    const imageUrl = normalizeImageUrl(String(item.imageUrl || "").trim());
    if (!imageUrl) return null;

    return {
      ...base,
      imageUrl,
      alt: String(item.alt || base.alt).trim() || base.alt,
    };
  }

  function normalizeImageUrl(imageUrl) {
    return LEGACY_IMAGE_URLS.get(imageUrl) || imageUrl;
  }

  function normalizeMedia(media) {
    if (!Array.isArray(media)) return null;

    const incomingBySlot = new Map();
    media.forEach((item) => {
      const normalized = normalizeItem(item);
      if (normalized) {
        incomingBySlot.set(normalized.slot, normalized);
      }
    });

    return INITIAL_MEDIA.map((base) => incomingBySlot.get(base.slot) || { ...base });
  }

  function readStorage() {
    if (!canUseLocalStorage()) return cloneMedia(memoryMedia);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneMedia(INITIAL_MEDIA);

      const parsed = JSON.parse(raw);
      return normalizeMedia(parsed) || cloneMedia(INITIAL_MEDIA);
    } catch (error) {
      return cloneMedia(INITIAL_MEDIA);
    }
  }

  function notify(media) {
    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, {
        detail: { media: cloneMedia(media) },
      }),
    );
  }

  function getMedia() {
    return cloneMedia(readStorage());
  }

  function saveMedia(media) {
    const normalized = normalizeMedia(media) || cloneMedia(INITIAL_MEDIA);
    memoryMedia = cloneMedia(normalized);

    if (canUseLocalStorage()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch (error) {
        memoryMedia = cloneMedia(normalized);
      }
    }

    notify(normalized);
    return cloneMedia(normalized);
  }

  function resetMedia() {
    return saveMedia(INITIAL_MEDIA);
  }

  window.ArtPressSiteMediaStore = {
    STORAGE_KEY,
    UPDATE_EVENT,
    INITIAL_MEDIA: cloneMedia(INITIAL_MEDIA),
    getMedia,
    saveMedia,
    resetMedia,
  };
})();
