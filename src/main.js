import "./app.css";
import "leaflet/dist/leaflet.css";
import { mount } from "svelte";
import { applyTheme } from "./core/theme.svelte.js";
import { initLang } from "./core/i18n.svelte.js";
import App from "./App.svelte";

applyTheme();
initLang();

const target = document.getElementById("app");
if (target) mount(App, { target });

// PWA: register the service worker in production only (never during dev), and only
// when served over http(s) — the Capacitor APK serves from a native scheme where
// service workers do not exist and must never intercept the app's own assets.
if (
  import.meta.env.PROD &&
  "serviceWorker" in navigator &&
  !location.hostname.includes("localhost")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
