import { fetchJson } from "../http.js";

const BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const SE_ASIA_BBOX = "minlatitude=-10&maxlatitude=20&minlongitude=90&maxlongitude=140";
const MAX_OBSERVATIONS = 200;
const PLACE_LIMIT = 80;

function truncate(s, max) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** USGS FDSN earthquake feed — free, key-less, SE-Asia 7-day window (4.5+). */
export class UsgsEqAdapter {
  id = "usgs-eq";

  async poll() {
    const start = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
    const url =
      `${BASE_URL}?format=geojson&starttime=${start}` +
      `&${SE_ASIA_BBOX}&minmagnitude=4.5&orderby=time`;

    const data = await fetchJson(url);
    return (data.features ?? []).slice(-MAX_OBSERVATIONS).map((f) => {
      const p = f.properties ?? {};
      return {
        source: "usgs-eq",
        station: f.id,
        stationName: truncate(p.place ?? "Unknown", PLACE_LIMIT),
        measuredAt: new Date(p.time ?? Date.now()).toISOString(),
        kind: "quake",
        value: p.mag ?? 0,
        meta: {
          depth: f.geometry?.coordinates?.[2] ?? null,
          url: p.url ?? null,
          lat: f.geometry?.coordinates?.[1] ?? null,
          lon: f.geometry?.coordinates?.[0] ?? null,
          alert: p.alert ?? null,
          tsunami: p.tsunami ?? null,
          felt: p.felt ?? null,
          mmi: p.mmi ?? null,
          cdi: p.cdi ?? null,
          sig: p.sig ?? null,
          magType: p.magType ?? null,
          nst: p.nst ?? null,
          status: p.status ?? null,
          eqType: p.type ?? null,
        },
      };
    });
  }
}
