/** Malaysia APIMS AQI bands (index ranges, not US 500-pt scale). */

const BANDS = [
  { from: 0, label: "Good", color: "#43a047", advice: "Air is clean; a good day to be outside." },
  { from: 51, label: "Moderate", color: "#fbc02d", advice: "Acceptable. Sensitive groups: moderate activity is fine." },
  { from: 101, label: "Unhealthy", color: "#ef6c00", advice: "Reduce prolonged outdoor exertion." },
  { from: 201, label: "Very Unhealthy", color: "#d32f2f", advice: "Avoid outdoor activity; keep windows closed." },
  { from: 301, label: "Hazardous", color: "#8e24aa", advice: "Everyone should stay indoors; serious health risk." },
];

export function aqiBand(value) {
  let hit = BANDS[0];
  for (const b of BANDS) if (value >= b.from) hit = b;
  return { label: hit.label, color: hit.color, advice: hit.advice };
}

export function bandIndex(label) {
  const order = ["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"];
  return order.indexOf(label);
}

/** Alert threshold: index >= 101 ("Unhealthy") — same as the server alert engine. */
export const ALERT_BAND_INDEX = 2;
export const ALERT_COOLDOWN_MS = 30 * 60_000;
export const QUAKE_MIN_MAG = 5.0;
export const QUAKE_MAX_KM = 400;
export const FLOOD_MAX_KM = 100;
