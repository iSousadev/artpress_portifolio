/* ============================================================
   ArtPress seasonal theme local demo store
   ============================================================ */

(function () {
  const STORAGE_KEY = "artpress.site.theme.v1";
  const UPDATE_EVENT = "artpress:site-theme-updated";

  const THEMES = [
    {
      key: "default",
      label: "Tema Padrão",
      description: "Tema padrão da ArtPress.",
    },
    {
      key: "christmas",
      label: "Natal ArtPress",
      description: "Feliz Natal com um tema festivo inspirado na ArtPress!",
    },
  ];

  const VALID_THEME_KEYS = new Set(THEMES.map((theme) => theme.key));
  let memoryTheme = "default";

  function canUseLocalStorage() {
    try {
      const testKey = "__artpress_theme_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeTheme(themeKey) {
    const key = String(themeKey || "").trim();
    return VALID_THEME_KEYS.has(key) ? key : "default";
  }

  function readStorage() {
    if (!canUseLocalStorage()) return memoryTheme;

    try {
      return normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return "default";
    }
  }

  function notify(themeKey) {
    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, {
        detail: { theme: themeKey },
      }),
    );
  }

  function getTheme() {
    return readStorage();
  }

  function saveTheme(themeKey) {
    const normalized = normalizeTheme(themeKey);
    memoryTheme = normalized;

    if (canUseLocalStorage()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } catch (error) {
        memoryTheme = normalized;
      }
    }

    notify(normalized);
    return normalized;
  }

  function resetTheme() {
    return saveTheme("default");
  }

  window.ArtPressThemeStore = {
    STORAGE_KEY,
    UPDATE_EVENT,
    THEMES: THEMES.map((theme) => ({ ...theme })),
    getTheme,
    saveTheme,
    resetTheme,
  };
})();
