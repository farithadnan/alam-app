import { fetchJson } from "../http.js";
import { MALAYSIA_LOCALITIES } from "../static/localities.js";
import { dailyPm25 } from "./haze.js";

/**
 * Open-Meteo — batched for the device. The server sends 3 requests × 108 towns = 324
 * calls per cycle; a phone must not. Open-Meteo's multiple-locations mode returns an
 * ARRAY of per-location results (verified against the live API), so each call type
 * becomes one request covering MANY towns at once:
 *
 *   BATCH call 1: current weather + 10-day daily + 24h hourly for BATCH towns
 *   BATCH call 2: current air quality + 4-day hourly PM2.5 for BATCH towns
 *
 * with BATCH = half the registry (54), so a cycle is 4 requests for the whole country
 * and each response stays comfortably bounded (~250-400 KB).
 */
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WEATHER_PARAMS = "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,precipitation,apparent_temperature,weather_code,pressure_msl,visibility,dew_point_2m";
const AIR_QUALITY_PARAMS = "pm2_5,pm10,us_aqi,uv_index";
const HAZE_DAYS = 4;
const FORECAST_PARAMS = "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max";
const HOURLY_PARAMS = "temperature_2m,precipitation_probability,weather_code";
const BATCH = 54;

export class OpenMeteoAdapter {
  id = "open-meteo";

  constructor(localities = MALAYSIA_LOCALITIES, batch = BATCH) {
    this.localities = localities;
    this.batch = batch;
  }

  /** One multi-location request; resolves [] on failure (skip, keep the country). */
  async batchFetch(base, locs, params) {
    const lat = locs.map((l) => l.lat).join(",");
    const lon = locs.map((l) => l.lon).join(",");
    const url = `${base}?latitude=${lat}&longitude=${lon}&${params}`;
    try {
      const data = await fetchJson(url, { timeoutMs: 25_000 });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async poll() {
    const out = [];
    for (let i = 0; i < this.localities.length; i += this.batch) {
      const locs = this.localities.slice(i, i + this.batch);
      const [weatherRes, airRes] = await Promise.all([
        this.batchFetch(WEATHER_URL, locs, `current=${WEATHER_PARAMS}&daily=${FORECAST_PARAMS},sunrise,sunset&hourly=${HOURLY_PARAMS}&forecast_hours=24&forecast_days=10&timezone=auto`),
        this.batchFetch(AIR_QUALITY_URL, locs, `current=${AIR_QUALITY_PARAMS}&hourly=pm2_5&forecast_days=${HAZE_DAYS}&timezone=auto`),
      ]);
      // weatherRes[h] / airRes[h] correspond by array position to locs[h].
      const count = Math.min(locs.length, weatherRes.length, airRes.length);
      for (let h = 0; h < count; h++) {
        const loc = locs[h];
        const wx = weatherRes[h];
        const air = airRes[h];
        if (!wx?.current || !air?.current) continue;
        const weather = wx.current;
        const aq = air.current;
        out.push(
          {
            source: "open-meteo",
            station: loc.slug,
            stationName: loc.name,
            measuredAt: weather.time,
            kind: "weather",
            value: weather.temperature_2m,
            meta: {
              state: loc.state, humidity: weather.relative_humidity_2m, wind: weather.wind_speed_10m,
              gust: weather.wind_gusts_10m, precipitation: weather.precipitation, apparentTemp: weather.apparent_temperature,
              code: weather.weather_code, pressure: weather.pressure_msl, visibility: weather.visibility,
              dewPoint: weather.dew_point_2m, sunrise: wx.daily?.sunrise?.[0] ?? null, sunset: wx.daily?.sunset?.[0] ?? null,
            },
          },
          {
            source: "open-meteo",
            station: loc.slug,
            stationName: loc.name,
            measuredAt: aq.time,
            kind: "aqi",
            value: aq.us_aqi,
            meta: { state: loc.state, pm2_5: aq.pm2_5, pm10: aq.pm10, uv: aq.uv_index },
          },
        );
        // Haze outlook: one row per day, the day's peak PM2.5 (model data, WHO guideline).
        for (const day of dailyPm25(air.hourly ?? {})) {
          out.push({
            source: "open-meteo",
            station: loc.slug,
            stationName: loc.name,
            measuredAt: `${day.date}T00:00:00`,
            kind: "haze",
            value: day.pm25Max,
            meta: { state: loc.state, avg: day.pm25Avg, hours: day.hours },
          });
        }
        const fc = wx.daily;
        const hr = wx.hourly;
        if (fc) {
          for (let d = 0; d < fc.time.length; d++) {
            out.push({
              source: "open-meteo",
              station: loc.slug,
              stationName: loc.name,
              measuredAt: new Date(`${fc.time[d]}T12:00:00Z`).toISOString(),
              kind: "forecast",
              value: fc.temperature_2m_max[d] ?? 0,
              meta: {
                state: loc.state, tmin: fc.temperature_2m_min[d] ?? null, tmax: fc.temperature_2m_max[d] ?? null,
                precip: fc.precipitation_probability_max[d] ?? null, uv: fc.uv_index_max[d] ?? null,
                code: fc.weather_code[d] ?? null,
              },
            });
          }
        }
        if (hr) {
          for (let t = 0; t < hr.time.length; t++) {
            out.push({
              source: "open-meteo",
              station: loc.slug,
              stationName: loc.name,
              measuredAt: hr.time[t] ?? "",
              kind: "hourly",
              value: hr.temperature_2m[t] ?? 0,
              meta: { state: loc.state, precip: hr.precipitation_probability[t] ?? null, code: hr.weather_code[t] ?? null },
            });
          }
        }
      }
    }
    return out;
  }
}
