/**
 * Alert message builders — plain-text device port of alam-api/src/core/messages.ts
 * (Telegram HTML formatting dropped; delivered via local notifications and the
 * in-app alert center instead).
 */

const BAND_ICON = {
  Good: "🟢",
  Moderate: "🟠",
  Unhealthy: "🔴",
  "Very Unhealthy": "🔴",
  Hazardous: "🟣",
};

/** Malaysia time, short: "6:00 PM". */
export function clock(iso) {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kuala_Lumpur",
  });
}

/** How long ago, at a glance: "12 min ago", "3h ago", "2d ago". */
export function ago(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function aqiMsg({ value, band, place, advice }) {
  const icon = BAND_ICON[band] ?? "🔴";
  const lines = [`${icon} AQI ${Math.round(value)} · ${band}`, place];
  if (advice) lines.push(advice);
  return lines.join("\n");
}

export function aqiRecoveredMsg({ value, band }) {
  const icon = BAND_ICON[band] ?? "🟢";
  return `${icon} AQI improved to ${Math.round(value)} · ${band}\nYour area is clear again.`;
}

export function warningMsg({ title, place, issuedAt }) {
  return `⚠️ ${title} — ${place}\nIssued ${ago(issuedAt)}`;
}

export function quakeMsg({ magnitude, place, depthKm, at }) {
  const detail = [depthKm != null ? `Depth ${Math.round(depthKm)} km` : "", ago(at)].filter(Boolean).join(" · ");
  return `🌐 M ${magnitude.toFixed(1)} — ${place}\n${detail}`;
}

export function floodMsg({ place, station, district, level, severity, trend }) {
  const lines = [`🚨 River flood alert`, `${station} — ${district ?? place}`];
  lines.push(`Level ${level} m · ${severity}${trend ? ` · ${trend}` : ""}`);
  return lines.join("\n");
}

export function rainMsg({ place, station, district, mmHour, severity }) {
  const lines = [`🌧 Heavy rain`, `${station} — ${district ?? place}`];
  lines.push(`${mmHour} mm/hr · ${severity}`);
  return lines.join("\n");
}

/** One summary per pass: all alert topics joined, never a burst. */
export function composeBody(texts) {
  const head = texts.length === 1 ? "" : `🔔 ${texts.length} new alerts\n\n`;
  return `${head}${texts.join("\n\n")}`;
}
