import { fetchText } from "../http.js";

const ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt";
const LINE_RE = /^\s*([A-Z]{3})\s+(\d{4})\s+[\d.+-]+\s+([\d.+-]+)\s*$/;

const SEASON_MID = {
  JFM: "02", FMA: "03", MAM: "04", AMJ: "05", MJJ: "06",
  JJA: "07", JAS: "08", ASO: "09", SON: "10", OND: "11", NDJ: "01", DJF: "02",
};

export function ensoPhase(anomaly) {
  if (anomaly >= 0.5) return "El Niño";
  if (anomaly <= -0.5) return "La Niña";
  return "Neutral";
}

function parse(text) {
  let last = null;
  for (const line of text.split("\n")) {
    const m = LINE_RE.exec(line);
    if (m) last = { season: m[1], year: m[2], anomaly: Number(m[3]) };
  }
  return last;
}

/** El Niño / La Niña phase from the NOAA CPC ONI plain-text index (monthly cadence). */
export class OniAdapter {
  id = "oni";

  async poll() {
    const text = await fetchText(ONI_URL, { headers: { accept: "text/plain" } });
    const row = parse(text);
    if (!row) throw new Error("No ONI data row parsed from NOAA feed");
    const month = SEASON_MID[row.season] ?? "07";
    const phase = ensoPhase(row.anomaly);
    return [
      {
        source: "oni",
        station: "nino3.4",
        stationName: "El Niño Southern Oscillation (Niño 3.4)",
        measuredAt: `${row.year}-${month}-15T00:00:00Z`,
        kind: "climate",
        value: row.anomaly,
        meta: { phase, season: row.season, year: row.year },
      },
    ];
  }
}
