import { describe, expect, it, vi } from "vitest";
import { createLoader } from "../src/core/async.js";

const after = (ms, value, fail = false) => () =>
  new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error("boom")) : res(value)), ms));

describe("createLoader — latest wins", () => {
  it("applies a single successful run", async () => {
    const load = createLoader();
    const onValue = vi.fn();
    await load(after(1, "A"), { onValue });
    expect(onValue).toHaveBeenCalledWith("A");
  });

  it("discards a slow earlier run when a newer one lands first", async () => {
    const load = createLoader();
    const onValue = vi.fn();
    const slow = load(after(50, "OLD"), { onValue });
    const fast = load(after(5, "NEW"), { onValue });
    await Promise.all([slow, fast]);
    expect(onValue).toHaveBeenCalledTimes(1);
    expect(onValue).toHaveBeenCalledWith("NEW");
  });

  it("does not let a superseded failure surface an error", async () => {
    const load = createLoader();
    const onError = vi.fn();
    const onValue = vi.fn();
    const failing = load(after(50, null, true), { onError });
    const ok = load(after(5, "NEW"), { onValue, onError });
    await Promise.all([failing, ok]);
    expect(onError).not.toHaveBeenCalled();
    expect(onValue).toHaveBeenCalledWith("NEW");
  });

  it("skips onSettled for a superseded run so a spinner is not cleared early", async () => {
    const load = createLoader();
    const settled = vi.fn();
    const slow = load(after(50, "OLD"), { onSettled: settled });
    const fast = load(after(5, "NEW"), { onSettled: settled });
    await Promise.all([slow, fast]);
    expect(settled).toHaveBeenCalledTimes(1); // only the newest run clears loading
  });

  it("reports an error for the latest failing run", async () => {
    const load = createLoader();
    const onError = vi.fn();
    await load(after(1, null, true), { onError });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
