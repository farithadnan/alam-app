/**
 * Promise wrapper around the Geolocation API — shared by "Use my location"
 * (shell) and "Use nearest station" (air quality).
 * Resolves { lat, lon }; rejects on denial, timeout or no support.
 */
export function locate({ timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (err) => reject(err),
      { timeout },
    );
  });
}
