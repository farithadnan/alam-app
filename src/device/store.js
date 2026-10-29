/**
 * DeviceStore — the on-device SQLite equivalent. Same query surface as the server
 * Store (observations, source_state, town_districts), backed by a durable KV
 * persistence layer. Queries mirror alam-api/src/store/queries.js semantics:
 *
 *   latestBySource  — latest reading per (station, kind), NO forecast/hourly
 *   latestByKind    — most recent rows of a kind (quakes, warnings, news…)
 *   history / forecast(+For) / hourly(+For) / metForecast / hazeFor / stations
 *   ingest / pruneOlderThan / sourceState / recordPoll / isStale / townDistrict
 *
 * The row contract is the Observation shape from alam-api/src/core/types.ts.
 */

import { createBackend } from "./persistence.js";
import { DATA_KEEP_DAYS, MAX_ROWS } from "./static/constants.js";

const SEP = "\u0001";
const rowKey = (source, station, measuredAt, kind) => `${source}${SEP}${station}${SEP}${measuredAt}${SEP}${kind}`;
const latestKey = (source, station, kind) => `${source}|${station}|${kind}`;
const OBSERVED = new Set(["aqi", "weather", "quake", "climate", "warning", "news", "haze", "flood", "rainfall"]);

const strip = (v) => (v == null ? "" : String(v));

/** The only cedula of the server that is hand-checksummed: meta ↔ JSON. */
function normalizeRow(r) {
  return {
    source: strip(r.source),
    station: strip(r.station),
    stationName: strip(r.stationName ?? r.station_name),
    measuredAt: strip(r.measuredAt ?? r.measured_at),
    kind: strip(r.kind),
    value: Number(r.value) || 0,
    meta: r.meta == null ? null : (typeof r.meta === "string" ? JSON.parse(r.meta) : r.meta),
  };
}

export class DeviceStore {
  constructor(backend = createBackend()) {
    this.backend = backend;
    this.ready = null;
    this.rows = [];
    this.latest = new Map(); // latestKey => row (observed kinds only)
    this.sourceStates = new Map(); // adapterId => { lastPolledAt, lastOkAt, lastError, lastRows }
    this.townDistricts = new Map(); // town_slug => district_name
  }

  init() {
    if (this.ready) return this.ready;
    this.ready = this.#load();
    return this.ready;
  }

  async #load() {
    const data = await this.backend.getAll();
    for (const { key, value } of data) {
      if (key.startsWith("obs:")) {
        const row = normalizeRow(value);
        row._key = key.slice(4);
        this.rows.push(row);
        if (OBSERVED.has(row.kind)) this.#bumpLatest(row);
      } else if (key.startsWith("src:")) {
        this.sourceStates.set(key.slice(4), value);
      } else if (key.startsWith("td:")) {
        this.townDistricts.set(key.slice(3), value);
      }
    }
    // Bound total rows so storage stays sane on a phone.
    if (this.rows.length > MAX_ROWS) this.#trimRows(this.rows.length - MAX_ROWS);
  }

  #bumpLatest(row) {
    const k = latestKey(row.source, row.station, row.kind);
    const cur = this.latest.get(k);
    if (!cur || row.measuredAt >= cur.measuredAt) this.latest.set(k, row);
  }

  async #trimRows(extra) {
    this.rows.sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : 0));
    const drop = this.rows.splice(0, extra).map((r) => this.backend.delete("obs:" + r._key));
    await Promise.all(drop);
  }

  /** Idempotent upsert keyed on (source, station, measured_at, kind). Returns rows actually inserted. */
  async ingest(rows) {
    await this.init();
    const seen = new Set(this.rows.map((r) => r._key));
    let inserted = 0;
    for (const raw of rows) {
      const row = normalizeRow(raw);
      row._key = rowKey(row.source, row.station, row.measuredAt, row.kind);
      if (seen.has(row._key)) continue;
      seen.add(row._key);
      this.rows.push(row);
      if (OBSERVED.has(row.kind)) this.#bumpLatest(row);
      await this.backend.put("obs:" + row._key, row);
      inserted++;
    }
    if (this.rows.length > MAX_ROWS) await this.#trimRows(this.rows.length - MAX_ROWS);
    return inserted;
  }

  /** Latest reading per (station, kind) for a source — NO forecast/hourly. */
  async latestBySource(source) {
    await this.init();
    return [...this.latest.entries()]
      .filter(([k, r]) => k.startsWith(`${source}|`) )
      .map(([, r]) => r)
      .sort((a, b) => (a.station < b.station ? -1 : a.station > b.station ? 1 : a.kind.localeCompare(b.kind)));
  }

  async latestByKind(kind, limit = 50) {
    await this.init();
    return this.rows
      .filter((r) => r.kind === kind)
      .sort((a, b) => (a.measuredAt < b.measuredAt ? 1 : a.measuredAt > b.measuredAt ? -1 : 0))
      .slice(0, limit);
  }

  async history(source, station, since) {
    await this.init();
    return this.rows
      .filter((r) => r.source === source && r.station === station && r.measuredAt >= since)
      .sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : 1));
  }

  async stations() {
    await this.init();
    const seen = new Set();
    const out = [];
    for (const r of this.rows) {
      const k = `${r.source}|${r.station}|${r.kind}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ source: r.source, station: r.station, kind: r.kind });
    }
    return out;
  }

  async forecast(source, stations) {
    await this.init();
    return this.#kindFor("forecast", source, stations);
  }

  async hourly(source, stations) {
    await this.init();
    return this.#kindFor("hourly", source, stations);
  }

  #kindFor(kind, source, stations) {
    const wanted = stations && stations.length ? new Set(stations) : null;
    return this.rows
      .filter((r) => r.kind === kind && r.source === source && (!wanted || wanted.has(r.station)))
      .sort((a, b) => (a.station < b.station ? -1 : a.station > b.station ? 1 : a.measuredAt < b.measuredAt ? -1 : 1));
  }

  async metForecast() {
    await this.init();
    return this.rows.filter((r) => r.kind === "metfc").sort((a, b) => (a.station < b.station ? -1 : a.station > b.station ? 1 : a.measuredAt < b.measuredAt ? -1 : 1));
  }

  async hazeFor(station, limit = 7) {
    await this.init();
    return this.rows
      .filter((r) => r.kind === "haze" && r.station === station)
      .sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : 1))
      .slice(0, limit);
  }

  async pruneOlderThan(days = DATA_KEEP_DAYS) {
    await this.init();
    const cutoff = new Date(Date.now() + 8 * 3_600_000 - days * 86_400_000).toISOString().slice(0, 19);
    const keep = [];
    let removed = 0;
    const toDel = [];
    for (const row of this.rows) {
      if (row.measuredAt < cutoff) {
        removed++;
        toDel.push(row._key);
      } else keep.push(row);
    }
    if (removed) {
      this.rows = keep;
      await this.backend.delete("obs:");
      for (const row of keep) await this.backend.put("obs:" + row._key, row);
    }
    return removed;
  }

  async sourceState(adapterId) {
    await this.init();
    return this.sourceStates.get(adapterId) ?? { lastPolledAt: null, lastOkAt: null, lastError: null, lastRows: 0 };
  }

  async isStale(adapterId, intervalMs, now = Date.now()) {
    const st = await this.sourceState(adapterId);
    if (!st.lastPolledAt) return true;
    const at = Date.parse(st.lastPolledAt);
    return !Number.isFinite(at) || now - at >= intervalMs;
  }

  async recordPoll(adapterId, rows, error) {
    await this.init();
    const at = new Date().toISOString();
    const st = { lastPolledAt: at, lastOkAt: error ? null : at, lastError: error ?? null, lastRows: rows };
    this.sourceStates.set(adapterId, st);
    await this.backend.put("src:" + adapterId, st);
  }

  async townDistrict(slug) {
    await this.init();
    return this.townDistricts.get(slug) ?? null;
  }

  /** Clear everything (test helper; also usable as a "factory reset"). */
  async reset() {
    this.rows = [];
    this.latest.clear();
    this.sourceStates.clear();
    this.townDistricts.clear();
    await this.backend.delete("obs:");
    await this.backend.delete("src:");
    await this.backend.delete("td:");
    this.ready = null;
  }

  /** A small read-only view of what is stored (data-source status screen). */
  async snapshot() {
    await this.init();
    const perSource = new Map();
    for (const r of this.rows) {
      const s = perSource.get(r.source) ?? { source: r.source, rows: 0, lastAt: "" };
      s.rows++;
      if (r.measuredAt > s.lastAt) s.lastAt = r.measuredAt;
      perSource.set(r.source, s);
    }
    return {
      rows: this.rows.length,
      sources: [...perSource.values()].sort((a, b) => a.source.localeCompare(b.source)),
      polled: [...this.sourceStates.entries()].map(([id, st]) => ({ id, ...st })),
    };
  }
}

/** Ready-to-use singleton with lazy init. */
export const deviceStore = new DeviceStore();
