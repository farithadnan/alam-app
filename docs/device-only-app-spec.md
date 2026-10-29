# Alam as a device-only app — specification

Status: SPEC ONLY. Nothing here is built. Written 2026-10-22 against the live system
(Worker `alam`, D1 `alam`, repo `farithadnan/alam-api` @ main, 2026-10-07 deploy).

## 1. Goal

One installable app (Android APK first, desktop EXE second, iOS later). The app fetches
every data source itself, stores everything on the device, and raises its own alerts.
No server, no database, no bot, no account.

## 2. Out of scope / explicitly dropped

- Telegram bot and `chat_subscriptions` — the app is the only alert surface.
- Web Push (`/push/subscribe`, `push_subs`, VAPID keys, `workflows/push.mjs`).
- Cloudflare Worker `alam`, D1 database `alam`, GitHub Actions `ingest.yml` /
  `notify.yml` / `drift.yml`, and the `/_internal/*` endpoints. Nothing off-device.
- `newsdata.io` — needs a paid key that cannot be shipped inside an installable app.
  News comes from the three key-free Malaysian RSS feeds only.
- Server-accumulated history. The 14-day charts start empty on install and fill forward.

## 3. Data sources (what the device fetches)

All of these are key-free. Request counts are per refresh, measured from the current
adapters in `src/adapters/`.

| Source | Endpoint | Current calls | Target calls | Cadence |
|---|---|---|---|---|
| DOE APIMS air quality | `eqms.doe.gov.my/api3/publicportalapims/apitablehourly?stateid=&datetime=` + ArcGIS station metadata | 1 + 16 states = 17 | 17 | 300s |
| Open-Meteo weather, air quality, 10-day forecast | `api.open-meteo.com/v1/forecast`, `air-quality-api.open-meteo.com/v1/air-quality` | 3 x 108 towns = 324 | ~4 (batch comma-separated lat/lon) | 1800s |
| USGS earthquakes | `earthquake.usgs.gov/fdsnws/event/1/query` | 1 | 1 | 600s |
| MetMalaysia warnings + district forecast | `api.data.gov.my/weather/warning`, `/weather/forecast` | 2 | 2 | 900s / 21600s |
| InfoBanjir flood + heavy rain | `publicinfobanjir.water.gov.my/.../currentalert.json` | 1 | 1 | 300s |
| NOAA ONI (climate) | `cpc.ncep.noaa.gov/data/indices/oni.ascii.txt` | 1 | 1 | 86400s |
| News (RSS) | FMT, NST, Utusan feeds | 3 | 3 | 1800s |

Total per full refresh: ~30 calls once Open-Meteo is batched (today it would be ~350).

### 3.1 The one hard requirement

Requests must go through the platform's native HTTP client, not the WebView's `fetch`:
Capacitor `CapacitorHttp` (`plugins.CapacitorHttp.enabled: true`) or Tauri's http plugin.
Without it the WebView applies CORS and these fail, verified by header probe:

- blocked: `eqms.doe.gov.my` (allows only `https://eqmp.doe.gov.my`), `publicinfobanjir`
  (no CORS header), `cpc.ncep.noaa.gov` (plain text, no header), all three RSS feeds.
- allowed: Open-Meteo (`*`), USGS (`*`), `api.data.gov.my` (`*`).

CORS is a browser rule, not a server rule, so routing through the native client removes
the blocker entirely.

## 4. On-device data model

Persisted locally (SQLite via the Capacitor SQLite plugin, or IndexedDB):

- `observations` — same row shape as the server table: source, station, station_name,
  measured_at, kind, value, meta (JSON). Kinds: `aqi`, `weather`, `forecast`, `hourly`,
  `quake`, `warning`, `flood`, `rainfall`, `news`, `haze`, `metfc`, `oni`.
  Prune older than 14 days and cap total rows (~100k) to bound storage.
- `alert_state` — (kind, key, last_band, last_value, last_alert_at, last_recovery_at).
  Same keys as today's `alert_state` table so the policy below is a direct port.
- `settings` — chosen town/state (slug + human label, e.g. "Arau, Perlis"), enabled
  alert types, quiet hours, notification on/off, data-saver flag.
- No chat id, no endpoint, no token. Nothing to identify a user.

## 5. Alert policy (port of the current engine, unchanged behaviour)

Edge-triggered: a steady level produces exactly one alert; only crossings fire.

- Air quality — the alert band is APIMS index >= 101 ("Unhealthy"). Bands: Good 0-50,
  Moderate 51-100, Unhealthy 101-200, Very Unhealthy 201-300, Hazardous 301+. Station
  chosen for the town: name match first, else nearest by coordinates.
  - fires on: first entry into an alert band, or a climb into a worse band.
  - recovery message fires once on the first return to a clean band.
  - re-entering an alert band is gated by a 30-minute cooldown (anti-flap).
  - cold start (first ever evaluation): silent baseline, except air already at
    Unhealthy or worse, which sends one current-condition alert.
- Earthquakes — magnitude >= 5.0 and within 400 km of the chosen town, once per USGS
  event id.
- Flood and heavy rain — station in the InfoBanjir alert feed, same state, within 100 km
  of the town (stations with no coordinates still count, so it never under-alerts).
  Alert once on appearance, reset the record when the station leaves the feed, so a
  recurrence alerts again.
- MetMalaysia warnings — one per distinct issuance (title + issue time), matched when the
  bulletin text names the town or state.
- Quiet hours 23:00-07:00 Malaysia time: no notifications, alerts still recorded so
  nothing is lost.
- Multi-alert pass: one notification per pass, not one per alert, listing the topics.

### 5.1 Notification delivery on a phone

- Android: local notifications. Immediate alerts while the app runs, plus periodic
  background work (WorkManager, 15-minute minimum) for checks while it is closed. The
  app should ask for battery-optimisation exemption, which is the difference between
  reliable and "sometimes when I open it".
- iOS (later): opportunistic background refresh only, no guaranteed cadence.
- Honest wording in the UI: alerts arrive while the app is open, and when the phone
  allows background checks. This is weaker than today's guaranteed 5-minute server cron
  and must not be described as if it were the same.

## 6. Screens

Reuse the existing five-tab dashboard as the app's UI (Home, Weather, AQI, Hazards,
News). Changes needed:

- The banner's Telegram pill goes; Share stays (it already draws a card locally and
  sends text, no server involved).
- The "Enable device alerts" toggle becomes the app's own notification + alert-type
  settings, and stops calling `/push/subscribe`.
- Every "live update failed" path becomes a real offline state: show the last fetch
  time and the cached data, no server-error wording.
- One new screen: alert settings (town, alert types, quiet hours, background permission
  status).

## 7. Non-functional targets

- Works fully offline for browsing after the first sync.
- Refresh on open, then every 15-30 minutes in background; never every 5 minutes on a
  phone (battery and data).
- Data per refresh: aim under 1.5 MB including the 108-town weather batch.
- Cold start under 2 seconds from cache.
- No network permission surprises: state plainly in the app what it talks to and why.

## 8. Packaging

- Capacitor for Android (the proven path: `@capacitor/android` in CI, JDK 21, debug-signed
  `assembleDebug` APK is sideloadable; Play Store needs a signing keystore and review).
- Tauri for the desktop EXE, built on a Windows runner.
- Relative asset base (`base: './'`) is a prerequisite.
- Builds happen in GitHub Actions; this machine has no Java, Gradle, Rust, or Android
  SDK and does not need them.
- Repo layout: keep the SPA in `alam-dashboard` and add an `app` build variant plus
  `capacitor.config.json` / `src-tauri/`, mirroring `palang-web`.

## 9. What the device cannot do (accepted, stated in the app)

- No alerts for anyone who has not installed the app.
- No alert history from before install.
- No cross-device sync of settings.
- Alert delivery degrades when the OS throttles background work.

## 10. Cloudflare afterwards

If the app is the whole product, the Worker, D1, the Actions cron and the token all
become deletable. If the website stays as a landing page or as a browser version, that
is a separate decision — the browser version still needs the read-cap fix (serve a
static JSON snapshot computed by a scheduled job, plus indexes on `kind`/`measured_at`),
because the current full-scan reads blow the free 5 M rows/day limit after roughly one
or two cold page loads.

## 11. Acceptance criteria

1. Fresh install, airplane mode: app opens, shows cached data, says when it was fetched.
2. Fresh install, online, town set to Arau: AQI, weather, forecast, flood, quakes, news
   all populate without a server in the path.
3. Air already Unhealthy at first run: exactly one alert. A second refresh: no repeat.
   Improvement to Very Unhealthy: one alert. Return to Moderate: one recovery. Then no
   further alerts until the 30-minute cooldown passes.
4. Quake 5.0+ within 400 km: one alert per event, never twice.
5. Alert for a station in the same state but 300 km away: not delivered.
6. Quiet hours: no notification between 23:00 and 07:00 Malaysia time, alert still
   recorded and visible in the app.
7. Verified on real hardware, not just the emulator: the DOE APIMS, InfoBanjir and RSS
   requests succeed through the native HTTP client.
8. Server-side assets removed: no D1 rows read, no Worker invocations, no Telegram
   traffic in a 24-hour window.

## 12. Risks and open questions

- Government endpoints: scraping eligibility, attribution, and the practical risk that
  a CORS or WAF change breaks a source with no server-side fallback to patch it.
- Play Store review for an app that aggregates government hazard data, and the cost of
  keeping it compliant.
- Background alert reliability varies per Android vendor (Xiaomi, Oppo, Samsung kill
  background work aggressively).
- Open-Meteo's free tier is for non-commercial use with a per-IP daily request budget —
  batching is what keeps 108 towns inside it.
- Open: iOS at all, or Android + desktop only?
- Open: does the browser version survive as a shop window, or does it go too?
