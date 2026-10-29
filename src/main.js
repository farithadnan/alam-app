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

// PWA: register the service worker in production only (never during dev).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
