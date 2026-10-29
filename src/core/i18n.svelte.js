// Minimal BM/EN i18n as a shared runes store. Strings keyed; components call tr('key').
const en = {
  navWeather: "Weather", navAQI: "AQI", navHazards: "Hazards", navAbout: "About", changeLoc: "Change location", skipToContent: "Skip to main content", subFlood: "Flood", subQuake: "Earthquakes",
  navHome: "Home", navNews: "News", homeIntro: "Weather, air, floods and warnings — everything happening around you in Malaysia, in one place.", atAGlance: "At a glance", glanceWarnings: "Warnings", glanceFloods: "Floods", glanceQuakes: "Earthquakes", glanceClimate: "Climate", searchEndpoints: "Search endpoints…", srcTitle: "Official sources", srcHint: "Data from the issuing agencies.", aqiTip: "Real-time air quality from Malaysia's monitoring stations.", floodRiskNow: "{n} flood alerts now", floodRiskAct: "Rivers are above alert level — keep an eye on updates and be ready to move if instructed.", trend: "Trend", trendRising: "↑ Rising", trendFalling: "↓ Falling", trendSteady: "→ Steady", outdoorActivity: "Outdoor activity", enableAlerts: "Enable device alerts", alertsOn: "Alerts on", alertsOnHint: "Notified about floods, warnings and worse air for your area.", alertsDenied: "Denied — allow notifications in browser", viewMalaysia: "View all Malaysia alerts", noQuakesFilter: "No earthquakes in this size range this week", noQuakesHint: "Try selecting All or a wider band to see more.", viewAllQuakes: "View all earthquakes", floodHighest: "Highest water level", advisories: "Advisories", newsTitle: "Weather & hazard news", noNews: "No recent stories.", clearSearch: "Clear search", noWeatherAny: "No weather data in {scope} right now", noWeatherHint: "Live readings usually appear for every state. Try a different location.", noAirNow: "No air quality readings in {scope} right now", noAirHint: "Stations refresh roughly each hour. Come back shortly or switch location.", newsCount: "recent stories",
  scopeNear: "Near me", scopeState: "State", scopeMalaysia: "Malaysia",
  state: "State", town: "Town", useLoc: "Use my location", locating: "Locating…", searchPlace: "Search town", searchPlacePh: "e.g. Johor Bahru, JB, KL…", noSearchResults: "No matching town.",
  feels: "Feels like", humidity: "humidity", wind: "wind", uv: "UV", uv_lo: "Low", uv_mod: "Moderate", uv_hi: "High", uv_vhi: "Very High", uv_ext: "Extreme", rainChance: "Rain chance", rainAt: "around", rainNoneSoon: "No rain expected in the next few hours.",
  gust: "Gusts", pressure: "Pressure", visibility: "Visibility", dewPoint: "Dew point", sunrise: "Sunrise", sunset: "Sunset", moon: "Moon", todayDetail: "Today's details", updated: "Updated", today: "Today",
  airNow: "Air now", yourTown: "Your town",
  validUntil: "Valid until", readFull: "Read full advisory", hideFull: "Hide",
  quakeTitle: "Recent earthquakes · 4.5+ · past week", quakeCap: "SE Asia, grouped by region · Magnitude 4.5 and above.", climateEl: "El Niño is active and expected to strengthen. MetMalaysia's outlook points to a strong to very strong event from September 2026 into January 2027.",
  climateLa: "La Niña is active — a cooler Pacific often brings wetter, stormier conditions to Malaysia.",
  climateNeutral: "Neutral — the equatorial Pacific is near its normal state.",
  climateElEffect: "For Malaysia, this can mean reduced rainfall and hotter, drier weather, with a higher risk of haze and water stress, especially later in the year.",
  climateLaEffect: "Typically wetter for Malaysia, with more flooding and storms.",
  climateNeutralEffect: "Near-normal rainfall patterns for Malaysia.",
  share: "Share", shareCardBtn: "Share image", alertsTelegram: "Telegram alerts", loading: "Loading…", searchNews: "Search news…", noMatches: "No matching stories.", staleData: "Live update failed — showing last known data.", loadFailed: "Could not reach the data service.", loadFailedHint: "Check your connection — nothing has loaded yet.", retry: "Retry", avgTemp: "Average temperature", highTemp: "Highest temperature", lowTemp: "Lowest temperature", back: "Back", done: "Done", showMore: "Show more", showLess: "Show less", noData: "No data for this place.", high: "high", low: "low",
  catTitle: "Stations by category",
  tsunamiFlag: "Tsunami alert issued for this event",
  magnitude: "Magnitude", depth: "Depth", region: "Region", intensity: "Intensity", reportedIntensity: "Reported intensity", significance: "Significance", eventType: "Event type", feltReports: "Felt reports", tsunami: "Tsunami", stationsUsed: "Stations used", status: "Status", yes: "Yes", no: "No",
  stationLbl: "Station", categoryLbl: "Category", parameter: "Parameter",
  chartPast24: "Observed readings, past 24 hours", chartPast7d: "Observed readings, past 7 days",
  cleanestNow: "Cleanest right now", worstNow: "Most polluted right now",
  officialTitle: "Official forecast (MET Malaysia)", officialNote: "Official 7-day forecast from MET Malaysia.", forecastLegend: "High / Low — the day's warmest and coolest temperature.",
  locationPrompt: "Showing {place}. Not your place?", useMyLocation: "Use my location", dismiss: "Not now", locHint: "Your pick applies right away. Done closes this.",
  hazeTitle: "Haze outlook", hazeHint: "Peak fine-dust (PM2.5) each day. Lower is better; the daily limit is 25 µg/m³.",
  floodTitle: "Flood & rain alerts", floodRiver: "River levels", floodRain: "Heavy rain", floodSevAll: "All", floodOpen: "Full InfoBanjir live map", floodNone: "No active flood alerts in {state} right now.", floodMonitor: "Watching river levels and rainfall shifts across Malaysia via InfoBanjir (JPS).", floodNote: "Live river levels and heavy-rain alerts from JPS InfoBanjir.", sources: "Sources: DOE · MET · USGS · NOAA · Open-Meteo",
  aboutTitle: "About OhAlam", sourcesTitle: "Data sources", sourcesCredit: "MET Malaysia, DOE APIMS, JPS InfoBanjir, NADMA and USGS.",
  band_good: "Good", band_moderate: "Moderate", band_unhealthy: "Unhealthy", band_very: "Very Unhealthy", band_hazardous: "Hazardous",
  advice_good: "Air is clean; a good day to be outside.", advice_moderate: "Acceptable. Sensitive groups: moderate activity is fine.",
  advice_unhealthy: "Reduce prolonged outdoor exertion.", advice_very: "Avoid outdoor activity; keep windows closed.",
  advice_hazardous: "Everyone should stay indoors; serious health risk.",
  sev_high: "High", sev_watch: "Watch", sev_advisory: "Advisory", sev_danger: "Danger", sev_warning: "Warning", sev_alert: "Alert", sev_heavy: "Heavy",
  mag_strong: "Strong", mag_moderate: "Moderate", mag_light: "Light",
  wmo_clear: "Clear", wmo_mostly: "Mostly clear", wmo_partly: "Partly cloudy", wmo_overcast: "Overcast",
  wmo_fog: "Fog", wmo_drizzle: "Drizzle", wmo_lightrain: "Light rain", wmo_rain: "Rain", wmo_heavy: "Heavy rain",
  wmo_showers: "Showers", wmo_thunder: "Thunderstorm", wmo_snow: "Snow", wmo_thunderstorm: "Thunderstorm",
  stationsMap: "Stations map",
  aboutWhat: "OhAlam brings Malaysia's official weather, air-quality, flood and hazard data together in one simple view. You don't need to know which agency owns which number — OhAlam gathers it from them and makes it easy to read.",
  aboutLead: "Malaysia's official weather, air, flood and hazard data — together in one clear view.",
  featTitle: "Features",
  feat1: "Nationwide air quality (68 monitoring stations, all 16 states)",
  feat2: "Current weather, feels-like, humidity, wind and UV",
  feat3: "Hourly timeline and a 7-day forecast",
  feat4: "Live MET Malaysia weather warnings (land-based)",
  feat5: "Recent earthquakes across Southeast Asia on an interactive map",
  feat6: "Malay and English, light and dark mode, works on phone and desktop",
  discText: "OhAlam is a convenience layer over official public sources — MET Malaysia, DOE APIMS, JPS InfoBanjir, NADMA and USGS — restated in plain language. It is not a government service. For live safety decisions, the official agencies' current instructions always come first.",
  privTitle: "Privacy policy",
  privText: "OhAlam does not collect personal data. Your theme and language preferences are stored only in your own browser (local storage) and never transmitted to a server.",
  accuracyTitle: "Data accuracy",
  dataNote: "Data is gathered from third-party agencies and may differ from other sources or update at a different time. It is provided as-is, with no guarantee — always confirm with the official agency before acting.",
  contactTitle: "Contact",
  reportTitle: "Report an issue",
  reportBtn: "Report an issue",
  reportType: "Type",
  reportTypeData: "Wrong or missing data",
  reportTypeBug: "Bug or broken feature",
  reportTypeIdea: "Suggestion",
  reportDesc: "Describe the problem",
  reportDescPh: "What did you see, and where?",
  reportEmail: "Your email (optional)",
  reportSend: "Send",
  reportThanks: "Your email app should open with the report ready to send.",
  apiTitle: "API",
  apiIntro: "OhAlam serves a small JSON API — the same one powering this site. It is open, free, and requires no key.",
  apiNote: "Be kind: the API is backed by cached public data. Versioned at /v1 (an alias of /api), rate-limited to 120 requests/min per IP — please cache responses.", apiConventions: "No auth or API key required. Responses are JSON (application/json).",
  quakeGuide: "Earthquake size", quakeGuideLight: "4.5–4.9 Light · felt by many, little damage", quakeGuideMod: "5.0–5.9 Moderate · can damage weak buildings", quakeGuideStrong: "6.0+ Strong · can damage populated areas",
  aqiScaleToggle: "What do the numbers mean?", mainPollutant: "Main pollutant", aqiMeanGood: "Good 0–50 · safe for everyone", aqiMeanModerate: "Moderate 51–100 · fine for most people", aqiMeanUnhealthy: "Unhealthy 101–200 · sensitive groups ease off outdoors", aqiMeanVery: "Very Unhealthy 201–300 · everyone limits outdoor time", aqiMeanHazardous: "Hazardous 301+ · avoid outdoor activity",
  floodLevelTitle: "River level meaning", floodMeanAlert: "Alert · rising, keep an eye on it", floodMeanWarning: "Warning · high, be ready to move if needed", floodMeanDanger: "Danger · very high, follow official instructions", floodMeanHeavy: "Heavy rain · flash-flood risk, keep an eye on it",
};
const ms = {
  navWeather: "Cuaca", navAQI: "AQI", navHazards: "Bahaya", navAbout: "Tentang", changeLoc: "Tukar lokasi", skipToContent: "Langkau ke kandungan utama", subFlood: "Banjir", subQuake: "Gempa bumi",
  navHome: "Utama", navNews: "Berita", homeIntro: "Cuaca, kualiti udara dan amaran bahaya secara langsung untuk Malaysia.", atAGlance: "Sekilas pandang", glanceWarnings: "Amaran", glanceFloods: "Banjir", glanceQuakes: "Gempa bumi", glanceClimate: "Iklim", searchEndpoints: "Cari endpoint…", srcTitle: "Sumber rasmi", srcHint: "Data daripada agensi pengeluar.", aqiTip: "Kualiti udara masa nyata dari stesen pemantauan seluruh Malaysia.", floodRiskNow: "{n} amaran banjir sekarang", floodRiskAct: "Sungai melebihi paras amaran — pantau kemas kini dan bersedia bertindak jika diarahkan.", trend: "Trend", trendRising: "↑ Meningkat", trendFalling: "↓ Menurun", trendSteady: "→ Stabil", outdoorActivity: "Aktiviti luar", enableAlerts: "Aktifkan makluman peranti", alertsOn: "Makluman aktif", alertsOnHint: "Diberitahu tentang banjir, amaran dan udara buruk untuk kawasan anda.", alertsDenied: "Ditolak — benarkan pemberitahuan dalam pelayar", viewMalaysia: "Lihat semua amaran banjir Malaysia", noQuakesFilter: "Tiada gempa bumi dalam julat saiz ini minggu ini", noQuakesHint: "Cuba pilih Semua atau julat yang lebih luas untuk melihat lebih banyak.", viewAllQuakes: "Lihat semua gempa bumi", floodHighest: "Paras air tertinggi", advisories: "Nasihat", newsTitle: "Berita cuaca & bahaya", noNews: "Tiada berita terkini.", clearSearch: "Kosongkan carian", noWeatherAny: "Tiada data cuaca di {scope} buat masa ini", noWeatherHint: "Bacaan terkini biasanya muncul untuk setiap negeri. Cuba lokasi lain.", noAirNow: "Tiada bacaan kualiti udara di {scope} buat masa ini", noAirHint: "Stesen dikemas kini kira-kira setiap jam. Cuba lagi sebentar atau tukar lokasi.", newsCount: "berita terkini",
  scopeNear: "Berdekatan", scopeState: "Negeri", scopeMalaysia: "Malaysia",
  state: "Negeri", town: "Bandar", useLoc: "Guna lokasi saya", locating: "Mengesan…", searchPlace: "Cari bandar", searchPlacePh: "cth. Johor Bahru, JB, KL…", noSearchResults: "Tiada bandar sepadan.",
  feels: "Terasa seperti", humidity: "kelembapan", wind: "angin", uv: "UV", uv_lo: "Rendah", uv_mod: "Sederhana", uv_hi: "Tinggi", uv_vhi: "Sangat Tinggi", uv_ext: "Melampau", rainChance: "Kebarangkalian hujan", rainAt: "sekitar", rainNoneSoon: "Tiada hujan dijangka dalam beberapa jam akan datang.",
  gust: "Tiupan", pressure: "Tekanan", visibility: "Penglihatan", dewPoint: "Titik embun", sunrise: "Matahari terbit", sunset: "Matahari terbenam", moon: "Bulan", todayDetail: "Butiran hari ini", updated: "Dikemas kini", today: "Hari ini",
  airNow: "Udara sekarang", yourTown: "Bandar anda",
  validUntil: "Berkuat hingga", readFull: "Baca amaran penuh", hideFull: "Sembunyi",
  quakeTitle: "Gempa bumi terkini · 4.5+ · minggu lalu", quakeCap: "Asia Tenggara, dikumpul ikut rantau · Magnitud 4.5 dan ke atas.",
  climateEl: "El Niño aktif dan dijangka bertambah kuat. Tinjauan MetMalaysia menunjukkan keadaan kuat hingga sangat kuat dari September 2026 hingga Januari 2027.",
  climateLa: "La Niña aktif — Pasifik lebih sejuk lazimnya membawa keadaan lebih basah ke Malaysia.",
  climateNeutral: "Neutral — Pasifik khatulistiwa hampir normal.",
  climateElEffect: "Bagi Malaysia, ini boleh bermakna hujan kurang dan cuaca lebih panas dan kering, dengan risiko jerebu dan tekanan air lebih tinggi, terutama kemudian tahun ini.",
  climateLaEffect: "Lazimnya lebih basah untuk Malaysia, dengan lebih banyak banjir dan ribut.",
  climateNeutralEffect: "Corak hujan hampir normal untuk Malaysia.",
  share: "Kongsi", shareCardBtn: "Kongsi imej", alertsTelegram: "Amaran Telegram", loading: "Memuatkan…", searchNews: "Cari berita…", noMatches: "Tiada berita sepadan.", staleData: "Kemas kini langsung gagal — memaparkan data terakhir.", loadFailed: "Tidak dapat menghubungi perkhidmatan data.", loadFailedHint: "Periksa sambungan anda — tiada data dimuatkan lagi.", retry: "Cuba lagi", avgTemp: "Purata suhu", highTemp: "Suhu tertinggi", lowTemp: "Suhu terendah", back: "Kembali", done: "Siap", showMore: "Tunjuk lebih", showLess: "Tunjuk kurang", noData: "Tiada data untuk tempat ini.", high: "tinggi", low: "rendah",
  catTitle: "Stesen mengikut kategori",
  tsunamiFlag: "Amaran tsunami dikeluarkan untuk kejadian ini",
  magnitude: "Magnitud", depth: "Kedalaman", region: "Wilayah", intensity: "Keamatan", reportedIntensity: "Keamatan dilaporkan", significance: "Kepentingan", eventType: "Jenis kejadian", feltReports: "Laporan dirasai", tsunami: "Tsunami", stationsUsed: "Stesen digunakan", status: "Status", yes: "Ya", no: "Tidak",
  stationLbl: "Stesen", categoryLbl: "Kategori", parameter: "Parameter",
  chartPast24: "Bacaan diperhatikan, 24 jam lalu", chartPast7d: "Bacaan diperhatikan, 7 hari lalu",
  cleanestNow: "Paling bersih sekarang", worstNow: "Paling tercemar sekarang",
  officialTitle: "Ramalan rasmi (MET Malaysia)", officialNote: "Ramalan rasmi 7 hari daripada MET Malaysia.", forecastLegend: "Tinggi / Rendah — suhu paling panas dan paling sejuk pada hari itu.",
  locationPrompt: "Memaparkan {place}. Bukan lokasi anda?", useMyLocation: "Guna lokasi saya", dismiss: "Bukan sekarang", locHint: "Pilihan anda diterapkan serta-merta. Siap untuk tutup.",
  hazeTitle: "Tinjauan jerebu", hazeHint: "Habuk halus (PM2.5) puncak setiap hari. Semakin rendah semakin baik; had harian ialah 25 µg/m³.",
  floodTitle: "Amaran banjir & hujan", floodRiver: "Paras sungai", floodRain: "Hujan lebat", floodSevAll: "Semua", floodOpen: "Peta InfoBanjir penuh", floodNone: "Tiada amaran banjir aktif di {state} buat masa ini.", floodMonitor: "Memantau paras sungai dan pergerakan hujan di seluruh Malaysia melalui InfoBanjir (JPS).", floodNote: "Paras sungai dan hujan lebat langsung daripada InfoBanjir (JPS).", sources: "Sumber: DOE · MET · USGS · NOAA · Open-Meteo",
  aboutTitle: "Tentang OhAlam", sourcesTitle: "Sumber data", sourcesCredit: "MET Malaysia, APIMS JAS, JPS InfoBanjir, NADMA dan USGS.",
  apiTitle: "API", apiIntro: "OhAlam menyediakan API JSON yang kecil — sama seperti yang menggerakkan laman ini. Ia terbuka, percuma, dan tanpa kunci.", apiNote: "Bersikap sopan: API disandarkan pada data awam terkini. Versi di /v1 (alias kepada /api), had 120 permintaan/min bagi setiap IP — sila cache respons.", apiConventions: "Tiada kunci atau log masuk diperlukan. Respons ialah JSON (application/json).",
  quakeGuide: "Saiz gempa bumi", quakeGuideLight: "4.5–4.9 Ringan · dirasai ramai, kerosakan kecil", quakeGuideMod: "5.0–5.9 Sederhana · boleh merosakkan bangunan rapuh", quakeGuideStrong: "6.0+ Kuat · boleh merosakkan kawasan berpenduduk",
  aqiScaleToggle: "Apa maksud nombor ini?", mainPollutant: "Pencemar utama", aqiMeanGood: "Baik 0–50 · selamat untuk semua", aqiMeanModerate: "Sederhana 51–100 · baik untuk kebanyakan orang", aqiMeanUnhealthy: "Tidak Sihat 101–200 · kumpulan sensitif kurangkan aktiviti luar", aqiMeanVery: "Sangat Tidak Sihat 201–300 · semua hadkan masa di luar", aqiMeanHazardous: "Berbahaya 301+ · elakkan aktiviti luar",
  floodLevelTitle: "Maksud paras sungai", floodMeanAlert: "Amaran awal · naik, pantau", floodMeanWarning: "Amaran · tinggi, sedia berpindah jika perlu", floodMeanDanger: "Bahaya · sangat tinggi, ikut arahan rasmi", floodMeanHeavy: "Hujan lebat · risiko banjir kilat, berhati-hati",
  band_good: "Baik", band_moderate: "Sederhana", band_unhealthy: "Tidak Sihat", band_very: "Sangat Tidak Sihat", band_hazardous: "Berbahaya",
  advice_good: "Udara bersih; hari yang baik untuk keluar.", advice_moderate: "Boleh diterima. Kumpulan sensitif: aktiviti sederhana adalah ok.",
  advice_unhealthy: "Kurangkan aktiviti luar yang berpanjangan.", advice_very: "Elak aktiviti luar; tutup tingkap.",
  advice_hazardous: "Semua perlu di dalam rumah; risiko kesihatan serius.",
  sev_high: "Tinggi", sev_watch: "Perhatian", sev_advisory: "Nasihat", sev_danger: "Bahaya", sev_warning: "Waspada", sev_alert: "Amaran", sev_heavy: "Lebat",
  mag_strong: "Kuat", mag_moderate: "Sederhana", mag_light: "Ringan",
  wmo_clear: "Cerah", wmo_mostly: "Cerah Berawan", wmo_partly: "Separa Mendung", wmo_overcast: "Mendung",
  wmo_fog: "Kabut", wmo_drizzle: "Gerimis", wmo_lightrain: "Hujan Renyai", wmo_rain: "Hujan", wmo_heavy: "Hujan Lebat",
  wmo_showers: "Renyai", wmo_thunder: "Ribut Petir", wmo_snow: "Salji",
  stationsMap: "Peta stesen",
  aboutWhat: "OhAlam menghimpunkan data rasmi cuaca, kualiti udara, banjir dan bahaya Malaysia dalam satu pandangan yang mudah. Anda tidak perlu tahu agensi mana yang mengeluarkan nombor mana — OhAlam mengumpulkannya daripada mereka dan menjadikannya mudah dibaca.",
  aboutLead: "Data cuaca, udara, banjir dan bahaya rasmi Malaysia — digabungkan dalam satu paparan yang jelas.",
  featTitle: "Ciri-ciri",
  feat1: "Kualiti udara seluruh negara (68 stesen pemantauan, 16 negeri)",
  feat2: "Cuaca semasa, terasa seperti, kelembapan, angin dan UV",
  feat3: "Garis masa setiap jam dan ramalan 7 hari",
  feat4: "Amaran cuaca MET Malaysia secara langsung (di darat)",
  feat5: "Gempa bumi terkini di Asia Tenggara pada peta interaktif",
  feat6: "Melayu dan Inggeris, mod terang dan gelap, sesuai di telefon dan desktop",
  discText: "OhAlam ialah lapisan kemudahan di atas sumber awam rasmi — MET Malaysia, APIMS JAS, JPS InfoBanjir, NADMA dan USGS — dalam bahasa yang mudah. Ia bukan perkhidmatan kerajaan. Untuk keputusan keselamatan secara langsung, arahan semasa agensi rasmi didahulukan.",
  privTitle: "Dasar privasi",
  privText: "OhAlam tidak mengumpul data peribadi. Pilihan tema dan bahasa anda disimpan hanya di dalam pelayar anda (local storage) dan tidak pernah dihantar ke pelayan.",
  accuracyTitle: "Ketepatan data",
  dataNote: "Data dikumpul daripada agensi pihak ketiga dan mungkin berbeza daripada sumber lain atau dikemas kini pada masa berbeza. Ia disediakan seadanya, tanpa jaminan — sahkan dengan agensi rasmi sebelum bertindak.",
  contactTitle: "Hubungi",
  reportTitle: "Laporkan masalah",
  reportBtn: "Laporkan masalah",
  reportType: "Jenis",
  reportTypeData: "Data salah atau tiada",
  reportTypeBug: "Pepijat atau ciri rosak",
  reportTypeIdea: "Cadangan",
  reportDesc: "Terangkan masalah",
  reportDescPh: "Apa yang anda lihat, dan di mana?",
  reportEmail: "E-mel anda (pilihan)",
  reportSend: "Hantar",
  reportThanks: "Aplikasi e-mel anda sepatutnya dibuka dengan laporan sedia untuk dihantar.",
};

const D = { en, ms };
export const lang = $state({ code: "en" });

export function initLang() {
  try { const c = localStorage.getItem("alam-lang"); if (c === "ms" || c === "en") lang.code = c; } catch {}
  applyLang();
}
export function setLang(c) {
  lang.code = c;
  try { localStorage.setItem("alam-lang", c); } catch {}
  applyLang();
}
function applyLang() {
  if (typeof document !== "undefined") document.documentElement.lang = lang.code === "ms" ? "ms" : "en";
}
export function tr(k) {
  return (D[lang.code]?.[k] ?? en[k] ?? k);
}
export function trFmt(k, vars) {
  let s = tr(k);
  for (const [key, val] of Object.entries(vars)) s = s.replace(`{${key}}`, String(val));
  return s;
}
export function bandLabel(l) {
  const key = (l || "").trim().toLowerCase().replace(/\s+/g, "_");
  return `band_${key}` in en ? tr(`band_${key}`) : l || "";
}
export function bandAdvice(l) {
  const key = (l || "").trim().toLowerCase().replace(/\s+/g, "_");
  return `advice_${key}` in en ? tr(`advice_${key}`) : "";
}
export function severityWord(s) {
  return s >= 3 ? tr("sev_high") : s === 2 ? tr("sev_watch") : tr("sev_advisory");
}
export function magWordL(m) {
  return m >= 6 ? tr("mag_strong") : m >= 5 ? tr("mag_moderate") : tr("mag_light");
}
export function wmoLabel(label) {
  const base = (label || "").trim().toLowerCase().replace(/\s+/g, "_");
  for (const key of [base, base.replace(/s$/, "")]) if (`wmo_${key}` in en) return tr(`wmo_${key}`);
  return label || "";
}
