import { fetchJson } from "../http.js";
import { slug } from "../text.js";
import { districtState, isDistrict } from "../static/metDistricts.js";

const FORECAST_URL = "https://api.data.gov.my/weather/forecast?limit=5000";
const MAX_ROWS = 3200;

/** MET Malaysia official 7-day district forecast (api.data.gov.my). */
export class MetForecastAdapter {
  id = "my-met-forecast";

  async poll() {
    const rows = await fetchJson(FORECAST_URL);
    const out = [];
    for (const r of (rows ?? []).slice(0, MAX_ROWS)) {
      const name = r.location?.location_name;
      const id = r.location?.location_id;
      const date = r.date;
      if (!name || !date || !isDistrict(id)) continue; // districts only — never guess
      out.push({
        source: "my-met-forecast",
        station: slug(name),
        stationName: name,
        measuredAt: `${date}T00:00:00`,
        kind: "metfc",
        value: r.max_temp ?? 0,
        meta: {
          state: districtState(id),
          districtId: id ?? null,
          morning: r.morning_forecast ?? null,
          afternoon: r.afternoon_forecast ?? null,
          night: r.night_forecast ?? null,
          summary: r.summary_forecast ?? null,
          when: r.summary_when ?? null,
          tmin: r.min_temp ?? null,
          tmax: r.max_temp ?? null,
        },
      });
    }
    return out;
  }
}
