// OhAlam service worker — offline support for the app shell + last-seen data.
// API responses are network-first (always fresh when online) and fall back to
// the last cached copy offline; static assets are cache-first.
const VERSION = "alam-v3";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave map tiles / geojson alone

  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request)
        .then((r) => {
          const copy = r.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return r;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // The shell must be NETWORK-FIRST: index.html has no-cache and always references the
  // current hashed bundles. Serving it from cache would keep showing an old (possibly
  // buggy) build forever after a deploy — exactly the stale-bundle blink bug.
  if (url.pathname === "/" || url.pathname === "/index.html") {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((r) => {
            const copy = r.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
            return r;
          })
          .catch(() => caches.match("/index.html")),
    ),
  );
});

// ---- Web push ----
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { /* non-JSON payload */ }
  e.waitUntil(
    self.registration.showNotification(data.title || "OhAlam", {
      body: data.body || (data.message || ""),
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "alam-alert",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
