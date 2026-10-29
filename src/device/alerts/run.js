/**
 * Alert runner — one evaluation pass after each sync.
 *
 * Gathers the latest observations from the device store, evaluates the edge-trigger
 * engine against the persisted alert state, persists the new state (so a steady
 * level never re-alerts), records an alert-center entry, and delivers ONE local
 * notification per pass (honouring quiet hours). Quiet hours still record — nothing
 * is lost, just not surfaced at night.
 */
import { deviceStore } from "../store.js";
import { evaluate } from "./engine.js";
import { composeBody } from "./messages.js";
import { currentSettings, quietActive } from "./settings.js";
import { ensureNotificationPermission, deliverAlerts } from "./notify.js";

/**
 * @param {{ townSlug?: string, state?: string }} opts
 */
export async function runAlertCheck({ townSlug, state } = {}) {
  const store = deviceStore;
  await store.init();
  const settings = currentSettings(townSlug, state);
  if (!settings.enabled || !settings.townSlug) return [];

  const sub = {
    chatId: 0,
    townSlug: settings.townSlug,
    state: settings.state,
    place: settings.place,
    alertTypes: settings.alertTypes,
    enabled: settings.enabled,
  };

  const prev = await store.alertStateForDevice();
  const [aqi, warnings, quakes, flood, rainfall] = await Promise.all([
    store.latestBySource("doe-eqms"),
    store.latestByKind("warning", 60),
    store.latestByKind("quake", 60),
    store.latestByKind("flood", 100),
    store.latestByKind("rainfall", 100),
  ]);

  const res = evaluate(sub, prev, { aqi, warnings, quakes, flood, rainfall });
  for (const row of res.next) await store.setAlertState(row);

  if (!res.fire.length) return [];

  // Record regardless of quiet hours / permission: the alert center always has it.
  await store.addAlert({ kind: "summary", texts: res.fire });

  const now = Date.now();
  if (quietActive(now, settings.quietStart, settings.quietEnd)) return res.fire; // recorded, not surfaced

  const granted = await ensureNotificationPermission();
  if (granted) {
    await deliverAlerts("OhAlam", composeBody(res.fire));
  }
  return res.fire;
}
