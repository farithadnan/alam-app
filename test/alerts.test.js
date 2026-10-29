import { describe, it, expect } from "vitest";
import { evaluate, pickAqiStation, warningKey } from "../src/device/alerts/engine.js";
import { quietActive, malaysiaHour } from "../src/device/alerts/settings.js";

/** A device "subscription" watching Arau, Perlis. */
const sub = {
  chatId: 0, townSlug: "arau", state: "Perlis", place: "Arau",
  alertTypes: ["aqi", "warning", "quake", "flood"], enabled: true,
};

const aqi = (station, value, state = "Perlis", meta = {}) => ({
  source: "doe-eqms", station, stationName: station, measuredAt: new Date().toISOString(),
  kind: "aqi", value, meta: { state, lat: 6.43, lon: 100.27, ...meta },
});
const quake = (id, mag, lat, lon) => ({
  source: "usgs-eq", station: id, stationName: "Near Arau", measuredAt: new Date().toISOString(),
  kind: "quake", value: mag, meta: { lat, lon, depth: 10 },
});
const flood = (id, name, severity, value) => ({
  source: "infobanjir", station: id, stationName: name, measuredAt: new Date().toISOString(),
  kind: "flood", value, meta: { state: "Perlis", severity, lat: 6.43, lon: 100.27 },
});
const warning = (title, state) => ({
  source: "my-met", station: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), stationName: title, measuredAt: "2026-10-29T09:00:00Z",
  kind: "warning", value: 2, meta: { state, headingEn: "SECOND CATEGORY", textEn: `Heavy rain over ${state}`, type: "rain" },
});

const run = (input) => evaluate(sub, input.prev ?? [], input);

/** A baseline pass that settles the one-time silent-baseline (prev becomes non-empty). */
function baseline() {
  return run({ prev: [], aqi: [aqi("P1", 30)], warnings: [], quakes: [], flood: [], rainfall: [] }).next;
}

describe("AQI alerts — edge-triggered", () => {
  it("cold start with already-unhealthy air sends exactly one current-condition alert", () => {
    const a = run({ aqi: [aqi("P1", 152)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(a.fire).toHaveLength(1);
    expect(a.fire[0]).toContain("Unhealthy");
    const again = run({ prev: a.next, aqi: [aqi("P1", 158)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(again.fire).toHaveLength(0); // steady level, already alerted
  });

  it("a steady unhealthy level alerts once, then stays quiet", () => {
    const first = run({ prev: [], aqi: [aqi("P1", 101)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(first.fire).toHaveLength(1); // cold-start current-condition alert at Unhealthy
    const second = run({ prev: first.next, aqi: [aqi("P1", 120)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(second.fire).toHaveLength(0);
  });

  it("climbing into a worse band alerts again; recovery fires once; then quiet", () => {
    const p1 = run({ prev: [], aqi: [aqi("P1", 152)], warnings: [], quakes: [], flood: [], rainfall: [] });
    const p2 = run({ prev: p1.next, aqi: [aqi("P1", 210)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(p2.fire).toHaveLength(1); // improved to Very Unhealthy → one alert
    const p3 = run({ prev: p2.next, aqi: [aqi("P1", 40)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(p3.fire).toHaveLength(1); // recovery to clean band → one message
    expect(p3.fire[0]).toContain("improved");
    const p4 = run({ prev: p3.next, aqi: [aqi("P1", 45)], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(p4.fire).toHaveLength(0); // still clean → quiet
  });

  it("re-entering the alert band within the cooldown is suppressed, then allowed after it lapses", () => {
    const now = 1_800_000_000_000; // fixed epoch
    const state = { aqi: [], warnings: [], quakes: [], flood: [], rainfall: [] };
    const p1 = run({ prev: [], ...state, aqi: [aqi("P1", 120)], now }); // cold-start current-condition alert
    expect(p1.fire).toHaveLength(1);
    const p2 = run({ prev: p1.next, ...state, aqi: [aqi("P1", 60)], now }); // recovery
    expect(p2.fire).toHaveLength(1);
    const p3 = run({ prev: p2.next, ...state, aqi: [aqi("P1", 130)], now: now + 60_000 }); // re-enter within cooldown
    expect(p3.fire).toHaveLength(0);
    const p4 = run({ prev: p3.next, ...state, aqi: [aqi("P1", 55)], now: now + 61_000 }); // clear again
    expect(p4.fire).toHaveLength(0);
    const p5 = run({ prev: p4.next, ...state, aqi: [aqi("P1", 135)], now: now + 31 * 60_000 }); // cooldown lapsed
    expect(p5.fire).toHaveLength(1);
  });

  it("pickAqiStation prefers a name match, else the nearest station", () => {
    const rows = [aqi("K2", 30, "Perlis", { lat: 5.0, lon: 100.0 }), aqi("K1", 120, "Perlis", { lat: 6.43, lon: 100.27 })];
    const hit = pickAqiStation(sub, rows);
    expect(hit.value).toBe(120); // nearest to Arau
  });
});

describe("quakes — once per event, distance-scoped", () => {
  const near = () => quake("us2026x", 5.2, 6.4, 100.2); // ~10 km from Arau
  it("fires once per event id, never twice", () => {
    const prev = baseline();
    const p1 = run({ prev, aqi: [], warnings: [], quakes: [near()], flood: [], rainfall: [] });
    expect(p1.fire).toHaveLength(1);
    const p2 = run({ prev: p1.next, aqi: [], warnings: [], quakes: [near()], flood: [], rainfall: [] });
    expect(p2.fire).toHaveLength(0);
  });
  it("ignores quakes beyond 400 km and small magnitudes", () => {
    const prev = baseline();
    const far = run({ prev, aqi: [], warnings: [], quakes: [quake("f", 5.1, 0, 0)], flood: [], rainfall: [] });
    expect(far.fire).toHaveLength(0);
    const small = run({ prev, aqi: [], warnings: [], quakes: [quake("s", 4.0, 6.4, 100.2)], flood: [], rainfall: [] });
    expect(small.fire).toHaveLength(0);
  });
});

describe("flood — present-in-feed is the trigger, resets on exit", () => {
  it("alerts on appearance, stays quiet while present, re-alerts after leaving", () => {
    const prev = baseline();
    const f = () => flood("RB1", "Sungai Arau", "Alert", 3.4);
    const p1 = run({ prev, aqi: [], warnings: [], quakes: [], flood: [f()], rainfall: [] });
    expect(p1.fire).toHaveLength(1);
    const p2 = run({ prev: p1.next, aqi: [], warnings: [], quakes: [], flood: [f()], rainfall: [] });
    expect(p2.fire).toHaveLength(0); // still in feed → no repeat
    const p3 = run({ prev: p2.next, aqi: [], warnings: [], quakes: [], flood: [], rainfall: [] });
    expect(p3.fire).toHaveLength(0); // leaves feed → record reset, no alert
    const p4 = run({ prev: p3.next, aqi: [], warnings: [], quakes: [], flood: [f()], rainfall: [] });
    expect(p4.fire).toHaveLength(1); // recurrence → alerts again
  });
});

describe("MET warnings — matched by state/town", () => {
  it("matches a warning naming the watched state", () => {
    const res = run({ prev: baseline(), aqi: [], warnings: [warning("Heavy rain warning", "Perlis")], quakes: [], flood: [], rainfall: [] });
    expect(res.fire).toHaveLength(1);
  });
  it("ignores warnings for other states", () => {
    const res = run({ prev: baseline(), aqi: [], warnings: [warning("Heavy rain warning", "Kedah")], quakes: [], flood: [], rainfall: [] });
    expect(res.fire).toHaveLength(0);
  });
});

describe("quiet hours + warning identity", () => {
  it("malaysiaHour and quietActive honour MY time", () => {
    expect(malaysiaHour(Date.parse("2026-10-29T16:00:00Z"))).toBe(0); // 00:00 MY next day
    expect(quietActive(Date.parse("2026-10-29T22:00:00Z"), 23, 7)).toBe(true); // 06:00 MY is inside 23→7
    expect(quietActive(Date.parse("2026-10-29T16:00:00Z"), 23, 7)).toBe(true); // 00:00 MY
    expect(quietActive(Date.parse("2026-10-29T10:00:00Z"), 23, 7)).toBe(false); // 18:00 MY
    expect(quietActive(Date.parse("2026-10-29T10:00:00Z"), 0, 0)).toBe(false); // disabled
  });
  it("warningKey is title + issue time", () => {
    expect(warningKey(warning("A", "Perlis"))).not.toBe(warningKey(warning("B", "Perlis")));
    expect(warningKey(warning("A", "Perlis"))).toBe(warningKey({ ...warning("A", "Perlis"), value: 3 }));
  });
});
