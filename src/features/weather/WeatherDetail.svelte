<script>
import { app } from "../../core/store.svelte.js";
import { getOfficial, getHistory, getHaze } from "../../core/api.js";
import { moonPhase, numColor, uvWord, hourLabel } from "../../domain/flags.js";
import { wmo, isNightNow } from "../../domain/weather-codes.js";
import { mapPopup } from "../../domain/popup.js";
import { tr, trFmt, wmoLabel, bandLabel, bandAdvice } from "../../core/i18n.svelte.js";
import { shareCard } from "../../domain/sharecard.js";
import { createLoader } from "../../core/async.js";
import Carousel from "../../ui/Carousel.svelte";
import StatCard from "../../ui/StatCard.svelte";
import MapView from "../../ui/MapView.svelte";
import TrendChart from "../../ui/TrendChart.svelte";
import Spinner from "../../ui/Spinner.svelte";
import Skeleton from "../../ui/Skeleton.svelte";
import ShareButton from "../../ui/ShareButton.svelte";
import EmptyState from "../../ui/EmptyState.svelte";
import Icon from "../../ui/Icon.svelte";
import { weatherSharePayload } from "../../domain/share.js";

/** Full detail for ONE town — reused by "near me" and by tapping a card anywhere. */
let { station = "", onClose = null } = $props();

const weather = $derived(app.data?.weather ?? []);
const towns = $derived(weather.filter((r) => r.kind === "weather"));
const now = $derived(towns.find((r) => r.station === station));
const townName = $derived(now?.stationName ?? app.data?.allTowns?.find((t) => t.station === station)?.name ?? "");
const stateName = $derived(now?.meta?.state ?? app.state ?? "");
const air = $derived(weather.find((r) => r.station === station && r.kind === "aqi"));
const stations = $derived(app.data?.stations ?? []);
const townAir = $derived(stations.find((s) => s.station === station) ?? null);
const hourly = $derived((app.data?.hourly ?? []).filter((r) => r.station === station).sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)));
let airSeries = $state([]);
let airLoading = $state(false);
const loadAir = createLoader();
$effect(() => {
  const st = townAir?.station;
  if (!st) { airSeries = []; return; }
  airLoading = true;
  loadAir(() => getHistory("doe-eqms", st, 24), {
    onValue: (res) => (airSeries = (res.history ?? []).map((r) => ({ t: r.measuredAt, v: r.value }))),
    onError: () => (airSeries = []),
    onSettled: () => (airLoading = false),
  });
});
const moon = moonPhase();

// Haze outlook (model PM2.5) for this town — included on the share card.
let haze = $state([]);
const loadHaze = createLoader();
$effect(() => {
  const st = station;
  if (!st) { haze = []; return; }
  loadHaze(() => getHaze(st), {
    onValue: (r) => (haze = r.haze ?? []),
    onError: () => (haze = []),
  });
});
const todayHaze = $derived(haze[0] ?? null);

const mapPts = $derived(
  towns
    .filter((r) => r.coords?.lat)
    .map((r) => {
      const [icon] = wmo(String(r.meta?.code), isNightNow(r.meta));
      const on = r.station === station;
      return { id: r.station, lat: r.coords.lat, lon: r.coords.lon, emoji: icon, color: on ? "#e0451f" : "#8a94a3", size: on ? 30 : 22, html: mapPopup({ title: r.stationName, value: `${Math.round(r.value)}°`, valueColor: "#5a6675" }) };
    }),
);
const focus = $derived(now?.coords ? { lat: now.coords.lat, lon: now.coords.lon, zoom: 9 } : null);

// MET official forecast for this town's state/district.
let official = $state([]);
let officialLoading = $state(false);
const loadOfficial = createLoader();
$effect(() => {
  const st = stateName;
  if (!st) return;
  officialLoading = true;
  loadOfficial(() => getOfficial(st, station), {
    onValue: (r) => (official = r.official ?? []),
    onError: () => (official = []),
    onSettled: () => (officialLoading = false),
  });
});
// Rows are already scoped to this town's district by the API (town -> district
// mapping lives there, next to the locality and district data). Array.prototype.at
// keeps this a plain read: no district resolved means no rows, so nothing renders.
const district = $derived(official.at(0) ?? null);
const districtDays = $derived(district ? official.filter((o) => o.district === district.district) : []);
const dayName = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d + "T00:00:00").getDay()];
// For the 7-day range strip: full-week temp bounds so every day shares the same scale.
const wkDays = $derived(districtDays.slice(0, 7));
const wkLo = $derived(wkDays.length ? Math.min(...wkDays.map((d) => d.tmin ?? 0)) : 0);
const wkHi = $derived(wkDays.length ? Math.max(...wkDays.map((d) => d.tmax ?? 0)) : 1);
const wkSpan = $derived(Math.max(1, wkHi - wkLo));
const barPct = (v) => Math.max(0, Math.min(100, ((v - wkLo) / wkSpan) * 100));
let selDay = $state(0);
// MET's district forecast is Malay free-text; pick a stand-in icon from the wording.
const metIcon = (text) => {
  const t = (text || "").toLowerCase();
  if (/petir|ribut|thunder|storm/.test(t)) return "⛈️";
  if (/lebat|heavy rain/.test(t)) return "🌧️";
  if (/hujan|rain|shower|gerimis|setempat|scattered|localised/.test(t)) return "🌦️";
  if (/kabus|kabut|fog|jerebu|haze/.test(t)) return "🌫️";
  if (/mendung|berawan|overcast|cloudy/.test(t)) return "☁️";
  if (/cerah|panas|sunny|clear|cuaca baik|hot/.test(t)) return "☀️";
  return "🌤️";
};
const hm = (t) => (t ? String(t).slice(11, 16) : "—");
// Rain-first: surface the next hour with real rain chance + today's range right under
// the temperature (Malaysians ask "will it rain later?" before anything else).
const nextRain = $derived(hourly.find((h) => Number(h.meta?.precip || 0) >= 30) ?? null);
const todayHiLo = $derived.by(() => {
  const vals = hourly.map((h) => Number(h.value)).filter(Number.isFinite);
  return vals.length ? { hi: Math.round(Math.max(...vals)), lo: Math.round(Math.min(...vals)) } : null;
});
</script>

{#if now}
  {@const [icon, label] = now.meta?.code != null ? wmo(String(now.meta.code), isNightNow(now.meta)) : [null, null]}
  <div class="mt-1">
    <div class="flex items-center justify-between gap-2">
      <h1 class="min-w-0 truncate text-[19px] font-extrabold tracking-tight">{townName}{#if stateName}<span class="font-semibold text-muted">, {stateName}</span>{/if}</h1>
      <div class="flex shrink-0 gap-1.5">
        {#if onClose}<button class="iconbtn inline-flex items-center gap-1.5 whitespace-nowrap !px-2.5" onclick={onClose} aria-label={tr("back")} title={tr("back")}><Icon name="arrowLeft" size={16} /><span class="hidden sm:inline">{tr("back")}</span></button>{/if}
        <ShareButton payload={weatherSharePayload({ town: townName, state: stateName, now, humidity: now.meta?.humidity, wind: now.meta?.wind, high: todayHiLo?.hi, low: todayHiLo?.lo, feels: now.meta?.apparentTemp, haze: todayHaze ? Math.round(todayHaze.pm25Max) : null, precip: nextRain ? nextRain.meta?.precip : null, rainAt: nextRain ? hourLabel(nextRain.measuredAt) : "" })} />
      </div>
    </div>

    <div class="card mt-2 overflow-hidden">
      <div class="flex items-center gap-4 p-4">
        {#if icon}<span class="grid size-16 shrink-0 place-items-center rounded-2xl bg-panel-2 text-[38px] leading-none" aria-hidden="true">{icon}</span>{/if}
        <div class="min-w-0 flex-1">
          <div class="num text-[50px] font-extrabold leading-none tracking-tighter">{Math.round(now.value)}°</div>
          <div class="mt-1 truncate text-[13.5px] text-muted">{tr("feels")} {Math.round(now.meta?.apparentTemp ?? now.value)}° · {wmoLabel(label)}</div>
        </div>
      </div>
      <div class="grid grid-cols-2 border-t border-line">
        <div class="border-r border-line p-3">
          <div class="text-[11.5px] font-medium text-muted">{tr("rainChance")}</div>
          {#if nextRain}
            <div class="num mt-0.5 text-[17px] font-bold">{Math.round(nextRain.meta.precip)}%</div>
            <div class="text-[11px] text-faint">{tr("rainAt")} {hourLabel(nextRain.measuredAt)}</div>
          {:else}
            <div class="mt-0.5 text-[13px] text-muted">{tr("rainNoneSoon")}</div>
          {/if}
        </div>
        <div class="p-3">
          <div class="text-[11.5px] font-medium capitalize text-muted">{tr("high")} / {tr("low")}</div>
          {#if todayHiLo}
            <div class="num mt-0.5 text-[17px] font-bold">{todayHiLo.hi}° / {todayHiLo.lo}°</div>
            <div class="text-[11px] text-faint">{tr("today")}</div>
          {:else}
            <div class="mt-0.5 text-[13px] text-muted">–</div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if hourly.length}
    <Carousel class="mt-3">
      {#each hourly as h, i (h.measuredAt)}
        {@const [hIcon] = wmo(String(h.meta?.code))}
        <div class="card flex w-[24%] shrink-0 flex-col items-center px-2 py-3 sm:w-[18%]">
          <span class="text-[12px] text-muted">{i === 0 ? tr("today") : hourLabel(h.measuredAt)}</span>
          <span class="mt-1 text-[24px] leading-none" aria-hidden="true">{hIcon}</span>
          <span class="num mt-1 text-[15px] font-semibold">{Math.round(h.value)}°</span>
          {#if h.meta?.precip > 0}<span class="mt-0.5 text-[11px] text-muted">☔ {Math.round(h.meta.precip)}%</span>{/if}
        </div>
      {/each}
    </Carousel>
  {:else if app.loading}
    <p class="caption mt-2 text-[12px]">{tr("loading")}</p>
    <div class="flex gap-2 overflow-hidden">
      {#each Array(6) as _, i (i)}
        <Skeleton h={82} w="76px" class="!shrink-0 !rounded-2xl" />
      {/each}
    </div>
  {/if}

  <h2 class="qh">{tr("todayDetail")}</h2>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
    <StatCard label={`💨 ${tr("wind")}`} value={`${now.meta?.wind ?? "–"} km/h`} sub={`${tr("gust")} ${now.meta?.gust ?? "–"}`} />
    <StatCard label={`💧 ${tr("humidity")}`} value={`${now.meta?.humidity ?? "–"}%`} />
    <StatCard label={`❄️ ${tr("dewPoint")}`} value={now.meta?.dewPoint != null ? `${Math.round(now.meta.dewPoint)}°` : "–"} />
    <StatCard label={`🧭 ${tr("pressure")}`} value={now.meta?.pressure != null ? `${Math.round(now.meta.pressure)} hPa` : "–"} />
    <StatCard label={`👁 ${tr("visibility")}`} value={now.meta?.visibility != null ? `${(now.meta.visibility / 1000).toFixed(1)} km` : "–"} />
    <StatCard label={`☀️ ${tr("uv")}`} value={air?.meta?.uv ?? "–"} sub={air?.meta?.uv != null ? tr(uvWord(air.meta.uv)) : ""} />
    <StatCard label={`🌅 ${tr("sunrise")}`} value={hm(now.meta?.sunrise)} />
    <StatCard label={`🌇 ${tr("sunset")}`} value={hm(now.meta?.sunset)} />
    <div class="glass flex items-center gap-2.5 px-3.5 py-3"><span class="text-[22px]">{moon.emoji}</span><div><div class="text-[11.5px] font-medium text-muted">{tr("moon")}</div><div class="text-[14px] font-semibold">{moon.name}</div></div></div>
  </div>

  {#if townAir && airSeries.length >= 2}
    <h2 class="qh">{tr("airNow")}</h2>
    <div class="card p-3.5">
      <div class="flex items-baseline gap-2">
        <span class="num text-[28px] font-extrabold" style="color:{numColor(townAir.band?.label)}">{townAir.value}</span>
        <span class="text-[13px] font-semibold" style="color:{numColor(townAir.band?.label)}">{bandLabel(townAir.band?.label)}</span>
        <span class="text-[12px] text-faint">{tr("chartPast24")}</span>
      </div>
      {#if airLoading}
        <div class="flex h-[170px] items-center justify-center"><Spinner size={22} label={tr("loading")} /></div>
      {:else}
        <TrendChart series={airSeries} color={numColor(townAir.band?.label)} ariaLabel="Air quality trend" />
      {/if}
    </div>
  {/if}

  {#if officialLoading}
    <h2 class="qh">{tr("officialTitle")}</h2>
    <div class="mt-1 space-y-2">
      <Skeleton h={14} w="45%" />
      <Skeleton h={34} />
      <Skeleton h={34} />
      <Skeleton h={34} />
    </div>
  {:else if district}
    <h2 class="qh">{tr("officialTitle")}</h2>
    <p class="caption -mt-1">{tr("officialNote")} · {district.district}</p>
    <p class="caption -mt-0.5 mb-2">{tr("forecastLegend")}</p>
    {#if wkDays.length}
      <div class="grid grid-cols-7 gap-1 overflow-x-auto px-0.5 py-1">
        {#each wkDays as d, i (d.date)}
          {@const H = 64}
          {@const topPx = Math.round((1 - barPct(d.tmax ?? 0) / 100) * H)}
          {@const botPx = Math.round((barPct(d.tmin ?? 0) / 100) * H)}
          {@const barH = Math.max(4, H - topPx - botPx)}
          <button type="button" class="flex min-w-[48px] cursor-pointer flex-col items-center gap-1 rounded-xl pb-2 pt-1 transition" class:bg-panel={selDay === i} class:ring-2={selDay === i} class:ring-inset={selDay === i} class:ring-accent={selDay === i} onclick={() => (selDay = i)}>
            <span class="text-[11px] text-muted">{dayName(d.date)}</span>
            <span class="text-[17px] leading-none" aria-hidden="true">{metIcon(d.summary)}</span>
            <span class="relative block h-16 w-2.5 overflow-hidden rounded-full bg-line">
              <span class="absolute left-0 right-0 rounded-full" style="top:{topPx}px;height:{barH}px;background:#ef6c1a"></span>
            </span>
            <span class="text-[11.5px] font-semibold">{d.tmax}°</span>
            <span class="-mt-0.5 text-[10.5px] text-muted">{d.tmin}°</span>
          </button>
        {/each}
      </div>
      {#if wkDays[selDay]}
        <p class="caption mt-2">{wkDays[selDay].summary}{#if wkDays[selDay].when}<span class="text-muted"> · {wkDays[selDay].when}</span>{/if}</p>
      {/if}
    {/if}
  {/if}

  {#if mapPts.length}
    <h2 class="qh">{tr("stationsMap")}</h2>
    <MapView pts={mapPts} fit={!focus} focus={focus} onPick={(id) => (app.picked = id)} lazy class="h-72 w-full rounded-2xl lg:h-[52vh] lg:min-h-[400px]" />
  {/if}
{:else if app.loading}
  <div class="mt-2 space-y-3">
    <Skeleton h={16} w="40%" />
    <Skeleton h={72} w="55%" />
    <div class="flex gap-2 overflow-hidden">
      {#each Array(6) as _, i (i)}
        <Skeleton h={82} w="76px" class="!shrink-0 !rounded-2xl" />
      {/each}
    </div>
    <Skeleton h={14} w="30%" />
    <Skeleton h={64} class="!rounded-2xl" />
    <Skeleton h={14} w="22%" />
    <div class="flex gap-2 overflow-hidden">
      {#each Array(5) as _, i (i)}
        <Skeleton h={112} w="104px" class="!shrink-0 !rounded-2xl" />
      {/each}
    </div>
  </div>
{:else}
  <EmptyState icon="⛅" title={tr("noData")} desc={tr("noWeatherHint")} />
{/if}