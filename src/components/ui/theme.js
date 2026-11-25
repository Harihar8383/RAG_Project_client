// The colour theme lives on <html data-theme>, which index.css reads.
export const THEMES = ["teal", "sand", "mono"];
const KEY = "theme";

export function savedTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (THEMES.includes(saved)) return saved;
  } catch {
    // storage blocked (private mode): fall back to the system setting
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "sand" : "teal";
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // the theme still applies for this visit
  }
}
