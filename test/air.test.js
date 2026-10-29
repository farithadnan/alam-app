import { describe, expect, it } from "vitest";
import { bandCounts, seriesStats, legendOf, airMapPoints, haversine, nearestBy } from "../src/features/air/air.js";

const st = (name, value, label, lat, lon) => ({
  station: name,
  stationName: name,
  value,
  band: { label },
  coords: lat != null ? { lat, lon } : null,
});

describe("bandCounts", () => {
  it("counts per band and omits empty bands", () => {
    const rows = [st("A", 20, "Good"), st("B", 30, "Good"), st("C", 120, "Unhealthy")];
    expect(bandCounts(rows)).toEqual([
      { label: "Good", n: 2 },
      { label: "Unhealthy", n: 1 },
    ]);
  });
  it("returns nothing for an empty list", () => {
    expect(bandCounts([])).toEqual([]);
  });
});

describe("seriesStats", () => {
  it("computes min / avg / max", () => {
    expect(seriesStats([{ t: "1", v: 10 }, { t: "2", v: 20 }, { t: "3", v: 60 }])).toEqual({ min: 10, max: 60, avg: 30 });
  });
  it("ignores non-numeric points and returns null when there is nothing usable", () => {
    expect(seriesStats([])).toBeNull();
    expect(seriesStats([{ t: "1", v: NaN }])).toBeNull();
  });
});

describe("legendOf", () => {
  it("keeps one entry per band", () => {
    expect(legendOf([st("A", 20, "Good"), st("B", 25, "Good"), st("C", 120, "Unhealthy")])).toHaveLength(2);
  });
});

describe("airMapPoints", () => {
  it("skips stations without coordinates and builds a popup for the rest", () => {
    const pts = airMapPoints([st("Kangar", 20, "Good", 6.4, 100.2), st("NoCoords", 50, "Moderate")]);
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({ lat: 6.4, lon: 100.2, num: 20, size: 26 });
    expect(pts[0].html).toContain("Kangar");
  });
});

describe("haversine / nearestBy", () => {
  it("measures a known distance (Kangar -> Alor Setar is roughly 40-50 km)", () => {
    const km = haversine({ lat: 6.44, lon: 100.19 }, { lat: 6.12, lon: 100.36 });
    expect(km).toBeGreaterThan(30);
    expect(km).toBeLessThan(60);
  });
  it("picks the closest station and reports the distance", () => {
    const rows = [st("Far", 10, "Good", 5.0, 100.0), st("Near", 20, "Good", 6.4, 100.2)];
    const hit = nearestBy(rows, { lat: 6.44, lon: 100.19 });
    expect(hit.item.station).toBe("Near");
    expect(hit.km).toBeLessThan(10);
  });
  it("returns null when no station has coordinates", () => {
    expect(nearestBy([st("X", 1, "Good")], { lat: 1, lon: 1 })).toBeNull();
  });
});
