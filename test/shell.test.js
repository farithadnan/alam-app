import { describe, expect, it, vi, afterEach } from "vitest";
import { NAV, SCOPES } from "../src/core/shell.js";
import { locate } from "../src/core/location.js";

afterEach(() => vi.unstubAllGlobals());

describe("shell config", () => {
  it("has a nav entry per view, home first — Hazards hosts Flood + Earthquakes", () => {
    expect(NAV[0].view).toBe("home");
    expect(NAV.map((n) => n.view)).toEqual(["home", "weather", "air", "hazards", "news"]);
  });
  it("has the three scopes in order, each with an i18n key", () => {
    expect(SCOPES.map((s) => s.value)).toEqual(["near", "state", "malaysia"]);
    expect(SCOPES.every((s) => s.key.startsWith("scope"))).toBe(true);
  });
});

describe("locate", () => {
  it("resolves lat/lon from the geolocation API", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok) => ok({ coords: { latitude: 6.44, longitude: 100.19 } }),
      },
    });
    await expect(locate()).resolves.toEqual({ lat: 6.44, lon: 100.19 });
  });

  it("rejects when the user denies or it times out", async () => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: (_ok, fail) => fail(new Error("denied")) },
    });
    await expect(locate()).rejects.toThrow("denied");
  });

  it("rejects when geolocation is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(locate()).rejects.toThrow(/unsupported/);
  });
});
