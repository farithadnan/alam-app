/**
 * One place for the app's identity and deployment settings.
 *
 * Before this, the share link derived its own origin, the contact address was written
 * twice in the About page, and the map read its env var directly. Anything that is
 * "the app" rather than "a view" belongs here, so there is one value to change.
 */

const rawUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  (typeof location !== "undefined" ? location.origin : "");

/** dev = ephemeral tunnel, prod = real domain. Override with VITE_ENV at build time. */
const ENV =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ENV) ||
  (String(rawUrl).includes("trycloudflare") ? "dev" : "prod");

export const SITE = {
  /** Shown in share titles and the document title. */
  name: "OhAlam",
  env: ENV,
  /**
   * Where a shared link points. Set VITE_SITE_URL at build time once the app has its
   * own domain; until then it falls back to wherever it is served, so a share always
   * resolves instead of pointing at a domain that does not exist yet.
   */
  url: String(rawUrl).replace(/\/+$/, ""),
  /**
   * API base. "" = the same origin that serves this dashboard (current dev setup, the
   * Fastify server hosts both). Point VITE_API_URL at a separate host later without
   * touching view code — this is the single value that changes on a host migration.
   */
  api: (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "",
  /** Contact address used by the About page. */
  email: "dev@farithadnan.net",
  /** Owner shown in the page footer. */
  author: "",
  /** CARTO basemap key (inlined at build time by Vite). */
  cartoKey: (typeof import.meta !== "undefined" && import.meta.env?.VITE_CARTO_KEY) || "",
};
