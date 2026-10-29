/** Malaysia is UTC+8 — used whenever we compare/format local wall-clock times. */
export const MY_OFFSET_MS = 8 * 3_600_000;

/** Default row caps for read endpoints. */
export const LATEST_LIMIT = 20;
export const NEWS_LIMIT = 15;
export const QUAKE_LIMIT = 20;

/** Per-adapter poll cadence in ms (device defaults, mirroring the GH-runner config). */
export const CADENCE = {
  "doe-eqms": 1_800_000, // 30 min — battery-friendly on a phone
  "open-meteo": 1_800_000,
  "usgs-eq": 1_200_000,
  oni: 86_400_000,
  "my-met": 1_800_000,
  "my-met-forecast": 21_600_000,
  news: 3_600_000,
  infobanjir: 1_800_000,
};

export const DATA_KEEP_DAYS = 14;
export const MAX_ROWS = 100_000;
