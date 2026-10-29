/**
 * Bundle builders — the device re-implementation of the server read API.
 *
 * Every function here mirrors the matching route in alam-api/src/worker.js, but reads
 * from the on-device DeviceStore instead of D1. The shapes returned are byte-for-byte
 * compatible with what the dashboard views already consume, so the five tabs work
 * unchanged against device data.
 */
import { deviceStore as store } from "./store.js";
import { aqiBand } from "./static/bands.js";
import { groupWarnings } from "./static/warnings.js";
import { MALAYSIA_LOCALITIES } from "./static/localities.js";
import { MALAYSIA_STATES } from "./static/states.js";
import { districtFor } from "./static/townDistricts.js";
import { MY_OFFSET_MS, LATEST_LIMIT, NEWS_LIMIT, QUAKE_LIMIT } from "./static/constants.js";
import { WHO_PM25_24H } from "./adapters/haze.js";

const decorate = (o) =>
  o.kind === "aqi" && o.source === "doe-eqms" ? { ...o, band: aqiBand(o.value) } : o;

const quakeView = (q) => ({ source: q.source, station: q.station, stationName: q.stationName, measuredAt: q.measuredAt, magnitude: q.value, meta: q.meta ?? null });
const warningView = (w) => ({ source: w.source, station: w.station, title: w.stationName, severity: w.value, measuredAt: w.measuredAt, meta: w.meta ?? null });

function stateOf(v) {
  const n = String(v ?? "").trim().toLowerCase();
  const ALIAS = {
    penang: "Pulau Pinang", "pulau pinang": "Pulau Pinang", "kuala lumpur": "WP Kuala Lumpur",
    kl: "WP Kuala Lumpur", labuan: "WP Labuan", "ft labuan": "WP Labuan", putrajaya: "WP Putrajaya",
    "ft putrajaya": "WP Putrajaya", "wp kuala lumpur": "WP Kuala Lumpur", malacca: "Melaka",
    "n. sembilan": "Negeri Sembilan", "negeri sembilan": "Negeri Sembilan",
  };
  const hit = MALAYSIA_STATES.find((s) => s.name.toLowerCase() === n);
  return hit?.name ?? ALIAS[n] ?? v;
}

/** Approximate a station's position: known locality, else state centroid. */
function stationCoords(name, stateName) {
  const slug = (s) => String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const n = slug(name);
  const hit = MALAYSIA_LOCALITIES.find((l) => slug(l.name) === n)
    || MALAYSIA_LOCALITIES.find((l) => l.slug === n)
    || MALAYSIA_LOCALITIES.find((l) => slug(l.name).includes(n) || n.includes(slug(l.name)));
  if (hit) return { lat: hit.lat, lon: hit.lon };
  if (stateName) {
    const st = MALAYSIA_LOCALITIES.filter((l) => l.state === stateName);
    if (st.length) return { lat: st.reduce((a, l) => a + l.lat, 0) / st.length, lon: st.reduce((a, l) => a + l.lon, 0) / st.length };
  }
  return null;
}

function newsRows(rows, limit) {
  const seen = new Set();
  const out = [];
  for (const n of rows) {
    const u = n.meta?.url ?? null;
    if (u && seen.has(u)) continue;
    if (u) seen.add(u);
    out.push({ title: n.stationName, url: u, outlet: n.meta?.outlet ?? null, publishedAt: n.measuredAt });
    if (out.length >= limit) break;
  }
  return out;
}

/** `/api/summary` — the single bundle powering every dashboard view. */
export async function summaryBundle({ state = "", town = "", towns = "" } = {}) {
  const wanted = new Set([town, ...towns.split(",")].map((t) => t.trim()).filter(Boolean));
  const wantedArr = [...wanted];
  const inState = (rows) => (state ? rows.filter((r) => r.meta?.state === state) : rows);
  const byTown = (rows) => (wanted.size ? rows.filter((r) => wanted.has(r.station)) : []);

  const [aqi, weather, earthquakes, warnings, news, climate, allForecast, hourlyForForecast] = await Promise.all([
    store.latestBySource("doe-eqms").then((r) => inState(r.map(decorate))),
    store.latestBySource("open-meteo").then((r) => inState(r.filter((x) => x.kind !== "haze"))),
    store.latestByKind("quake", QUAKE_LIMIT).then((rs) => rs.map(quakeView)),
    store.latestByKind("warning", LATEST_LIMIT).then((rs) => groupWarnings(rs.map(warningView))),
    store.latestByKind("news", NEWS_LIMIT * 3).then((rows) => newsRows(rows, NEWS_LIMIT)),
    store.latestBySource("oni").then((r) => r[0] ?? null),
    wantedArr.length ? store.forecast("open-meteo", wantedArr) : store.forecast("open-meteo"),
    wantedArr.length ? store.hourly("open-meteo", wantedArr) : store.hourly("open-meteo"),
  ]);

  const stations = aqi.map((s) => ({
    ...s,
    coords: s.meta?.lat != null && s.meta?.lon != null ? { lat: s.meta.lat, lon: s.meta.lon } : stationCoords(String(s.stationName), s.meta?.state),
  }));
  const weatherOut = weather.map((r) => {
    const loc = MALAYSIA_LOCALITIES.find((l) => l.slug === r.station);
    return { ...r, coords: loc ? { lat: loc.lat, lon: loc.lon } : null };
  });
  const allTowns = MALAYSIA_LOCALITIES.map((l) => ({ station: l.slug, name: l.name, state: l.state }));

  return {
    states: [...new Set([...aqi, ...weather].map((r) => r.meta?.state).filter(Boolean))],
    allTowns,
    stations,
    weather: weatherOut,
    forecast: byTown(inState(allForecast)),
    hourly: byTown(inState(hourlyForForecast)),
    news,
    hazards: { warnings, earthquakes, climate },
    ts: new Date().toISOString(),
  };
}

function wantedStations(wantedArr) {
  return wantedArr;
}

export async function historyBundle(source, station, hours) {
  const h = Math.min(Math.max(Number(hours) || 24 || 24, 1), 24 * 14);
  const since = new Date(Date.now() + MY_OFFSET_MS - h * 3_600_000).toISOString().slice(0, 19);
  return { history: await store.history(source, station, since) };
}

export async function currentBundle(source) {
  return { source: source || "doe-eqms", current: (await store.latestBySource(source || "doe-eqms")).map(decorate) };
}

export async function forecastBundle(source) {
  return { forecast: await store.forecast(source || "open-meteo") };
}

export async function stationsBundle() {
  return { stations: await store.stations() };
}

export async function hazardsBundle() {
  const [earthquakes, climate, warnings] = await Promise.all([
    store.latestByKind("quake", QUAKE_LIMIT).then((rs) => rs.map(quakeView)),
    store.latestBySource("oni").then((r) => r[0] ?? null),
    store.latestByKind("warning", LATEST_LIMIT).then((rs) => groupWarnings(rs.map(warningView))),
  ]);
  return { earthquakes, climate, warnings, timestamp: new Date().toISOString() };
}

export async function newsBundle() {
  return { news: newsRows(await store.latestByKind("news", 30), 30) };
}

export async function officialBundle({ state = "", town = "", district = "" } = {}) {
  const st = state ? stateOf(state) : null;
  const townDistrict = town ? districtFor(town, await store.townDistrict(town)) : null;
  const rows = (await store.metForecast()).map((r) => ({
    district: r.stationName, state: r.meta?.state ?? null, date: r.measuredAt.slice(0, 10),
    summary: r.meta?.summary ?? null, when: r.meta?.when ?? null,
    tmin: r.meta?.tmin ?? null, tmax: r.meta?.tmax ?? null,
  }));
  const filtered = rows.filter((r) =>
    (!st || r.state === st) && (!townDistrict || r.district === townDistrict) && (!district || r.district.toLowerCase() === district.toLowerCase()));
  return { district: townDistrict ?? district ?? null, official: filtered, districts: [...new Set(rows.map((r) => r.district))] };
}

export async function hazeBundle({ town = "", state = "" } = {}) {
  const rows = town ? await store.hazeFor(town) : await store.latestByKind("haze", 600);
  const scoped = state ? rows.filter((r) => r.meta?.state === state) : rows;
  return {
    town: town || null,
    haze: scoped.map((r) => ({ date: r.measuredAt.slice(0, 10), pm25Max: r.value, pm25Avg: r.meta?.avg ?? null, aboveGuideline: r.value > WHO_PM25_24H })),
  };
}

export async function floodBundle({ state = "" } = {}) {
  const scope = (rows) => (state ? rows.filter((r) => r.meta?.state === state) : rows);
  const rank = { Danger: 0, Warning: 1, Alert: 2, Moderate: 3, Heavy: 3 };
  const worst = (rows) => {
    const seen = new Map();
    for (const r of rows) {
      const cur = seen.get(r.station);
      const rk = rank[r.meta?.severity] ?? 9;
      if (!cur || rk < (rank[cur.meta?.severity] ?? 9)) seen.set(r.station, r);
    }
    return [...seen.values()];
  };
  const [flood, rainfall] = await Promise.all([
    store.latestByKind("flood").then(scope),
    store.latestByKind("rainfall").then(scope),
  ]);
  const river = worst(flood).map((r) => ({
    station: r.station, stationName: r.stationName, state: r.meta?.state, district: r.meta?.district,
    basin: r.meta?.basin, level: r.value, severity: r.meta?.severity, trend: r.meta?.trend,
    lat: r.meta?.lat ?? null, lon: r.meta?.lon ?? null, at: r.measuredAt,
  }));
  const rain = worst(rainfall).map((r) => ({
    station: r.station, stationName: r.stationName, state: r.meta?.state, district: r.meta?.district,
    mmHour: r.value, severity: r.meta?.severity, lat: r.meta?.lat ?? null, lon: r.meta?.lon ?? null, at: r.measuredAt,
  }));
  return { river, rain, timestamp: new Date().toISOString() };
}
