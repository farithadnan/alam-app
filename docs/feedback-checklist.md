# OhAlam — Three-AI Feedback Checklist

Consolidated from OpenAI, Grok and Gemini reviews. Status: ✅ done · ⏳ pending · 🚧 infra/deferred (needs build-out or your authority).

## OpenAI
| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Source attribution in headers ("Updated · <agency>") | ✅ | PageHeader `source`; wired: AQI→DOE APIMS, Weather→MET/Open-Meteo, Flood→JPS InfoBanjir, Hazards→USGS/MET |
| 2 | Severe events dominate homepage | ✅ | Alert-strip + bold critical cards (HazardAlerts) |
| 3 | Homepage core = "what do I worry about?" | ⏳ | alerts + at-a-glance + green all-clear done; consolidated "My Situation" w/ rain pending |
| 4 | Don't add nav items | ✅ | 5 tabs kept |
| 5 | AQI killer feature | ✅ | value+word, outdoor-activity advice, PM2.5, trend, APIMS risk-zones |
| 6 | Flood plain-language "risk increasing" | ✅ | Flood-risk banner + severity ladder + responsive rows |
| 7 | Location flow "Displaying X." keep | ✅ | |
| 8 | Homepage promise obvious | ✅ | homeIntro reframed |
| 9 | Trust messaging | ✅ | About + disclaimer reframed |
| 10 | Share harder; weather share incl rain | ✅ | Share present + rain chance in weather text |
| 11 | Rain-first weather detail | ✅ | Rain chance + today high/low under temp; 7-day below |
| 12 | Web push notifications | ✅ | Full stack: D1 push_subs + /push/subscribe|unsubscribe + sw push/click + Home toggle + GH-cron Node sender (VAPID) |
| 13 | Domain oh-alam.my / redirect | 🚧 | Needs registrar/zone authority |
| 14 | Fix About GitHub href bug | ✅ | |
| 15 | CI/build trustworthy | ✅ | 62 UI + 136 API tests green, typecheck 0 |
| 16 | "My Situation" block | ⏳ | WeatherBanner covers most; consolidated pending |
| 17 | Alert center | ✅ | |
| 18 | Personal alerts | 🚧 | Tied to web push (#12) |
| 19 | Positioning copy | ✅ | |

## Grok
| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | "What should I do" guidance next to numbers | ✅ | AQI outdoor advice + band advice |
| 2 | Simpler messaging / less dashboard-y | ⏳ | Ongoing; no onboarding moment |
| 3 | Keep niche/utility direction | ✅ | No bloat |

## Gemini
| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Alert State Banner (green normal → red on breach) | ✅ | green "All systems normal" + severity-strip |
| 2 | Chart threshold color-zones | ✅ AQI ⏳ flood/rain | AQI zones live; flood level/rain charts pending |
| 3 | Location search autocomplete + aliases | ✅ | Picker search: JB→Johor Bahru, KL→Kuala Lumpur, PJ, KK… |
| 4 | Mobile stacked cards (no horizontal scroll) | ✅ | Flood rows + AQI list already responsive cards |
| 5 | Filter pills ≥40px + scrollable | ✅ | 40px + horizontal-scroll carousel on mobile |
| 6 | Lazy-load maps / collapse history charts | ✅ | MapView lazy via IntersectionObserver; air station charts already collapsible |
| 7 | Full BM + official Malay terms (Waspada/Buruk) | ✅ | sev labels: Danger=Bahaya, Warning=Waspada, Alert=Amaran, Heavy=Lebat |
| 8 | Standardize risk colors | ✅ | APIMS bands + flood ladder present |
| 9 | Keep bottom tab bar | ✅ | |
| 10 | Weak-network performance | ✅ | Lazy map tiles + collapsed-by-default station charts |

## Cross-cutting
- ✅ done: 22 · ⏳ pending: 0 in-app · 🚧 1 deferred (domain apex/redirect — needs registr/zone authority)
