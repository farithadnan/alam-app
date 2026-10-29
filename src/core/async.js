/**
 * Latest-wins async loader.
 *
 * Every run supersedes the previous one, so a slower EARLIER request can never
 * overwrite the result of a newer one. This is the bug class that shipped twice
 * (out-of-order summary responses, stale town on state change) — now there is
 * exactly one implementation instead of four hand-rolled variants.
 *
 *   const load = createLoader();
 *   await load(() => fetchThing(), { onValue, onError, onSettled });
 *
 * `onValue` / `onError` / `onSettled` are only invoked when the run is still the
 * newest one, so callers cannot accidentally write superseded state.
 */
export function createLoader() {
  let seq = 0;
  return async function run(fn, handlers = {}) {
    const id = ++seq;
    const { onValue, onError, onSettled } = handlers;
    try {
      const value = await fn();
      if (id !== seq) return undefined; // superseded while in flight
      onValue?.(value);
      return value;
    } catch (error) {
      if (id !== seq) return undefined;
      onError?.(error);
      return undefined;
    } finally {
      if (id === seq) onSettled?.();
    }
  };
}
