/* ============================================================
   ArtPress – Portfolio local demo store
   ============================================================ */

(function () {
  const STORAGE_KEY = "artpress.portfolio.items.v1";
  const UPDATE_EVENT = "artpress:portfolio-updated";

  const INITIAL_ITEMS = [
    {
      id: 1,
      title: "Identidade Visual Restaurante",
      category: "Identidade Visual",
      description: "Design estratégico e impressos de cardápios",
      status: "publicado",
      imageUrl: "assets/optimized/portfolio-1.webp",
      date: "2026-04-18",
    },
    {
      id: 2,
      title: "Banner Clínica Médica",
      category: "Banner",
      description: "Impressão fotográfica grande formato exterior",
      status: "publicado",
      imageUrl: "assets/optimized/portfolio-2.webp",
      date: "2026-04-22",
    },
    {
      id: 3,
      title: "Embalagem Produto Orgânico",
      category: "Embalagem",
      description: "Sustentabilidade com rótulos premium",
      status: "publicado",
      imageUrl: "assets/optimized/portfolio-3.webp",
      date: "2026-04-26",
    },
    {
      id: 4,
      title: "Catálogo de Moda",
      category: "Catálogo",
      description: "Editorial completo em papel couchê",
      status: "revisao",
      imageUrl: "assets/optimized/portfolio-4.webp",
      date: "2026-05-02",
    },
    {
      id: 5,
      title: "Arte Gráfica Corporativa",
      category: "Arte Gráfica",
      description: "Design e diagramação de alta qualidade",
      status: "revisao",
      imageUrl: "assets/optimized/portfolio-5.webp",
      date: "2026-05-09",
    },
    {
      id: 6,
      title: "Papelaria Advocacia",
      category: "Papelaria",
      description: "Identidade completa para escritório de advocacia",
      status: "arquivado",
      imageUrl: "assets/optimized/portfolio-6.webp",
      date: "2026-03-30",
    },
  ];

  const VALID_STATUSES = new Set(["revisao", "publicado", "arquivado"]);
  const LEGACY_IMAGE_URLS = new Map([
    ["images/foto 1.png", "assets/optimized/portfolio-1.webp"],
    ["images/foto 2.png", "assets/optimized/portfolio-2.webp"],
    ["images/foto 3.png", "assets/optimized/portfolio-3.webp"],
    ["images/foto 4.png", "assets/optimized/portfolio-4.webp"],
    ["images/foto 5.png", "assets/optimized/portfolio-5.webp"],
    ["images/foto 6.png", "assets/optimized/portfolio-6.webp"],
  ]);
  let memoryItems = cloneItems(INITIAL_ITEMS);

  function cloneItems(items) {
    return items.map((item) => ({ ...item }));
  }

  function canUseLocalStorage() {
    try {
      const testKey = "__artpress_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeItem(item, index) {
    if (!item || typeof item !== "object") return null;

    const title = String(item.title || "").trim();
    const category = String(item.category || "").trim();
    const imageUrl = normalizeImageUrl(String(item.imageUrl || "").trim());

    if (!title || !category || !imageUrl) return null;

    return {
      id: Number(item.id) || Date.now() + index,
      title,
      category,
      description: String(item.description || "").trim(),
      status: VALID_STATUSES.has(item.status) ? item.status : "revisao",
      imageUrl,
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || ""))
        ? item.date
        : new Date().toISOString().slice(0, 10),
    };
  }

  function normalizeImageUrl(imageUrl) {
    return LEGACY_IMAGE_URLS.get(imageUrl) || imageUrl;
  }

  function normalizeItems(items) {
    if (!Array.isArray(items)) return null;

    const normalized = items
      .map((item, index) => normalizeItem(item, index))
      .filter(Boolean);

    return normalized.length || items.length === 0 ? normalized : null;
  }

  function readStorage() {
    if (!canUseLocalStorage()) return cloneItems(memoryItems);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneItems(INITIAL_ITEMS);

      const parsed = JSON.parse(raw);
      return normalizeItems(parsed) || cloneItems(INITIAL_ITEMS);
    } catch (error) {
      return cloneItems(INITIAL_ITEMS);
    }
  }

  function notify(items) {
    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, {
        detail: { items: cloneItems(items) },
      }),
    );
  }

  function getItems() {
    return cloneItems(readStorage());
  }

  function saveItems(items) {
    const normalized = normalizeItems(items) || cloneItems(INITIAL_ITEMS);
    memoryItems = cloneItems(normalized);

    if (canUseLocalStorage()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch (error) {
        memoryItems = cloneItems(normalized);
      }
    }

    notify(normalized);
    return cloneItems(normalized);
  }

  function resetItems() {
    return saveItems(INITIAL_ITEMS);
  }

  window.ArtPressPortfolioStore = {
    STORAGE_KEY,
    UPDATE_EVENT,
    INITIAL_ITEMS: cloneItems(INITIAL_ITEMS),
    getItems,
    saveItems,
    resetItems,
  };
})();
