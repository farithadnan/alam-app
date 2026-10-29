import { describe, expect, it } from "vitest";
import { activeWarnings } from "../src/domain/warnings.js";

const w = (validTo) => ({ title: "Thunderstorms Warning", meta: { validTo } });
const now = Date.parse("2026-09-11T20:30:00Z");

describe("activeWarnings — the chip and the list agree", () => {
  it("keeps a warning that is still valid", () => {
    expect(activeWarnings([w("2026-09-11T23:00:00Z")], now)).toHaveLength(1);
  });
  it("keeps one that lapsed within the hour, so it does not vanish mid-read", () => {
    expect(activeWarnings([w("2026-09-11T20:00:00Z")], now)).toHaveLength(1);
  });
  it("drops one that lapsed long ago — the case that made the chip lie", () => {
    expect(activeWarnings([w("2026-09-11T16:00:00Z")], now)).toHaveLength(0);
  });
  it("treats a missing or unparseable validTo as still showing", () => {
    expect(activeWarnings([w(undefined), w("not-a-date")], now)).toHaveLength(2);
  });
  it("handles an empty list", () => {
    expect(activeWarnings([], now)).toEqual([]);
  });
});
