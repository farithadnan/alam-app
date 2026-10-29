# OhAlam — Android app (device-only)

**OhAlam** is a Malaysia air-quality, weather and environmental-hazards app. This is the
**device-only** version: the phone fetches every data source itself (DOE APIMS,
Open-Meteo, USGS, MET Malaysia, InfoBanjir, NOAA, Malaysian RSS) and raises its own
alerts. No server, no database, no account.

> **Status — Phase 0 scaffold.** The Capacitor + Android shell is in place and a
> debug APK builds in CI. On-device ingestion (Phase 1) and on-device alerting
> (Phase 2) land next; until then the UI boots into its cached/offline state.
> Design spec: `docs/device-only-app-spec.md`.

---

## What it does

One app you open to answer "is it safe to go out right now?"

- Air quality (AQI) for towns across all 16 states
- Current weather and a 10-day forecast
- Earthquakes, flood alerts, and official MET Malaysia warnings
- Hazard news from key-free Malaysian RSS feeds
- A share button that draws a picture of the reading to send to a friend

## Development

Requires [Node.js](https://nodejs.org) ≥ 20.19.

```bash
npm install
npm run dev        # Svelte/Vite dev server (web preview only)
npm run cap:sync   # vite build + copy web assets into the android platform
npm run apk        # ... then assemble the debug APK (needs JDK 21 + Android SDK)
```

`npm test`, `npm run typecheck`, and `npm run build` verify the code.

## Getting the APK

Push to `main` and a GitHub Actions workflow
(`.github/workflows/build.yml`) runs typecheck + tests, builds the web bundle,
synces Capacitor, and uploads a **debug-signed APK** as the `alam-debug-apk`
artifact — download and install it directly (sideload). A signing keystore and Play
Store review are only needed if the app is ever released through the Play Store.

## Layout

- `src/` — Svelte 5 UI (the five-tab dashboard: Home, Weather, AQI, Hazards, News)
- `public/runners/fetch.js` — background sync runner (headless JS env, Phase 1)
- `android/` — generated Capacitor Android platform (committed, per Capacitor best practice)
- `capacitor.config.ts` — app identity + plugin wiring (CapacitorHttp is **enabled**:
  several data sources send no CORS headers, so requests must go through the native
  HTTP client — see `docs/device-only-app-spec.md` §3.1)
