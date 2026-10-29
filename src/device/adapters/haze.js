/**
 * Haze outlook from the Open-Meteo air-quality series (model forecast of PM2.5 mass,
 * not the official APIMS index — presented as µg/m³ vs the WHO 24-hour guideline).
 */

export const WHO_PM25_24H = 15;

export function dailyPm25(series) {
  const times = series.time ?? [];
  const values = series.pm2_5 ?? [];
  const byDate = new Map();
  for (let i = 0; i < times.length; i++) {
    const value = values[i];
    const date = (times[i] ?? "").slice(0, 10);
    if (!date || typeof value !== "number" || !Number.isFinite(value)) continue;
    const list = byDate.get(date);
    if (list) list.push(value);
    else byDate.set(date, [value]);
  }
  return [...byDate.entries()]
    .map(([date, list]) => ({
      date,
      pm25Max: Math.round(Math.max(...list) * 10) / 10,
      pm25Avg: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10,
      hours: list.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aboveGuideline(pm25Max) {
  return pm25Max > WHO_PM25_24H;
}
