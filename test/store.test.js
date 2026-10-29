import { describe, it, expect, vi, beforeEach } from "vitest";
import { app, load } from "../src/core/store.svelte.js";

/** A summary bundle with a marker so tests can tell which response landed. */
const bundle = (marker, town, state) => ({
  states: [state],
  allTowns: [{ station: town, name: town, state }],
  weather: [{ station: town, stationName: town, kind: "weather", value: 30, meta: { state } }],
  stations: [], forecast: [], hourly: [], news: [], hazards: {},
  ts: "2026-09-11T10:00:00Z",
  marker,
});

/** fetch that resolves after `ms` — lets us force out-of-order responses. */
const fetchAfter = (ms, body, ok = true) => () =>
  new Promise((res) => setTimeout(() => res({ ok, json: async () => body }), ms));

beforeEach(() => {
  localStorage.clear();
  app.data = null;
  app.error = "";
  app.picked = null;
  app.town = "arau";
  app.state = "Perlis";
  app.scope = "near";
});

describe("store.load — request sequencing", () => {
  it("discards a slow, stale response that resolves after a newer one", async () => {
    globalThis.fetch = vi.fn(fetchAfter(60, bundle("OLD", "arau", "Perlis")));
    const slow = load();

    app.state = "Johor";
    app.town = "johor-bahru";
    globalThis.fetch = vi.fn(fetchAfter(5, bundle("NEW", "johor-bahru", "Johor")));
    const fast = load();

    await Promise.all([slow, fast]);
    expect(app.data.marker).toBe("NEW"); // the late OLD payload must not win
    expect(app.loading).toBe(false);
  });

  it("adopts the first town when the payload does not contain the requested one", async () => {
    app.state = "Johor";
    app.town = "arau"; // stale town from the previous state
    globalThis.fetch = vi.fn(fetchAfter(1, bundle("NEW", "johor-bahru", "Johor")));
    await load();
    expect(app.town).toBe("johor-bahru");
  });

  it("keeps the current town when the payload does contain it", async () => {
    app.state = "Perlis";
    app.town = "arau";
    globalThis.fetch = vi.fn(fetchAfter(1, bundle("OK", "arau", "Perlis")));
    await load();
    expect(app.town).toBe("arau");
    expect(app.error).toBe("");
  });

  it("records an error for a failed latest request", async () => {
    globalThis.fetch = vi.fn(fetchAfter(1, {}, false));
    await load();
    expect(app.error).toBeTruthy();
    expect(app.loading).toBe(false);
  });

  it("does not let a stale failure clobber a newer success", async () => {
    globalThis.fetch = vi.fn(fetchAfter(60, {}, false)); // slow failure
    const slow = load();
    globalThis.fetch = vi.fn(fetchAfter(5, bundle("NEW", "arau", "Perlis"))); // fast success
    const fast = load();
    await Promise.all([slow, fast]);
    expect(app.error).toBe("");
    expect(app.data.marker).toBe("NEW");
  });
});

describe("store.load — request parameters", () => {
  it("scopes state + town, and includes an inspected town via ?towns=", async () => {
    const urls = [];
    globalThis.fetch = vi.fn(async (url) => {
      urls.push(url);
      return { ok: true, json: async () => bundle("OK", "arau", "Perlis") };
    });
    app.state = "Perlis";
    app.town = "arau";
    app.picked = "kangar";
    await load();
    expect(urls[0]).toContain("state=Perlis");
    expect(urls[0]).toContain("town=arau");
    expect(urls[0]).toContain("towns=kangar");
  });

  it("omits the state filter in Malaysia scope but still sends the town", async () => {
    const urls = [];
    globalThis.fetch = vi.fn(async (url) => {
      urls.push(url);
      return { ok: true, json: async () => bundle("OK", "arau", "Perlis") };
    });
    app.scope = "malaysia";
    await load();
    expect(urls[0]).not.toContain("state=");
    expect(urls[0]).toContain("town=arau");
  });
});
