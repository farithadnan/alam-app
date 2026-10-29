// Tiny theme store (light/dark) persisted to localStorage, applied via [data-theme] on <html>.
function initDark() {
  try { return localStorage.getItem("alam-theme") === "dark"; } catch { return false; }
}
export const theme = $state({ dark: initDark() });

export function applyTheme() {
  const el = document.documentElement;
  if (el) el.dataset.theme = theme.dark ? "dark" : "light";
}
export function toggleTheme() {
  theme.dark = !theme.dark;
  try { localStorage.setItem("alam-theme", theme.dark ? "dark" : "light"); } catch {}
  applyTheme();
}
