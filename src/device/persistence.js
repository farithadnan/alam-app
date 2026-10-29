/**
 * Minimal storage backend for the device store.
 *
 * Two backends, one interface: IndexedDB when available (browser dev + Android APK
 * WebView — persists on-device, surviving restarts) and an in-memory Map otherwise
 * (jsdom tests, node, exotic WebViews). Rows are keyed `store:key` and stored
 * per-record, so ingesting a fresh batch only rewrites the records that actually
 * changed — no whole-database snapshot on every refresh.
 */

class MemoryBackend {
  constructor() {
    this.map = new Map();
  }

  async getAll() {
    return [...this.map.values()].map((v) => ({ key: v.key, value: v.value }));
  }

  async put(key, value) {
    this.map.set(key, { key, value });
  }

  async delete(prefix) {
    for (const k of [...this.map.keys()]) {
      if (k.startsWith(prefix)) this.map.delete(k);
    }
  }
}

function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("alam-device", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class IdbBackend {
  constructor() {
    this.dbP = null;
  }

  async db() {
    if (!this.dbP) this.dbP = openIdb();
    return this.dbP;
  }

  async getAll() {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const out = [];
      const t = db.transaction("kv", "readonly");
      const req = t.objectStore("kv").openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          out.push({ key: cur.key, value: cur.value });
          cur.continue();
        } else resolve(out);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async put(key, value) {
    const db = await this.db();
    return await new Promise(
      /** @type {(res: (v?: void) => void, rej: (e?: unknown) => void) => void} */
      (resolve, reject) => {
        const t = db.transaction("kv", "readwrite");
        t.objectStore("kv").put(value, key);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      },
    );
  }

  async delete(prefix) {
    const db = await this.db();
    return await new Promise(
      /** @type {(res: (v?: void) => void, rej: (e?: unknown) => void) => void} */
      (resolve, reject) => {
        const t = db.transaction("kv", "readwrite");
        const store = t.objectStore("kv");
        const keys = [];
        const req = store.openCursor();
        req.onsuccess = () => {
          const cur = req.result;
          if (cur) {
            if (String(cur.key).startsWith(prefix)) {
              keys.push(cur.key);
              store.delete(cur.key);
            }
            cur.continue();
          } else resolve();
        };
        req.onerror = () => reject(req.error);
      },
    );
  }
}

export function createBackend() {
  if (typeof indexedDB === "undefined") return new MemoryBackend();
  return new IdbBackend();
}

/** Backend used when IndexedDB is unavailable (tests, node, exotic WebViews). */
export { MemoryBackend };
