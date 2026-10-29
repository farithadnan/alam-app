// Browser Web-Push helpers. VAPID_PUBLIC is the app server key used by
// pushManager.subscribe (the matching private key lives only in the GH-cron pusher).
const VAPID_PUBLIC =
  "BEBt0yI3EME6H8Mc7fYq0AjvKyoXj5luefSS5Jt6rEsANFTgME9DK01hbWwsiIIo981GR-zUrR73pI4GH5PThv0";

const urlBase64ToUint8 = (s) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const abToB64 = (ab) => btoa(String.fromCharCode(...new Uint8Array(ab)));

// Device-aware flag: web-push belongs to the retired server stack. In the native app
// (window.Capacitor present) the alerts surface is the on-device engine (Phase 2/3),
// so web-push must not advertise itself. In a plain browser it stays available for
// the legacy PWA path.
export function isNative() {
  if (typeof window === "undefined") return false;
  /** @type {any} */
  const w = window;
  const cap = w.Capacitor;
  return typeof cap !== "undefined" && !!cap.isNativePlatform?.();
}

export function pushSupported() {
  return !isNative() && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function pushEnabled() {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

export async function subscribePush(town = "", state = "") {
  if (!pushSupported()) return { status: "unsupported" };
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return { status: "denied" };
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8(VAPID_PUBLIC) });
    }
    const payload = {
      endpoint: sub.endpoint,
      keys: { p256dh: abToB64(sub.getKey("p256dh")), auth: abToB64(sub.getKey("auth")) },
      town: town || "", state: state || "",
    };
    const r = await fetch("/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    return { status: r.ok ? "subscribed" : "error" };
  } catch {
    return { status: "error" };
  }
}

export async function unsubscribePush() {
  if (!pushSupported()) return { status: "unsupported" };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { status: "none" };
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch("/push/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint }) }).catch(() => {});
    return { status: "unsubscribed" };
  } catch {
    return { status: "error" };
  }
}
