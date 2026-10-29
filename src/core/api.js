import { SITE } from "./config.js";
// Single API base so a host migration is one config value, not a repo-wide search.
const B = SITE.api || "./api";

export async function j(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

export const getHistory = (src, station, hours) =>
  j(`${B}/history?source=${src}&station=${encodeURIComponent(station)}&hours=${hours}`);
export const getOfficial = (state, town) => {
  const q = new URLSearchParams();
  if (state) q.set("state", state);
  if (town) q.set("town", town);
  return j(`${B}/official${q.size ? `?${q}` : ""}`);
};

export const getHaze = (town) => j(`${B}/haze${town ? `?town=${encodeURIComponent(town)}` : ""}`);

/** Current InfoBanjir river-level + heavy-rain alerts, narrowed to a state when given. */
export const getFlood = (state) => j(`${B}/flood${state ? `?state=${encodeURIComponent(state)}` : ""}`);
