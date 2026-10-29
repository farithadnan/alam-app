/**
 * Quiet hours + device alert settings.
 *
 * Settings are deliberately minimal and local: town/state/place (kept in step with
 * the app's saved location), enabled alert types, and a quiet window in Malaysia
 * local time (inclusive start, exclusive end; equal start/end = always on).
 */
import { MALAYSIA_LOCALITIES } from "../static/localities.js";

const KEY = "alam.alerts";

export const DEFAULT_SETTINGS = () => ({
  enabled: true,
  alertTypes: ["aqi", "warning", "quake", "flood"],
  quietStart: 23,
  quietEnd: 7,
  townSlug: "",
  state: "",
  place: "",
});

const read = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    return { ...DEFAULT_SETTINGS(), ...(s ?? {}) };
  } catch {
    return DEFAULT_SETTINGS();
  }
};

/** Merge a partial settings object and persist. */
export function saveSettings(patch) {
  const next = { ...read(), ...patch, alertTypes: patch.alertTypes ?? read().alertTypes };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — settings stay in-memory for the session */
  }
  return next;
}

/** The active settings, kept in step with the currently-saved location. */
export function currentSettings(townSlug, state) {
  const s = read();
  const town = MALAYSIA_LOCALITIES.find((l) => l.slug === (townSlug ?? s.townSlug));
  const effectiveTown = townSlug ?? s.townSlug ?? "";
  const effectiveState = state ?? s.state ?? "";
  return {
    ...s,
    townSlug: effectiveTown,
    state: effectiveState,
    place: town?.name ?? s.place ?? (effectiveTown || "your area"),
  };
}

/** Malaysia local hour (0-23) for a timestamp — judged in MY time. */
export const malaysiaHour = (now) => new Date(now + 8 * 3_600_000).getUTCHours();

/** True when a MY-local hour is inside the quiet window (window semantics as the server). */
export function quietActive(now, start, end) {
  if (start === end) return false;
  const h = malaysiaHour(now);
  return start < end ? h >= start && h < end : h >= start || h < end;
}
