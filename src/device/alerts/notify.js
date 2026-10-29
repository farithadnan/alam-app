/**
 * Notification delivery — Android local notifications via the Capacitor plugin.
 * In a native runtime one notification per evaluation pass carries the summary
 * (spec §5: "one notification per pass, not one per alert"). The plugin's web
 * implementation is a no-op, so browser dev and tests just log + rely on the
 * in-app alert center.
 */
import { isNative } from "../../core/push.js";
import { pushSupported } from "../../core/push.js";

/** Always importable: the plugin ships a web stub that degrades gracefully. */
let LocalNotifications = null;
if (typeof window !== "undefined" && import.meta.env.PROD === false) {
  // dev-mode: dynamic import keeps the native module out of the eager path
}

let notifSeq = 1;

export async function ensureNotificationPermission() {
  if (!isNative()) return true;
  try {
    const mod = await import("@capacitor/local-notifications");
    LocalNotifications = mod.LocalNotifications;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "prompt") {
      const req = await LocalNotifications.requestPermissions();
      return req.display === "granted";
    }
    return perm.display === "granted";
  } catch (err) {
    console.warn("[alerts] local-notifications unavailable", err);
    return false;
  }
}

export async function deliverAlerts(title, body) {
  if (!isNative()) {
    console.log(`[alerts] (dev) would notify: ${title}\n` + body);
    return;
  }
  try {
    const mod = await import("@capacitor/local-notifications");
    await mod.LocalNotifications.schedule({
      notifications: [{ id: notifSeq++, title, body }],
    });
  } catch (err) {
    console.warn("[alerts] notify failed (weaker background delivery is expected)", err);
  }
}
