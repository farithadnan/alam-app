/**
 * HTTP helpers — direct port of alam-api/src/util/http.ts.
 *
 * In the Capacitor APK, `fetch` inside the WebView is automatically routed through
 * the native HTTP client (plugins.CapacitorHttp.enabled in capacitor.config.ts), so
 * the CORS-blocked sources (DOE eqms, InfoBanjir, NOAA, RSS) become reachable with
 * no transport changes here. In a plain browser (npm run dev) the usual CORS rules
 * apply and only the permissive sources populate.
 */

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 30_000;
/** Minimum gap between requests to the same host, so adapters cannot burst at it. */
const HOST_GAP_MS = 150;
const USER_AGENT = "alam-app/0.2 (+https://github.com/farithadnan/alam-app)";

function backoffMs(attempt) {
  const exp = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  return Math.round(exp * (0.5 + Math.random() * 0.5));
}

function retryAfterMs(res) {
  const header = res.headers?.get?.("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, Math.min(seconds * 1000, MAX_DELAY_MS));
  const at = Date.parse(header);
  return Number.isFinite(at) ? Math.max(0, Math.min(at - Date.now(), MAX_DELAY_MS)) : null;
}

/** Per-host queue: serialises calls and enforces a minimum gap between them. */
const hostQueue = new Map();

function throughHostQueue(url, fn) {
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep the raw string as the key */
  }
  const prev = hostQueue.get(host) ?? Promise.resolve();
  const run = prev.catch(() => {}).then(async () => {
    if (HOST_GAP_MS) await sleep(HOST_GAP_MS);
    return fn();
  });
  hostQueue.set(host, run.catch(() => {}));
  return run;
}

function statusOf(err) {
  return err?.status;
}

/** GET with timeout, per-host politeness, and retries that respect 429/Retry-After. */
async function httpGet(url, opts = {}) {
  const { timeoutMs = 15_000, retries = 3, headers } = opts;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await throughHostQueue(url, async () => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeoutMs);
        try {
          const res = await fetch(url, {
            headers: { accept: headers?.accept ?? "application/json", "user-agent": USER_AGENT, ...headers },
            signal: ac.signal,
          });
          if (res.ok) return res;
          const err = Object.assign(new Error(`HTTP ${res.status} ${res.statusText} for ${url}`), {
            status: res.status,
            retryAfterMs: retryAfterMs(res),
          });
          throw err;
        } finally {
          clearTimeout(timer);
        }
      });
    } catch (err) {
      lastErr = err;
      const status = statusOf(err);
      // Network/timeout errors have no status: retry those. Other 4xx: fail fast.
      const retryable = status === undefined || RETRYABLE.has(status);
      if (!retryable || attempt >= retries) break;
      const hinted = err?.retryAfterMs;
      await sleep(hinted ?? backoffMs(attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchJson(url, opts = {}) {
  const res = await httpGet(url, opts);
  return res.json();
}

export async function fetchText(url, opts = {}) {
  const res = await httpGet(url, opts);
  return res.text();
}
