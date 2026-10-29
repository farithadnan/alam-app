import { numColor, cityOf } from "../../domain/flags.js";
import { bandLabel, bandAdvice } from "../../core/i18n.svelte.js";
import { mapPopup } from "../../domain/popup.js";

/** Malaysia APIMS band order, worst last. */
const BAND_ORDER = ["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"];

/** Station count per band, worst bands included only when non-zero. */
export function bandCounts(stations = []) {
  return BAND_ORDER.map((label) => ({ label, n: stations.filter((s) => s.band?.label === label).length })).filter((c) => c.n > 0);
}

/** min / avg / max for a {t,v} series. */
export function seriesStats(series = []) {
  const vs = series.map((d) => d.v).filter((v) => Number.isFinite(v));
  if (!vs.length) return null;
  return {
    min: Math.min(...vs),
    max: Math.max(...vs),
    avg: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length),
  };
}

/** Distinct band -> colour pairs present in a station list (map legend). */
export function legendOf(stations = []) {
  return [...new Map(stations.map((s) => [s.band?.label, numColor(s.band?.label)])).entries()];
}

/** Map marker points for AQI stations, popups included. */
export function airMapPoints(stations = []) {
  return stations
    .filter((s) => s.coords?.lat && s.coords?.lon)
    .map((s) => {
    const col = numColor(s.band?.label);
    return {
    lat: s.coords.lat,
    lon: s.coords.lon,
    color: col,
    num: s.value,
    size: 26,
    html: mapPopup({
          title: cityOf(s.stationName),
          value: String(s.value),
          valueColor: col,
          flag: bandLabel(s.band?.label),
          note: bandAdvice(s.band?.label) || s.band?.advice,
        }),
      };
    });
}

/** Great-circle distance in km. */
export function haversine(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest entry (by coords) to a point. Returns { item, km } or null. */
export function nearestBy(rows = [], me) {
  let best = null;
  let bestKm = Infinity;
  for (const r of rows) {
    if (!r.coords?.lat) continue;
    const km = haversine(me, r.coords);
    if (km < bestKm) {
      bestKm = km;
      best = r;
    }
  }
  return best ? { item: best, km: bestKm } : null;
}
