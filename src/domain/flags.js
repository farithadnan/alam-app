const STATES = [
  { id: 1, name: "Johor", lat: 1.55, lon: 103.7 },
  { id: 2, name: "Kedah", lat: 5.9, lon: 100.4 },
  { id: 3, name: "Kelantan", lat: 5.3, lon: 102.0 },
  { id: 4, name: "Melaka", lat: 2.3, lon: 102.2 },
  { id: 5, name: "Negeri Sembilan", lat: 2.7, lon: 102.2 },
  { id: 6, name: "Pahang", lat: 3.8, lon: 102.3 },
  { id: 7, name: "Pulau Pinang", lat: 5.4, lon: 100.3 },
  { id: 8, name: "Perak", lat: 4.6, lon: 101.0 },
  { id: 9, name: "Perlis", lat: 6.4, lon: 100.2 },
  { id: 10, name: "Selangor", lat: 3.1, lon: 101.5 },
  { id: 11, name: "Terengganu", lat: 4.8, lon: 103.0 },
  { id: 12, name: "Sabah", lat: 5.9, lon: 117.0 },
  { id: 13, name: "Sarawak", lat: 1.8, lon: 111.0 },
  { id: 14, name: "WP Kuala Lumpur", lat: 3.14, lon: 101.69 },
  { id: 15, name: "WP Labuan", lat: 5.3, lon: 115.2 },
  { id: 16, name: "WP Putrajaya", lat: 2.93, lon: 101.7 },
];

/** WCAG-compliant text colours (>=4.5 on cream); vivid band colours are for dots/borders. */
const NUM = { Good: "#2e7d32", Moderate: "#8f5c00", Unhealthy: "#b3491a", "Very Unhealthy": "#a51612", Hazardous: "#6a1b9a" };
export const numColor = (l) => NUM[l] || l;
/** UV category key (tr() it): 0-2 lo, 3-5 mod, 6-7 hi, 8-10 vhi, 11+ ext. */
export const uvWord = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (n <= 2) return "uv_lo";
  if (n <= 5) return "uv_mod";
  if (n <= 7) return "uv_hi";
  if (n <= 10) return "uv_vhi";
  return "uv_ext";
};

/** Malaysia APIMS band key for a DOE AQI value (word via bandLabel). */
export const apiBandOf = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n <= 50) return "Good";
  if (n <= 100) return "Moderate";
  if (n <= 200) return "Unhealthy";
  if (n <= 300) return "Very Unhealthy";
  return "Hazardous";
};
const MAG_TEXT = { Light: "#6b6258", Moderate: "#b3491a", Strong: "#a51612" };
export const magWord = (m) => (m >= 6 ? "Strong" : m >= 5 ? "Moderate" : "Light");
export const magText = (w) => MAG_TEXT[w] || w;

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Generic group-by returning [{ key, items }] preserving insertion order. */
export const groupBy = (arr, keyFn) => {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return [...m.entries()].map(([key, items]) => ({ key, items }));
};

export function timeAgo(iso) {  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
export const cityOf = (s) => (s || "").split(",")[0];
/** Compact state label for tight headers. */
const STATE_SHORT = { "WP Kuala Lumpur": "Kuala Lumpur", "WP Labuan": "Labuan", "WP Putrajaya": "Putrajaya", "Negeri Sembilan": "N. Sembilan" };
export const shortState = (name) => STATE_SHORT[name] ?? name;
/** Hour label for a "YYYY-MM-DDTHH:MM:SS" timestamp: "9am", "12pm", "3pm". */
export const hourLabel = (t) => {
  const h = parseInt((t || "").slice(11, 13) || "0", 10) || 0;
  return h < 12 ? `${h || 12}am` : h === 12 ? "12pm" : `${h - 12}pm`;
};
const distKm = (aLat, aLon, bLat, bLon) => {
  const R = 6371, dLa = ((bLat - aLat) * Math.PI) / 180, dLo = ((bLon - aLon) * Math.PI) / 180;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLo / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
export const nearestState = (lat, lon) => {
  let best = null, bestD = Infinity;
  for (const s of STATES) { const d = distKm(lat, lon, s.lat, s.lon); if (d < bestD) { bestD = d; best = s; } }
  return best ? { name: best.name, km: Math.round(bestD) } : null;
};

/* MET warning severity (FIRST/SECOND/THIRD category -> 1/2/3) + presentation. */
export const severityColor = (s) => (s >= 3 ? "#a51612" : s === 2 ? "#b3491a" : "#8f5c00");
/** Ordering for sorting/limiting warnings by how severe they read (higher = worse). */
export const severityRank = (w) => {
  switch (w?.severity) {
    case "Danger": case "Warning": return 4;
    case "High": case "Severe": return 3;
    case "Moderate": return 2;
    default: return 1;
  }
};

const REGION_KEYS = ["Indonesia", "Philippines", "Malaysia", "Singapore", "Brunei", "Thailand", "Vietnam", "Taiwan", "Papua New Guinea", "Australia", "New Zealand", "Vanuatu", "Fiji", "Tonga", "Solomon Islands", "Sri Lanka", "India", "Myanmar"];
export function regionOf(place) {
  const s = place || "", tail = (s.split(",").pop() || "").trim();
  if (tail && /[A-Za-z]/.test(tail)) return tail;
  for (const c of REGION_KEYS) if (s.includes(c)) return c;
  return "Other";
}
const COMPASS = { NNW:"north-northwest", NW:"northwest", WNW:"west-northwest", N:"north", NNE:"north-northeast", NE:"northeast", ENE:"east-northeast", E:"east", ESE:"east-southeast", SE:"southeast", SSE:"south-southeast", S:"south", SSW:"south-southwest", SW:"southwest", WSW:"west-southwest", W:"west" };
export function friendlyLoc(place) {
  let s = place || "";
  for (const [a, w] of Object.entries(COMPASS)) s = s.replace(new RegExp(`\\b${a}\\b`), w);
  return s.split(",")[0];
}

/** Approximate moon phase from date (simple synodic-month calc). */
export function moonPhase(date = new Date()) {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - ref) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const i = Math.round((age / synodic) * 8) % 8;
  const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  const emojis = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return { name: names[i], emoji: emojis[i], age: Math.round(age) };
}

/** Does an observation belong to the given town? Compares names loosely. */
export function atTown(o, townName, townSlug) {
  const t = (townName || "").toLowerCase().replace(/\s+/g, " ");
  const n = (o?.stationName || o?.station || "").toLowerCase().replace(/\s+/g, " ");
  if (!t || !n) return false;
  return n.includes(t) || t.includes(n) || o?.station === townSlug;
}
