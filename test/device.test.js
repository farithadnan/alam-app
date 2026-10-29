import { describe, it, expect, beforeEach } from "vitest";
import { deviceStore } from "../src/device/store.js";
import { serve } from "../src/device/server.js";

/**
 * Phase 1 core proof: the app's data path is fully on-device. Seed the store the way
 * runSync() would (adapters → ingest), then assert the exact endpoints the dashboard
 * calls (`./api/summary`, flood, history, haze, official) resolve from that store —
 * no network, no server, no D1 involved.
 */

const obs = (d) => (d) => ({
  source: d.source, station: d.station, stationName: d.stationName ?? d.station,
  measuredAt: d.measuredAt, kind: d.kind, value: d.value ?? 0, meta: d.meta,
});

// A realistic sync batch: government AQI, model weather+forecast, quakes, warnings,
// climate, news, flood/rain, haze.
const BATCH = [
  { source: "doe-eqms", station: "CA01A", stationName: "Kangar", measuredAt: "2026-10-29T12:00:00", kind: "aqi", value: 48, meta: { state: "Perlis" } },
  { source: "doe-eqms", station: "CA02A", stationName: "Alor Setar", measuredAt: "2026-10-29T12:00:00", kind: "aqi", value: 152, meta: { state: "Kedah" } },
  { source: "open-meteo", station: "arau", stationName: "Arau", measuredAt: "2026-10-29T12:00:00", kind: "weather", value: 30.2, meta: { state: "Perlis", humidity: 70, code: 2 } },
  { source: "open-meteo", station: "kangar", stationName: "Kangar", measuredAt: "2026-10-29T12:00:00", kind: "weather", value: 31, meta: { state: "Perlis", humidity: 68, code: 1 } },
  { source: "open-meteo", station: "arau", stationName: "Arau", measuredAt: "2026-10-30T12:00:00Z", kind: "forecast", value: 31, meta: { state: "Perlis", tmin: 24, tmax: 32, precip: 40 } },
  { source: "open-meteo", station: "arau", stationName: "Arau", measuredAt: "2026-10-29T14:00:00", kind: "hourly", value: 29, meta: { state: "Perlis", precip: 55 } },
  { source: "open-meteo", station: "arau", stationName: "Arau", measuredAt: "2026-10-30T00:00:00", kind: "haze", value: 14.2, meta: { state: "Perlis", avg: 10.1 } },
  { source: "usgs-eq", station: "us2026abc", stationName: "45 km SSE of Kuala Lumpur, Malaysia", measuredAt: "2026-10-29T10:00:00Z", kind: "quake", value: 5.1, meta: { lat: 2.9, lon: 101.7, depth: 40 } },
  { source: "my-met", station: "heavy-rain-perlis", stationName: "Heavy rain", measuredAt: "2026-10-29T09:00:00Z", kind: "warning", value: 2, meta: { state: "Perlis", headingEn: "SECOND CATEGORY", textEn: "Heavy rain over Perlis", type: "rain", validTo: "2026-10-30T09:00:00Z" } },
  { source: "oni", station: "nino3.4", stationName: "El Niño Southern Oscillation (Niño 3.4)", measuredAt: "2026-10-15T00:00:00Z", kind: "climate", value: 0.8, meta: { phase: "El Niño", season: "SON", year: "2026" } },
  { source: "news", station: "news-1", stationName: "Flood warning for Perlis rivers", measuredAt: "2026-10-29T08:00:00Z", kind: "news", value: 0, meta: { url: "https://example.com/n1", outlet: "FMT" } },
  { source: "infobanjir", station: "RB01", stationName: "Sungai Arau", measuredAt: "2026-10-29T11:30:00Z", kind: "flood", value: 3.4, meta: { state: "Perlis", district: "Arau", severity: "Alert", lat: 6.43, lon: 100.27 } },
  { source: "infobanjir", station: "RB02", stationName: "Sungai Kangar", measuredAt: "2026-10-29T11:30:00Z", kind: "rainfall", value: 25, meta: { state: "Perlis", severity: "Moderate" } },
].map(obs());

beforeEach(async () => {
  await deviceStore.reset();
  await deviceStore.ingest(BATCH);
});

describe("device store — sync-batch semantics", () => {
  it("ingests once and dedupes a repeated batch", async () => {
    const again = await deviceStore.ingest(BATCH);
    expect(again).toBe(0);
    expect((await deviceStore.snapshot()).rows).toBe(BATCH.length);
  });

  it("latestBySource returns one row per (station, kind), excluding forecast/hourly", async () => {
    const aqi = await deviceStore.latestBySource("doe-eqms");
    expect(aqi.map((r) => r.kind)).toEqual(["aqi", "aqi"]);
    const meteo = await deviceStore.latestBySource("open-meteo");
    const kinds = meteo.map((r) => r.kind);
    expect(kinds).toContain("weather");
    expect(kinds).not.toContain("forecast");
    expect(kinds).not.toContain("hourly");
  });
});

describe("device server — the endpoints the dashboard calls", () => {
  it("serves /api/summary for a state+town with all five tab feed sections", async () => {
    const b = await serve("./api/summary?state=Perlis&town=arau");
    expect(b.states).toContain("Perlis");
    expect(b.allTowns.length).toBeGreaterThan(100); // national registry
    // AQI stations: the Perlis one is present, banded and resolved to Kangar's coords.
    const kangar = b.stations.find((s) => s.station === "CA01A");
    expect(kangar.band?.label).toBe("Good");
    expect(kangar.coords).toMatchObject({ lat: 6.44, lon: 100.2 });
    // Weather for the town + its forecast/hourly series.
    expect(b.weather.some((r) => r.station === "arau" && r.kind === "weather")).toBe(true);
    expect(b.forecast.some((r) => r.station === "arau" && r.meta?.tmax === 32)).toBe(true);
    expect(b.hourly.some((r) => r.station === "arau" && r.meta?.precip === 55)).toBe(true);
    expect(b.news.length).toBeGreaterThan(0);
    expect(b.hazards.earthquakes[0].magnitude).toBe(5.1);
    expect(b.hazards.climate.meta.phase).toBe("El Niño");
  });

  it("serves a national /api/summary including out-of-state stations", async () => {
    const b = await serve("./api/summary");
    expect(b.stations.length).toBe(2); // Kedah + Perlis across the national window
    expect(b.stations.some((s) => s.station === "CA02A" && s.band?.label === "Unhealthy")).toBe(true);
  });

  it("serves /api/flood with river + rain alerts scoped to a state", async () => {
    const f = await serve("./api/flood?state=Perlis");
    expect(f.river.length).toBe(1);
    expect(f.river[0].stationName).toBe("Sungai Arau");
    expect(f.rain[0].severity).toBe("Moderate");
    const none = await serve("./api/flood?state=Johor");
    expect(none.river.length).toBe(0); // out-of-state alerts are filtered out
  });

  it("serves /api/history for a station", async () => {
    const h = await serve("./api/history?source=doe-eqms&station=CA01A&hours=24");
    expect(h.history.length).toBe(1);
    expect(h.history[0].value).toBe(48);
  });

  it("serves /api/haze for a town", async () => {
    const z = await serve("./api/haze?town=arau");
    expect(z.haze.length).toBe(1);
    expect(z.haze[0].pm25Max).toBe(14.2);
    expect(z.haze[0].aboveGuideline).toBe(false);
  });

  it("serves /api/official district forecast for a town", async () => {
    const o = await serve("./api/official?town=arau");
    // Arau is not itself a MET district; the resolver reports no district — the ""
    // here is exact server parity (the worker returns `townDistrict ?? q("district") 
    // ?? null`, and an absent district param is "").
    expect(o.district).toBe("");
    expect(o.official).toHaveLength(0);
    expect(o.districts).toEqual([]);
  });
});

describe("device sync — adapter cadence gates", () => {
  it("tracks source_state and respects intervals", async () => {
    await deviceStore.recordPoll("doe-eqms", 5);
    const st = await deviceStore.sourceState("doe-eqms");
    expect(st.lastOkAt).toBeTruthy();
    const intervalMs = 30_000; // 30 s for the test; cadence tracking is clock arithmetic
    expect(await deviceStore.isStale("doe-eqms", intervalMs, Date.parse(st.lastPolledAt) + 30_001)).toBe(true);
    expect(await deviceStore.isStale("doe-eqms", intervalMs, Date.parse(st.lastPolledAt) + 1000)).toBe(false);
  });
});
