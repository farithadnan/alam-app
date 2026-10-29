<script>
  import { SITE } from "../core/config.js";
import { onMount, onDestroy } from "svelte";
import L from "leaflet";

let { pts = [], fit = true, fitMax = 10, focus = null, onPick = null, class: cls = "h-64 w-full rounded-xl", lazy = false } = $props();
let el;
let map;
let icons = [];
let tiles;

/** CARTO basemap, light or dark to match the active theme. */
function tileUrl() {
  const key = SITE.cartoKey;
  const style = (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark") ? "dark_all" : "light_all";
  return `https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png${key ? `?key=${key}` : ""}`;
}

/** Bigger icons when zoomed out, smaller when zoomed in — capped so they don't overlap. */
function zoomFactor(z) {
  return Math.max(0.8, Math.min(1.6, 1 + (8 - z) * 0.12));
}

function initMap() {
  if (!el || map) return;
  map = L.map(el, { zoomControl: true, attributionControl: true }).setView([4.1, 109.2], 5);
  tiles = L.tileLayer(tileUrl(), {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(map);
  map.on("zoomend", drawIcons);
  drawIcons();
  fitView();
}

// Swap the basemap in place when the user flips light/dark.
function watchTheme() {
  if (typeof MutationObserver === "undefined") return () => {};
  const mo = new MutationObserver(() => { if (map && tiles) tiles.setUrl(tileUrl()); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

onMount(() => {
  if (!el) return;
  const stopTheme = watchTheme();
  if (!lazy) { initMap(); return () => { stopTheme(); if (map) { map.remove(); map = null; } }; }
  // Lazy: only boot Leaflet (and its tiles) when this scrolls near the viewport —
  // spares CPU/data on weak 4G/3G when the map is below the fold.
  const io = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !map) { initMap(); io.disconnect(); }
  }, { rootMargin: "300px" });
  io.observe(el);
  return () => { stopTheme(); io.disconnect(); if (map) { map.remove(); map = null; } };
});
onDestroy(() => { if (map) { map.remove(); map = null; } });

function drawIcons() {
  if (!map) return;
  for (const i of icons) map.removeLayer(i);
  icons = [];
  const zf = zoomFactor(map.getZoom());
  for (const p of pts) {
    const d = Math.round((p.size || 12) * zf);
    const col = p.color || "#c14a1f";
    const label = p.emoji
      ? `<span style="font-size:${Math.max(12, d * 0.85)}px;line-height:1">${p.emoji}</span>`
      : `<span style="font-size:${Math.max(9, d * 0.5)}px;font-weight:700;color:#fff">${p.num ?? ""}</span>`;
    const icon = L.divIcon({
      className: "alam-pin",
      html: `<div style="position:relative;width:${d}px;height:${d}px;border-radius:50%;background:${col};border:2px solid #fff;box-shadow:0 0 0 ${Math.round(d * 0.18)}px ${col}33, 0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center">${label}</div>`,
      iconSize: [d, d],
      iconAnchor: [d / 2, d / 2],
    });
    const m = L.marker([p.lat, p.lon], { icon }).addTo(map);
    if (p.html || p.title) m.bindPopup(p.html || p.title, { maxWidth: 260 });
    if (onPick && p.id) m.on("click", () => onPick(p.id));
    icons.push(m);
  }
}

function fitView() {
  if (!map) return;
  if (focus) { map.setView([focus.lat, focus.lon], focus.zoom ?? 11); return; }
  if (fit && pts.length) map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon])).pad(0.25), { maxZoom: fitMax });
}

$effect(() => {
  if (!map) return;
  void pts;
  drawIcons();
  fitView();
});
</script>

<div class="relative">
  <div bind:this={el} class={cls} style="z-index:0" aria-label="Map"></div>
  {#if !pts.length}
    <div class="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 rounded-2xl" style="background:var(--color-panel-2)">
      <span class="text-[26px] opacity-50">🗺️</span>
      <span class="text-[12.5px] text-faint">No map points</span>
    </div>
  {/if}
  <button
    class="absolute right-2.5 top-2.5 z-[400] grid size-9 place-items-center rounded-xl border border-line bg-panel/95 text-fg shadow-md backdrop-blur"
    onclick={() => { if (map && pts.length) map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon])).pad(0.25), { maxZoom: fitMax }); }}
    aria-label="Reset view"
    title="Reset view"
  >⤢</button>
</div>
