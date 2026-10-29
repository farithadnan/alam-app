import { serve } from "../device/server.js";
// The device IS the API: no server, no D1. `j(url)` keeps the exact URL contract the
// views and tests use, but resolves every request locally from the on-device store.
// (The store is populated by src/device/sync.js on app open and periodically.)

export async function j(url) {
  return serve(url);
}

export const getHistory = (src, station, hours) =>
  j(`./api/history?source=${src}&station=${encodeURIComponent(station)}&hours=${hours}`);
export const getOfficial = (state, town) => {
  const q = new URLSearchParams();
  if (state) q.set("state", state);
  if (town) q.set("town", town);
  return j(`./api/official${q.size ? `?${q}` : ""}`);
};

export const getHaze = (town) => j(`./api/haze${town ? `?town=${encodeURIComponent(town)}` : ""}`);

/** Current InfoBanjir river-level + heavy-rain alerts, narrowed to a state when given. */
export const getFlood = (state) => j(`./api/flood${state ? `?state=${encodeURIComponent(state)}` : ""}`);
