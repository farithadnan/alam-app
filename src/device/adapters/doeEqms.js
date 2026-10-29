import { fetchJson } from "../http.js";

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const STATIONS_URL =
  "https://eqms.doe.gov.my/api3/publicmapproxy/PUBLIC_DISPLAY/CAQM_MCAQM_Current_Reading/MapServer/0/query" +
  "?where=1%3D1&outFields=*&returnGeometry=false&f=json";

/**
 * Malaysia DOE APIMS (eqms.doe.gov.my) — authoritative per-station AQI.
 * Polls EVERY state; each state returns ~24h of hourly readings for all of that
 * state's stations. A failing state is skipped rather than aborting the poll.
 * CORS-blocked in a browser — fine in the APK via CapacitorHttp.
 */
export class DoeEqmsAdapter {
  id = "doe-eqms";

  constructor(states) {
    this.states = states;
  }

  async stationMeta() {
    const out = new Map();
    try {
      const data = await fetchJson(STATIONS_URL);
      for (const f of data.features ?? []) {
        const a = f.attributes;
        const id = a.STATION_ID;
        if (!id) continue;
        out.set(id, {
          lat: a.LATITUDE ?? null,
          lon: a.LONGITUDE ?? null,
          place: a.PLACE ?? null,
          category: String(a.STATION_CATEGORY ?? "").trim() || null,
          region: a.REGION_NAME ?? null,
          pm10: a.API_PM10 ?? null,
          param: a.PARAM_SELECTED ?? null,
        });
      }
    } catch {
      /* metadata is optional */
    }
    return out;
  }

  async poll(at) {
    const meta = await this.stationMeta();
    const results = await mapLimit(this.states, 4, async (st) => {
      try {
        const localNow = at ?? new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 19);
        const url =
          `https://eqms.doe.gov.my/api3/publicportalapims/apitablehourly` +
          `?stateid=${st.id}&datetime=${localNow}`;
        const data = await fetchJson(url);
        return (data.api_table_hourly ?? []).map((r) => {
          const m = meta.get(r.STATION_ID);
          return {
            source: "doe-eqms",
            station: r.STATION_ID,
            stationName: r.STATION_LOCATION,
            measuredAt: r.DATETIME,
            kind: "aqi",
            value: r.API,
            meta: {
              state: st.name,
              lat: m?.lat ?? null,
              lon: m?.lon ?? null,
              place: m?.place ?? null,
              category: m?.category ?? null,
              region: m?.region ?? null,
              pm10: m?.pm10 ?? null,
              param: m?.param ?? null,
            },
          };
        });
      } catch {
        return [];
      }
    });
    return results.flat();
  }
}
