/**
 * Sync engine — the device analogue of the server-side ingest runner.
 *
 * For each adapter, honours its own cadence via the persisted source_state, polls
 * only what is actually stale, ingests into the device store, and prunes old rows
 * once per cycle. Run it on app open and periodically; it is concurrency-guarded so
 * a background wake cannot overlap an in-flight refresh.
 */
import { buildAdapters, cadence } from "./adapters/index.js";
import { deviceStore } from "./store.js";
import { DATA_KEEP_DAYS } from "./static/constants.js";

let current = null;

export function isSyncing() {
  return current !== null;
}

export async function runSync() {
  if (current) return current;
  current = (async () => {
    const store = deviceStore;
    await store.init();
    const adapters = buildAdapters();
    const results = [];
    for (const adapter of adapters) {
      const id = adapter.id;
      const interval = cadence(id);
      let stale = true;
      try {
        stale = await store.isStale(id, interval);
      } catch {
        /* treat as stale on failure */
      }
      if (!stale) {
        results.push({ id, stale: false, inserted: 0 });
        continue;
      }
      try {
        const rows = await adapter.poll();
        const inserted = await store.ingest(rows);
        await store.recordPoll(id, inserted);
        results.push({ id, stale: true, inserted, rows: rows.length });
      } catch (err) {
        await store.recordPoll(id, 0, err instanceof Error ? err.message : String(err));
        results.push({ id, stale: true, error: err instanceof Error ? err.message : String(err) });
      }
    }
    // Prune ONCE per cycle (not per adapter) so storage stays bounded.
    await store.pruneOlderThan(DATA_KEEP_DAYS);
    return results;
  })();
  try {
    return await current;
  } finally {
    current = null;
  }
}
