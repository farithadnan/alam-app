import { describe, expect, it, vi, beforeEach } from "vitest";
import { app, load } from "../src/core/store.svelte.js";

/** A state-scoped summary bundle, the shape the API returns for ?state=. */
const bundle = (weather) => ({
  states: ["Perlis", "Kedah", "Johor"], allTowns: [], weather,
  stations: [], forecast: [], hourly: [], news: [], hazards: {}, ts: "2026-09-11T10:00:00Z",
});
const wx = (station, state) => ({
  source: "open-meteo", station, stationName: station, kind: "weather", value: 30, meta: { state },
});
const ok = (body) => () => Promise.resolve({ ok: true, json: async () => body });

beforeEach(() => {
  localStorage.clear();
  app.data = null; app.error = ""; app.picked = null; app.scope = "near";
  vi.unstubAllGlobals();
});

describe("the selected town always belongs to the selected state", () => {
  it("replaces a town that is outside the state (the bug that showed 'no data for this place')", async () => {
    app.state = "Perlis";
    app.town = "alor-gajah"; // a Melaka town: the first load used to adopt this
    vi.stubGlobal("fetch", vi.fn(ok(bundle([wx("arau", "Perlis"), wx("kangar", "Perlis")]))));
    await load();
    await new Promise((r) => setTimeout(r, 20)); // let the corrective refetch settle
    expect(app.town).toBe("arau");
  });

  it("keeps a town that is inside the state", async () => {
    app.state = "Perlis";
    app.town = "kangar";
    vi.stubGlobal("fetch", vi.fn(ok(bundle([wx("arau", "Perlis"), wx("kangar", "Perlis")]))));
    await load();
    await new Promise((r) => setTimeout(r, 20));
    expect(app.town).toBe("kangar");
  });

  it("adopts a town from the adopted state on a first load, not one from another state", async () => {
    app.state = ""; app.town = "";
    vi.stubGlobal("fetch", vi.fn(ok(bundle([wx("arau", "Perlis"), wx("alor-gajah", "Melaka")]))));
    await load();
    await new Promise((r) => setTimeout(r, 20));
    expect(app.state).toBe("Perlis");
    expect(app.town).toBe("arau");
  });

  it("does not loop when the town is already consistent", async () => {
    app.state = "Perlis"; app.town = "arau";
    const f = vi.fn(ok(bundle([wx("arau", "Perlis")])));
    vi.stubGlobal("fetch", f);
    await load();
    await new Promise((r) => setTimeout(r, 30));
    expect(f).toHaveBeenCalledTimes(1); // no corrective refetch
  });
});
