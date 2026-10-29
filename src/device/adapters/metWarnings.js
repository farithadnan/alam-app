import { fetchJson } from "../http.js";
import { slug } from "../text.js";

const WARNINGS_URL = "https://api.data.gov.my/weather/warning";

const CATEGORY = /(FIRST|SECOND|THIRD)\s+CATEGORY/i;
const SEVERITY = { FIRST: 1, SECOND: 2, THIRD: 3 };

function warnType(title, heading) {
  const s = `${title} ${heading}`.toLowerCase();
  if (/heat|haba|hot spell|hot weather/.test(s)) return "heat";
  if (/thunder|ribut petir|lightning/.test(s)) return "thunderstorm";
  if (/rain|hujan/.test(s)) return "rain";
  if (/wind|angin/.test(s)) return "wind";
  return "weather";
}

/** MET Malaysia weather warnings (api.data.gov.my) — bilingual, official, no auth. */
export class MetWarningsAdapter {
  id = "my-met";

  async poll() {
    const items = await fetchJson(WARNINGS_URL, { headers: { accept: "application/json" } });
    const out = [];
    for (const w of items ?? []) {
      const title = w.warning_issue?.title_en || w.heading_en || "Weather warning";
      const titleBm = w.warning_issue?.title_bm || "";
      if (/(tiada nasihat|no advisory|no warning)/i.test(`${title} ${titleBm} ${w.heading_en ?? ""}`)) continue;
      if (/(rough seas|laut bergelora|shipping|perkapalan)/i.test(`${title} ${titleBm}`)) continue;
      const cat = CATEGORY.exec(w.heading_en || "");
      const severity = (cat && SEVERITY[cat[1]]) || 1;
      out.push({
        source: "my-met",
        station: slug(title),
        stationName: title,
        measuredAt: w.warning_issue?.issued || w.valid_to || new Date().toISOString(),
        kind: "warning",
        value: severity,
        meta: {
          titleBm,
          type: warnType(title, w.heading_en ?? ""),
          headingEn: w.heading_en ?? null,
          textEn: w.text_en ?? null,
          validFrom: w.valid_from ?? null,
          validTo: w.valid_to ?? null,
        },
      });
    }
    return out;
  }
}
