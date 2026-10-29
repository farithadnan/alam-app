/**
 * Live smoke test for the on-device pipeline: runs a REAL sync against the public
 * sources (no server in the path), then serves the dashboard's summary bundle from
 * the on-device store. Works with `node scripts/verify-device.mjs` (Node fetch has
 * no CORS, so even the browser-blocked sources are exercised here).
 */
import { runSync } from "../src/device/sync.js";
import { deviceStore } from "../src/device/store.js";
import { serve } from "../src/device/server.js";

const start = Date.now();
console.log("[verify] syncing all adapters (this is the device doing the API's job)…");
const results = await runSync();
for (const r of results) {
  if (r.error) console.log(`  ${r.id}: ERROR ${r.error}`);
  else if (!r.stale) console.log(`  ${r.id}: fresh (skipped)`);
  else console.log(`  ${r.id}: ${r.rows} parsed, ${r.inserted} new`);
}
const snap = await deviceStore.snapshot();
console.log(`[verify] on-device rows: ${snap.rows}`);

const summary = await serve("./api/summary?state=Johor&town=johor-bahru");
console.log("[verify] /api/summary (from device store):", {
  states: summary.states.length,
  stations: summary.stations.length,
  weather: summary.weather.length,
  forecast: summary.forecast.length,
  hourly: summary.hourly.length,
  news: summary.news.length,
  quakes: summary.hazards.earthquakes.length,
  warnings: summary.hazards.warnings.length,
  climate: summary.hazards.climate?.meta?.phase ?? null,
});

const flood = await serve("./api/flood");
console.log("[verify] /api/flood:", { river: flood.river.length, rain: flood.rain.length });

const snapSources = (await deviceStore.snapshot()).sources;
console.log("[verify] stored per source:", snapSources.map((s) => `${s.source}:${s.rows}`).join(" · "));
console.log(`[verify] took ${Date.now() - start}ms`);
