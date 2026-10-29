import { fetchText } from "../http.js";
import { slug } from "../text.js";
import { MY_OFFSET_MS } from "../static/constants.js";
import { MALAYSIA_STATES } from "../static/states.js";

/**
 * Public InfoBanjir (JPS Malaysia) current flood + rainfall alerts.
 *
 * REVISED 2026-10-29: JPS rebuilt the site and removed the machine-readable
 * `currentalert.json` feed (it now 404s). The alert table is server-rendered HTML
 * (`<tbody id="palertList">`) — this adapter parses it. Only stations currently in an
 * alert band appear (river at Amaran/Waspada/Bahaya, rain at Sederhana/Lebat), and
 * reading that is older than 4h is treated as stale and dropped (a false alarm).
 *
 * The HTML carries no station ids or coordinates (a regression vs the old feed), so
 * rows are keyed by a slug of the station name and report no lat/lon — the flood
 * screen still lists them; only the map pins and distance-scoping lose precision.
 */

const URL = "https://publicinfobanjir.water.gov.my/";

/** class=status.<k> → canonical severity labels (the labels the whole app uses). */
const RIVER_SEV = { bahaya: "Danger", waspada: "Warning", amaran: "Alert" };
const RAIN_SEV = { sangatlebat: "Sangat Lebat", lebat: "Heavy", sederhana: "Moderate" };

const MAX_READING_AGE_MS = 4 * 3_600_000; // 4 h

const CLEAN = (s) => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Parse Malaysia-local "DD/MM/YYYY HH:MM" (UTC+8, no DST) to a UTC epoch; null if malformed. */
export function parseMyDateTime(ts) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/.exec(String(ts ?? "").trim());
  if (!m) return null;
  const [, dd, mm, yy, hh, mi] = m;
  return Date.UTC(Number(yy), Number(mm) - 1, Number(dd), Number(hh), Number(mi)) - MY_OFFSET_MS;
}

const num = (s) => {
  const n = Number.parseFloat(String(s ?? "").replace(",", "").trim());
  return Number.isFinite(n) ? n : null;
};

function canonicalState(raw) {
  const hit = MALAYSIA_STATES.find((s) => s.name.toUpperCase() === String(raw ?? "").trim().toUpperCase());
  return hit?.name ?? (String(raw ?? "").trim() || null);
}

/** First `<td>` cells of an alert row: { attrs, content } with comments stripped. */
function cellsOf(row) {
  const out = [];
  const clean = row.replace(/<!--[\s\S]*?-->/g, "");
  const re = /<td([^>]*)>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(clean))) out.push({ attrs: m[1], content: m[2] });
  return out;
}

/** severity class of a `<td class="status X">` opening tag. */
function sevClass(td) {
  const m = /\bclass="status\s+([a-z]+)"/i.exec(td.attrs);
  return m ? m[1].toLowerCase() : null;
}

function timeFrom(text) {
  const m = /Tarikh:\s*([\d/]{6,10}\s+\d{1,2}:\d{2})/i.exec(text);
  return m ? m[1].trim() : null;
}

export class InfobanjirAdapter {
  id = "infobanjir";

  async poll(at = Date.now()) {
    const html = await fetchText(URL, { retries: 2, headers: { accept: "text/html" } });
    const tbody = html.slice(html.indexOf('<tbody id="palertList"'), html.indexOf("</tbody>") + 8);
    const out = [];
    let state = null;
    const rows = tbody.split(/<tr[\s>]/).slice(1);
    for (const rawRow of rows) {
      const row = `<tr${rawRow}`;
      const header = /class="state-header"/.test(row);
      if (header) {
        const m = /NEGERI\s*:?\s*([^<]+)/i.exec(CLEAN(row));
        if (m) state = canonicalState(m[1].trim());
        const nm = /([A-Z][A-Z\s]+)/.exec(CLEAN(row));
        if (!m && nm) state = canonicalState(nm[1].trim());
        continue;
      }
      const cells = cellsOf(row);
      if (cells.length < 5) continue;
      const name = CLEAN(cells[0].content);
      if (!name) continue;
      const riverSev = RIVER_SEV[sevClass(cells[1])];
      const rainSev = RAIN_SEV[sevClass(cells[3])];
      if (!riverSev && !rainSev) continue;

      const riverText = CLEAN(cells[2].content);
      const rainText = CLEAN(cells[4].content);
      const ts = timeFrom(riverText) || timeFrom(rainText);
      const ms = ts ? parseMyDateTime(ts) : null;
      if (ms == null || at - ms > MAX_READING_AGE_MS) continue; // unknown or stale: no false alarm

      if (riverSev) {
        const value = num(/([\d.]+)\s*m\b/i.exec(riverText)?.[1]);
        const trendMatch = /Trend:\s*([^)]+)/i.exec(riverText);
        if (value != null) {
          out.push({
            source: "infobanjir",
            station: slug(name),
            stationName: name,
            measuredAt: new Date(ms).toISOString(),
            kind: "flood",
            value,
            meta: {
              type: "river",
              state,
              district: null,
              basin: null,
              trend: trendMatch ? trendMatch[1].trim() : null,
              lat: null,
              lon: null,
              severity: riverSev,
            },
          });
        }
      }
      if (rainSev) {
        const value = num(/([\d.]+)\s*mm/i.exec(rainText)?.[1]);
        if (value != null) {
          out.push({
            source: "infobanjir",
            station: slug(name) + ":rain",
            stationName: name,
            measuredAt: new Date(ms).toISOString(),
            kind: "rainfall",
            value,
            meta: {
              type: "rain",
              state,
              district: null,
              basin: null,
              trend: null,
              lat: null,
              lon: null,
              severity: rainSev,
            },
          });
        }
      }
    }
    return out;
  }
}
