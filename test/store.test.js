import { describe, it, expect, vi, beforeEach } from "vitest";
import { app, load } from "../src/core/store.svelte.js";

/** The device-local API surface, mocked so tests control responses + timing. */
const apiMock = vi.hoisted(() => ({ urls: [], j: vi.fn() }));
vi.mock("../src/core/api.js", () => ({ j: apiMock.j }));

/** A summary bundle with a marker so tests can tell which response landed. */
const bundle = (marker, town, state) => ({
  states: [state],
  allTowns: [{ station: town, name: town, state }],
  weather: [{ station: town, stationName: town, kind: "weather", value: 30, meta: { state } }],
  stations: [], forecast: [], hourly: [], news: [], hazards: {},
  ts: "2026-09-11T10:00:00Z",
  marker,
});

/** j() that resolves after `ms` — lets us force out-of-order responses. */
const after = (ms, body) => new Promise((res) => setTimeout(() => res(body), ms));

beforeEach(() => {
  localStorage.clear();
  apiMock.urls.length = 0;
  apiMock.j.mockReset();
  apiMock.j.mockImplementation(async (url) => {
    apiMock.urls.push(url);
    return bundle("OK", "arau", "Perlis");
  });
  app.data = null;
  app.error = "";
  app.picked = null;
  app.town = "arau";
  app.state = "Perlis";
  app.scope = "near";
});

describe("store.load — request sequencing", () => {
  it("discards a slow, stale response that resolves after a newer one", async () => {
    apiMock.j.mockImplementationOnce(() => after(60, bundle("OLD", "arau", "Perlis")));
    const slow = load();

    app.state = "Johor";
    app.town = "johor-bahru";
    apiMock.j.mockImplementation(async () => after(5, bundle("NEW", "johor-bahru", "Johor")));
    const fast = load();

    await Promise.all([slow, fast]);
    expect(app.data.marker).toBe("NEW"); // the late OLD payload must not win
    expect(app.loading).toBe(false);
  });

  it("adopts the first town when the payload does not contain the requested one", async () => {
    app.state = "Johor";
    app.town = "arau"; // stale town from the previous state
    apiMock.j.mockImplementation(async () => bundle("NEW", "johor-bahru", "Johor"));
    await load();
    expect(app.town).toBe("johor-bahru");
  });

  it("keeps the current town when the payload does contain it", async () => {
    app.state = "Perlis";
    app.town = "arau";
    apiMock.j.mockImplementation(async () => bundle("OK", "arau", "Perlis"));
    await load();
    expect(app.town).toBe("arau");
    expect(app.error).toBe("");
  });

  it("records an error for a failed latest request", async () => {
    apiMock.j.mockImplementation(async () => {
      throw new Error("HTTP 500");
    });
    await load();
    expect(app.error).toBeTruthy();
    expect(app.loading).toBe(false);
  });

  it("does not let a stale failure clobber a newer success", async () => {
    apiMock.j.mockImplementationOnce(() => after(60, "boom").then(() => {
      throw new Error("HTTP 500");
    }));
    const slow = load();
    apiMock.j.mockImplementation(async () => after(5, bundle("NEW", "arau", "Perlis")));
    const fast = load();
    await Promise.all([slow, fast]);
    expect(app.error).toBe("");
    expect(app.data.marker).toBe("NEW");
  });
});

describe("store.load — request parameters", () => {
  it("scopes state + town, and includes an inspected town via ?towns=", async () => {
    app.state = "Perlis";
    app.town = "arau";
    app.picked = "kangar";
    await load();
    expect(apiMock.urls[0]).toContain("state=Perlis");
    expect(apiMock.urls[0]).toContain("town=arau");
    expect(apiMock.urls[0]).toContain("towns=kangar");
  });

  it("omits the state filter in Malaysia scope but still sends the town", async () => {
    app.scope = "malaysia";
    await load();
    expect(apiMock.urls[0]).not.toContain("state=");
    expect(apiMock.urls[0]).toContain("town=arau");
  });
});
