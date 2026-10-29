import { describe, expect, it, vi, beforeEach } from "vitest";
import { app, load } from "../src/core/store.svelte.js";

/** The device-local API surface, mocked so tests control responses. */
const apiMock = vi.hoisted(() => ({ j: vi.fn() }));
vi.mock("../src/core/api.js", () => ({ j: apiMock.j }));

/** A state-scoped summary bundle, the shape the local API returns for ?state=. */
const bundle = (weather) => ({
  states: ["Perlis", "Kedah", "Johor"], allTowns: [], weather,
  stations: [], forecast: [], hourly: [], news: [], hazards: {}, ts: "2026-09-11T10:00:00Z",
});
const wx = (station, state) => ({
  source: "open-meteo", station, stationName: station, kind: "weather", value: 30, meta: { state },
});

beforeEach(() => {
  localStorage.clear();
  app.data = null; app.error = ""; app.picked = null; app.scope = "near";
  apiMock.j.mockReset();
  apiMock.j.mockResolvedValue(bundle([wx("arau", "Perlis")]));
});

describe("the selected town always belongs to the selected state", () => {
  it("replaces a town that is outside the state (the bug that showed 'no data for this place')", async () => {
    app.state = "Perlis";
    app.town = "alor-gajah"; // a Melaka town: the first load used to adopt this
    apiMock.j.mockResolvedValue(bundle([wx("arau", "Perlis"), wx("kangar", "Perlis")]));
    await load();
    await new Promise((r) => setTimeout(r, 20)); // let the corrective refetch settle
    expect(app.town).toBe("arau");
  });

  it("keeps a town that is inside the state", async () => {
    app.state = "Perlis";
    app.town = "kangar";
    apiMock.j.mockResolvedValue(bundle([wx("arau", "Perlis"), wx("kangar", "Perlis")]));
    await load();
    await new Promise((r) => setTimeout(r, 20));
    expect(app.town).toBe("kangar");
  });

  it("adopts a town from the adopted state on a first load, not one from another state", async () => {
    app.state = ""; app.town = "";
    apiMock.j.mockResolvedValue(bundle([wx("arau", "Perlis"), wx("alor-gajah", "Melaka")]));
    await load();
    await new Promise((r) => setTimeout(r, 20));
    expect(app.state).toBe("Perlis");
    expect(app.town).toBe("arau");
  });

  it("does not loop when the town is already consistent", async () => {
    app.state = "Perlis"; app.town = "arau";
    apiMock.j.mockReset();
    const f = apiMock.j.mockResolvedValue(bundle([wx("arau", "Perlis")]));
    await load();
    await new Promise((r) => setTimeout(r, 30));
    expect(f).toHaveBeenCalledTimes(1); // no corrective refetch
  });
});
