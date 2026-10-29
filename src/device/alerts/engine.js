/**
 * Edge-triggered alert state machine — the device port of alam-api/src/bot/engine.ts.
 * Decisions stay pure: given the device's settings (settings = "subscription"), its
 * persisted alert_state, and the latest observations, it returns the notification
 * texts to raise and the state to persist. A steady level alerts exactly once; only
 * crossings fire.
 *
 * Cold start (no persisted state): settles a silent baseline, EXCEPT air already at
 * Unhealthy or worse, which sends one current-condition alert.
 */

import { aqiBand, bandIndex, ALERT_BAND_INDEX, ALERT_COOLDOWN_MS, QUAKE_MIN_MAG, QUAKE_MAX_KM, FLOOD_MAX_KM } from "../static/bands.js";
import { MALAYSIA_LOCALITIES } from "../static/localities.js";
import { aqiMsg, aqiRecoveredMsg, warningMsg, quakeMsg, floodMsg, rainMsg } from "./messages.js";

export function warningKey(w) {
  return `${w.station}|${w.measuredAt}`;
}

const cooldownOk = (lastIso, now, cd) => !lastIso || now - Date.parse(lastIso) >= cd;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** The DOE station serving a place: name match first, then nearest to the town. */
export function pickAqiStation(sub, aqi) {
  const rows = aqi.filter((r) => r.meta?.state === sub.state);
  if (!rows.length) return null;
  const town = MALAYSIA_LOCALITIES.find((l) => l.slug === sub.townSlug);
  const townName = (town?.name ?? "").toLowerCase();
  const nameHit = rows.find((r) => {
    const n = (r.stationName ?? "").toLowerCase();
    return townName && (n.includes(townName) || townName.includes(n));
  });
  if (nameHit) return nameHit;
  if (town) {
    let best = rows[0];
    let bestKm = Infinity;
    for (const r of rows) {
      const lat = r.meta?.lat;
      const lon = r.meta?.lon;
      if (typeof lat === "number" && typeof lon === "number") {
        const km = haversineKm(town.lat, town.lon, lat, lon);
        if (km < bestKm) {
          bestKm = km;
          best = r;
        }
      }
    }
    return best;
  }
  return rows[0];
}

function warningHits(sub, warnings) {
  const town = MALAYSIA_LOCALITIES.find((l) => l.slug === sub.townSlug);
  const words = [sub.state, town?.name ?? sub.place].map((w) => w.toLowerCase()).filter((w) => w.length > 0);
  return warnings.filter((w) => {
    if (w.kind !== "warning") return false;
    const hay = `${w.stationName} ${w.meta?.headingEn ?? ""} ${w.meta?.textEn ?? ""} ${w.meta?.titleBm ?? ""}`.toLowerCase();
    return words.some((word) => hay.includes(word));
  });
}

export function evaluate(sub, prev, input) {
  const out = { fire: [], next: [] };
  const now = input.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const cd = input.cooldownMs ?? ALERT_COOLDOWN_MS;
  const coldStart = prev.length === 0;
  const state = new Map(prev.map((r) => [`${r.kind}:${r.key}`, r]));
  const enabled = (t) => sub.alertTypes.includes(t);
  const record = (row) => {
    out.next.push(row);
    state.set(`${row.kind}:${row.key}`, row);
  };

  // AQI — the headline alert type.
  if (enabled("aqi")) {
    const st = pickAqiStation(sub, input.aqi);
    if (st) {
      const key = st.station;
      const band = aqiBand(st.value).label;
      const curIdx = bandIndex(band);
      const prior = state.get(`aqi:${key}`);
      const prevIdx = prior?.lastBand != null ? bandIndex(prior.lastBand) : -1;
      const fresh = {
        chatId: 0, kind: "aqi", key,
        lastBand: band, lastValue: st.value,
        lastAlertAt: prior?.lastAlertAt ?? null,
        lastRecoveryAt: prior?.lastRecoveryAt ?? null,
      };
      if (curIdx >= ALERT_BAND_INDEX) {
        if (coldStart) {
          out.fire.push(aqiMsg({ value: st.value, band, place: sub.place, advice: aqiBand(st.value).advice }));
          fresh.lastAlertAt = nowIso;
        } else {
          const worsenedFromClean = prior == null || prevIdx < ALERT_BAND_INDEX;
          const climbedWithin = !worsenedFromClean && curIdx > prevIdx;
          if (prior == null || climbedWithin || (worsenedFromClean && cooldownOk(fresh.lastAlertAt, now, cd))) {
            out.fire.push(aqiMsg({ value: st.value, band, place: sub.place, advice: aqiBand(st.value).advice }));
            fresh.lastAlertAt = nowIso;
          }
        }
        record(fresh);
      } else {
        const recovering = !coldStart && prior != null && prevIdx >= ALERT_BAND_INDEX;
        if (recovering && cooldownOk(fresh.lastRecoveryAt, now, cd)) {
          out.fire.push(aqiRecoveredMsg({ value: st.value, band }));
          fresh.lastRecoveryAt = nowIso;
        }
        record(fresh);
      }
    }
  }

  // Warnings — one per distinct issuance for the place.
  if (enabled("warning")) {
    for (const w of warningHits(sub, input.warnings)) {
      const key = warningKey(w);
      if (state.get(`warning:${key}`)?.lastAlertAt) continue;
      const row = { chatId: 0, kind: "warning", key, lastBand: null, lastValue: w.value, lastAlertAt: nowIso, lastRecoveryAt: null };
      if (!coldStart) out.fire.push(warningMsg({ title: w.stationName, place: sub.place, issuedAt: w.measuredAt }));
      record(row);
    }
  }

  // Quakes — significant and near the place, once per event.
  if (enabled("quake")) {
    const town = MALAYSIA_LOCALITIES.find((l) => l.slug === sub.townSlug);
    if (town) {
      for (const q of input.quakes) {
        if (q.kind !== "quake" || q.value < QUAKE_MIN_MAG) continue;
        const key = q.station;
        if (state.get(`quake:${key}`)?.lastAlertAt) continue;
        const lat = q.meta?.lat;
        const lon = q.meta?.lon;
        if (typeof lat !== "number" || typeof lon !== "number") continue;
        if (haversineKm(town.lat, town.lon, lat, lon) > QUAKE_MAX_KM) continue;
        const row = { chatId: 0, kind: "quake", key, lastBand: null, lastValue: q.value, lastAlertAt: nowIso, lastRecoveryAt: null };
        if (!coldStart) out.fire.push(quakeMsg({ magnitude: q.value, place: q.stationName, depthKm: q.meta?.depth ?? null, at: q.measuredAt }));
        record(row);
      }
    }
  }

  // Infobanjir flood + heavy-rain: present-in-feed IS the trigger; reset when a
  // station leaves the feed so a recurrence alerts again.
  if (enabled("flood")) {
    const evaluateFeed = (kind, rows, build) => {
      const town = MALAYSIA_LOCALITIES.find((l) => l.slug === sub.townSlug);
      const scoped = rows.filter((r) => {
        if (r.meta?.state !== sub.state) return false;
        const lat = r.meta?.lat;
        const lon = r.meta?.lon;
        if (town && typeof lat === "number" && typeof lon === "number") {
          return haversineKm(town.lat, town.lon, lat, lon) <= FLOOD_MAX_KM;
        }
        return true;
      });
      const current = new Set(scoped.map((r) => r.station));
      for (const row of scoped) {
        const key = row.station;
        const prior = state.get(`${kind}:${key}`);
        const next = { chatId: 0, kind, key, lastBand: null, lastValue: row.value, lastAlertAt: prior?.lastAlertAt ?? null, lastRecoveryAt: null };
        if (!prior?.lastAlertAt) {
          if (!coldStart) out.fire.push(build(row));
          next.lastAlertAt = nowIso;
        }
        record(next);
      }
      for (const prior of prev) {
        if (prior.kind !== kind) continue;
        if (!current.has(prior.key)) {
          record({ chatId: 0, kind, key: prior.key, lastBand: null, lastValue: prior.lastValue, lastAlertAt: null, lastRecoveryAt: null });
        }
      }
    };
    evaluateFeed("flood", input.flood, (r) =>
      floodMsg({ place: sub.place, station: r.stationName, district: r.meta?.district ?? null, level: r.value, severity: String(r.meta?.severity ?? ""), trend: r.meta?.trend ?? null }));
    evaluateFeed("rainfall", input.rainfall, (r) =>
      rainMsg({ place: sub.place, station: r.stationName, district: r.meta?.district ?? null, mmHour: r.value, severity: String(r.meta?.severity ?? "") }));
  }

  return out;
}
