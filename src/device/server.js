/**
 * server.js — the device-local API. `serve()` takes exactly the URL-shaped strings
 * the dashboard builds (`./api/summary?state=...&town=...`) and resolves them from
 * the on-device store via the bundle builders. It replaces the network fetch layer:
 * no server, no D1, no requests — the phone IS the API.
 */
import * as B from "./bundle.js";

export const API_INDEX = {
  name: "Alam device API",
  version: "v1",
  note: "Served from this device's own store. Data refreshes on open and in the background.",
  endpoints: ["summary", "current", "history", "forecast", "stations", "hazards", "news", "official", "haze", "flood"],
};

function NotFound() {
  return { error: "not_found" };
}

/** Parse `./api/summary?state=..&town=..` (or `/v1/...`) into { path, params }. */
export function parseUrl(url) {
  const u = new URL(url, "https://device.local");
  let api = u.pathname.replace(/^\/v1/, "/api").replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const params = Object.fromEntries(u.searchParams.entries());
  return { api: api || "index", params };
}

/** Resolve a URL string to the data the matching server endpoint would return. */
export async function serve(url) {
  const { api, params } = parseUrl(url);
  const q = (k) => params[k] ?? "";
  switch (api) {
    case "summary":
      return B.summaryBundle({ state: q("state"), town: q("town"), towns: q("towns") });
    case "current":
      return B.currentBundle(q("source"));
    case "history":
      if (!q("station")) return { error: "missing `station`" };
      return B.historyBundle(q("source") || "doe-eqms", q("station"), q("hours") || 24);
    case "forecast":
      return B.forecastBundle(q("source"));
    case "stations":
      return B.stationsBundle();
    case "hazards":
      return B.hazardsBundle();
    case "news":
      return B.newsBundle();
    case "official":
      return B.officialBundle({ state: q("state"), town: q("town"), district: q("district") });
    case "haze":
      return B.hazeBundle({ town: q("town"), state: q("state") });
    case "flood":
      return B.floodBundle({ state: q("state") });
    case "":
    case "index":
      return API_INDEX;
    default:
      return NotFound();
  }
}
