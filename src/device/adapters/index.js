import { MALAYSIA_STATES } from "../static/states.js";
import { CADENCE } from "../static/constants.js";
import { DoeEqmsAdapter } from "./doeEqms.js";
import { OpenMeteoAdapter } from "./openMeteo.js";
import { UsgsEqAdapter } from "./usgsEq.js";
import { OniAdapter } from "./oni.js";
import { MetWarningsAdapter } from "./metWarnings.js";
import { MetForecastAdapter } from "./metForecast.js";
import { NewsAdapter } from "./news.js";
import { InfobanjirAdapter } from "./infobanjir.js";

/** Single place that composes the active data sources the device poll. */
export function buildAdapters() {
  return [
    new DoeEqmsAdapter(MALAYSIA_STATES),
    new OpenMeteoAdapter(),
    new UsgsEqAdapter(),
    new OniAdapter(),
    new MetWarningsAdapter(),
    new MetForecastAdapter(),
    new NewsAdapter(),
    new InfobanjirAdapter(),
  ];
}

/** Per-adapter poll interval in ms (device-friendly cadences, see constants). */
export const cadence = (id) => CADENCE[id] ?? 1_800_000;
