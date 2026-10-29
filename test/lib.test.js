import { describe, expect, it } from "vitest";
import { atTown, timeAgo, groupBy, numColor, regionOf } from "../src/domain/flags.js";
import { wmo } from "../src/domain/weather-codes.js";
import { mapPopup } from "../src/domain/popup.js";

describe("atTown — matches an observation to the selected town", () => {
  it("matches on either name containing the other", () => {
    expect(atTown({ stationName: "Arau, PERLIS" }, "Arau", "arau")).toBe(true);
    expect(atTown({ stationName: "Batu Pahat, JOHOR" }, "Batu Pahat", "batu-pahat")).toBe(true);
  });
  it("matches on the exact station slug even when names differ", () => {
    expect(atTown({ station: "CA01R", stationName: "Kangar, PERLIS" }, "Somewhere Else", "CA01R")).toBe(true);
  });
  it("does not match an unrelated town (this broke the AQI hero before)", () => {
    expect(atTown({ stationName: "Kangar, PERLIS" }, "Batu Pahat", "batu-pahat")).toBe(false);
    expect(atTown({ stationName: "Kangar, PERLIS" }, "", "batu-pahat")).toBe(false);
  });
});

describe("mapPopup — the single map popup builder", () => {
  it("renders every provided line and skips empty ones", () => {
    const html = mapPopup({ title: "Arau", value: "28°", valueColor: "#b3491a", flag: "Drizzle", sub: "Feels 32°" });
    expect(html).toContain("Arau");
    expect(html).toContain("28°");
    expect(html).toContain("#b3491a"); // colour applied to the value line
    expect(html).toContain("Drizzle");
    expect(html).toContain("Feels 32°");
    expect(html.match(/<div/g)).toHaveLength(4); // no empty placeholder divs
  });
  it("returns an empty string when given nothing", () => {
    expect(mapPopup({})).toBe("");
  });
});

describe("flags helpers", () => {
  it("groups rows by a key", () => {
    const g = groupBy([{ s: "A" }, { s: "B" }, { s: "A" }], (r) => r.s);
    expect(g.map((x) => x.key)).toEqual(["A", "B"]);
    expect(g[0].items).toHaveLength(2);
  });
  it("falls back to the raw label when a band colour is unknown", () => {
    expect(numColor("Good")).toBe("#2e7d32");
    expect(numColor("#123456")).toBe("#123456");
  });
  it("maps a WMO code to icon + label, defaulting for unknown codes", () => {
    expect(wmo("3")[1]).toBe("Overcast");
    expect(wmo("9999")[1]).toBeTruthy();
  });
  it("derives a region from a USGS place string", () => {
    expect(regionOf("83 km E of Lospalos, Timor Leste")).toBeTruthy();
  });
  it("formats a relative time", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000).toISOString())).toMatch(/3h/);
  });
});
