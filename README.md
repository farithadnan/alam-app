# OhAlam — Malaysia air quality & weather dashboard

A simple, mobile-friendly website that shows Malaysia's air quality, weather, and
environmental hazards (earthquakes, floods, official warnings) all in one place.

**Live at:** https://app.oh-alam.my

It speaks English or Bahasa Malaysia, and can be used in light or dark mode.

---

## What it does

One page you open on your phone to answer "is it safe to go out right now?"

- Air quality (AQI) for towns across all 16 states
- Current weather and a few-day forecast
- Earthquakes, flood alerts, and official MET Malaysia warnings
- A share button so you can send a picture of the reading to a friend

It only reads from one place — the OhAlam API. It never talks to the data sources
directly, so all the messy stuff (which government site, which weather service) is kept
behind the scenes.

---

## Run it on your machine (for development)

You need [Node.js](https://nodejs.org) installed.

```bash
# 1. Install the tools it needs
npm install

# 2. Start the website
npm run dev
```

Your browser opens a local copy. During development it automatically reads the local API at
`http://localhost:8788` (start that with the instructions in the `alam-api` README).

Other handy commands:

```bash
npm test                # run the automated checks
npm run typecheck       # check for mistakes in the code
npm run build           # make the production version (into the dist/ folder)
```

---

## How it's laid out (short version)

The code is split so that anything that talks to the network or the browser lives in one
place (`src/core/`), anything that's just a calculation lives in another (`src/domain/`),
and each part of the screen — weather, air, hazards — has its own folder (`src/features/`).
That way a change to one screen never quietly breaks another.

---

## Putting it live

You usually don't build or upload anything from this repo by hand. Publishing is automatic:

- The `alam-api` repo's deploy workflow builds this site and publishes it to Cloudflare on
  every update to the `main` branch.
- The live address is your own custom domain, `app.oh-alam.my`.
- Nothing runs on your computer or on a server you have to pay for.

The one-time setup just means adding a couple of Cloudflare and GitHub tokens as repository
secrets in the `alam-api` repo. If you skip it, the site simply keeps running the version
already published.

---

## Notes

- Made with Svelte 5 + Vite, a map (Leaflet), and Tailwind.
- Works offline after first visit (adds to home screen on a phone).
- Tests and visual checks run automatically before anything is published.