import { j } from "./api.js";

/** Shared reactive app state (Svelte 5 runes module store). One `/api/summary` fetch serves all views. */
export const app = $state({ data: null, state: null, town: null, scope: "near", picked: null, loading: false, updated: "", error: "", hazard: "flood" });

const CACHE_KEY = "alam-cache";
const LOC_KEY = "alam-loc";

/** Remember the chosen state/town/scope so the user never re-picks on return. */
function persistLoc() {
  try { localStorage.setItem(LOC_KEY, JSON.stringify({ state: app.state, town: app.town, scope: app.scope })); } catch {}
}
export function initLoc() {
  try {
    const l = JSON.parse(localStorage.getItem(LOC_KEY) || "null");
    if (!l) return;
    if (l.state) app.state = l.state;
    if (l.town) app.town = l.town;
    if (l.scope) app.scope = l.scope;
  } catch {}
}

let seq = 0; // ignores out-of-order responses when the user switches quickly

export async function load() {
  const id = ++seq;
  // Only flash the loading bar on the genuinely-first load (nothing on screen yet).
  // Startup converges in up to 3 sequential fetches (state adoption + town
  // correction); without this those would each show/hide the bar → it blinks.
  if (!app.data) app.loading = true;
  try {
    // State narrows stations/weather; town narrows the heavier hourly + forecast
    // series to the one place the UI is actually showing.
    const params = new URLSearchParams();
    if (app.state && app.scope !== "malaysia") params.set("state", app.state);
    if (app.town) params.set("town", app.town);
    // A drilled-in place needs its own hourly + forecast too.
    if (app.picked && app.picked !== app.town) params.set("towns", app.picked);
    const qs = params.toString();
    const bundle = await j(`./api/summary${qs ? `?${qs}` : ""}`);
    if (id !== seq) return; // a newer request superseded this one
    if (!app.state && bundle.states?.length) app.state = bundle.states[0];
    // The town has to belong to the state we are showing. Otherwise the state-scoped
    // payload has no row for it and the detail renders "no data" — which is what a
    // first load did, because it adopted the alphabetically-first town of ALL towns
    // (Alor Gajah, Melaka) while adopting the first state (Perlis).
    const rows = (bundle.weather || []).filter((r) => r.kind === "weather");
    const inState = app.state ? rows.filter((r) => r.meta?.state === app.state) : rows;
    const towns = [...new Set((inState.length ? inState : rows).map((r) => r.station))];
    const before = app.town;
    if (!app.town || !towns.includes(app.town)) app.town = towns[0] ?? app.town;
    app.data = bundle;
    app.updated = bundle.ts ? new Date(bundle.ts).toLocaleTimeString() : new Date().toLocaleTimeString();
    app.error = "";
    persistLoc();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: bundle, state: app.state, town: app.town })); } catch {}
    // The bundle we just stored was requested for the old town; fetch again so the
    // hourly and forecast series match the town we corrected to. Converges: the next
    // pass finds the town valid and stops.
    if (before !== app.town) void load();
  } catch (e) {
    if (id !== seq) return;
    app.error = e?.message || "unavailable";
    if (!app.data) {
      try {
        const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (c?.data) { app.data = c.data; app.state = app.state || c.state; app.town = app.town || c.town; }
      } catch {}
    }
  } finally {
    if (id === seq) app.loading = false;
  }
}
