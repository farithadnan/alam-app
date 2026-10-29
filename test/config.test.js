import { describe, expect, it } from "vitest";
import { SITE } from "../src/core/config.js";

describe("SITE config — one source for identity", () => {
  it("resolves a usable share URL and never ends with a slash", () => {
    expect(SITE.url).toBeTruthy();
    expect(SITE.url.endsWith("/")).toBe(false);
  });
  it("exposes the name and contact address once", () => {
    expect(SITE.name).toBe("OhAlam");
    expect(SITE.email).toContain("@");
  });
  it("defaults the map key rather than leaving it undefined", () => {
    expect(typeof SITE.cartoKey).toBe("string");
  });
});
