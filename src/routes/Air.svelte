<script>
    import { app } from "../core/store.svelte.js";
    import { getHistory, getHaze } from "../core/api.js";
    import { numColor, cityOf, groupBy, atTown, uvWord, shortState } from "../domain/flags.js";
    import { bandCounts, seriesStats, legendOf, airMapPoints } from "../features/air/air.js";
    import ShareButton from "../ui/ShareButton.svelte";
    import PageHeader from "../ui/PageHeader.svelte";
    import FilterPills from "../ui/FilterPills.svelte";
    import { airSharePayload } from "../domain/share.js";
    import { createLoader } from "../core/async.js";
    import { tr, trFmt, bandLabel, bandAdvice } from "../core/i18n.svelte.js";
    import TrendChart from "../ui/TrendChart.svelte";
    import Spinner from "../ui/Spinner.svelte";
    import Skeleton from "../ui/Skeleton.svelte";
    import EmptyState from "../ui/EmptyState.svelte";
    import MapView from "../ui/MapView.svelte";
    import Section from "../ui/Section.svelte";
    import AqiMeter from "../features/air/AqiMeter.svelte";
    import AqiScale from "../ui/AqiScale.svelte";
    import Disclosure from "../ui/Disclosure.svelte";

    const stations = $derived((app.data?.stations ?? []).slice().sort((a, b) => b.value - a.value));
    const weather = $derived(app.data?.weather ?? []);
    const townName = $derived(weather.find((r) => r.station === app.town && r.kind === "weather")?.stationName ?? app.town ?? "");
    const airTown = $derived(weather.find((r) => r.station === app.town && r.kind === "aqi"));
    const heroAir = $derived(stations.find((s) => atTown(s, townName, app.town)) ?? stations[0] ?? null);

    const counts = $derived(bandCounts(stations));
    let bandFilter = $state(""); // "" = all, else a band label
    const shownStations = $derived(bandFilter ? stations.filter((o) => o.band?.label === bandFilter) : stations);
    const allPts = $derived(airMapPoints(shownStations));
    const mapFocus = $derived(open ? (() => { const s = stations.find((x) => x.station === open); return s?.coords ? { lat: s.coords.lat, lon: s.coords.lon, zoom: 11 } : null; })() : null);
    const legend = $derived(legendOf(stations));
    const groups = $derived(groupBy(shownStations, (s) => s.meta?.state ?? ""));

    let range = $state(24);
    let open = $state(null);

    /** The station currently being charted: the expanded row, or the "near me" hero. */
    const target = $derived(open ? stations.find((s) => s.station === open) ?? null : app.scope === "near" ? heroAir : null);
    let series = $state([]);
    let seriesLoading = $state(false);
    const loadSeries = createLoader();
    $effect(() => {
      const st = target?.station;
      const h = range;
      if (!st) { series = []; return; }
      seriesLoading = true;
      loadSeries(() => getHistory("doe-eqms", st, h), {
        onValue: (res) => (series = (res.history ?? []).map((r) => ({ t: r.measuredAt, v: r.value }))),
        onError: () => (series = []),
        onSettled: () => (seriesLoading = false),
      });
    });

    const stats = $derived(seriesStats(series));
    // Malaysia APIMS bands as chart risk-zones (Gemini: colour the danger thresholds).
    const AQI_ZONES = [[0, 50, "#16a34a"], [50, 100, "#e8a317"], [100, 200, "#ef6c1a"], [200, 300, "#dc2626"], [300, 1000, "#9333ea"]];
    const trendWord = $derived.by(() => {
      if (series.length < 2) return "";
      const d = (series[series.length - 1].v ?? 0) - (series[0].v ?? 0);
      return d > 2 ? tr("trendRising") : d < -2 ? tr("trendFalling") : tr("trendSteady");
    });
    const trendColor = $derived(trendWord === tr("trendRising") ? "#dc2626" : trendWord === tr("trendFalling") ? "#16a34a" : "var(--color-muted)");

    // Haze outlook (model PM2.5) for the saved town — dust belongs with air quality.
    let haze = $state([]);
    let hazeLoading = $state(false);
    const loadHaze = createLoader();
    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayLabel = (d) => (d === new Date().toISOString().slice(0, 10) ? tr("today") : DOW[new Date(`${d}T00:00:00`).getDay()]);
    const hazeBand = (v) => (v >= 55 ? "Unhealthy" : v >= 25 ? "Moderate" : "Good");
    const hazeEmoji = (b) => (b === "Unhealthy" ? "🟠" : b === "Moderate" ? "🟡" : "🟢");
    $effect(() => {
      const town = app.town;
      if (!town) { haze = []; return; }
      hazeLoading = true;
      loadHaze(() => getHaze(town), {
        onValue: (r) => (haze = r.haze ?? []),
        onError: () => (haze = []),
        onSettled: () => (hazeLoading = false),
      });
    });

    function setRange(h) {
      range = h;
    }

    function toggleRow(o) {
      open = open === o.station ? null : o.station;
      range = 24;
    }
  </script>

  <PageHeader title={`${tr("navAQI")} · ${app.scope === "malaysia" ? "Malaysia" : shortState(app.state)}`} updated={app.updated} source="DOE APIMS" />
  <p class="caption mb-2">{tr("aqiTip")}</p>
  <MapView pts={allPts} class="h-72 w-full rounded-2xl lg:h-[52vh] lg:min-h-[400px]" fitMax={app.scope === "near" ? 12 : app.scope === "state" ? 9 : 8} focus={mapFocus} />
  {#if legend.length}
    <div class="mt-3 flex flex-wrap items-center gap-2">
      {#each legend as [label, color] (label)}
        <span class="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[12px]"><span class="inline-block size-2.5 rounded-full" style="background:{color}"></span> {bandLabel(label)}</span>
      {/each}
    </div>
    <div class="mt-2"><AqiScale /></div>
  {/if}

  {#if app.scope !== "near" && counts.length}
    <h2 class="qh">{tr("catTitle")}</h2>
    <FilterPills allLabel="All" allValue="" pills={counts.map((c) => ({ key: c.label, label: bandLabel(c.label), count: c.n, color: numColor(c.label) }))} value={bandFilter} onPick={(k) => (bandFilter = bandFilter === k ? "" : k)} class="mt-1" />
  {/if}

  {#if app.scope !== "near" && stations.length > 3}
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <div class="card p-3.5">
        <div class="flex items-center gap-1.5 text-[12px] font-semibold text-muted"><span>🟢</span> {tr("cleanestNow")}</div>
        <ul class="mt-1.5 list-none p-0">
          {#each stations.slice().sort((a, b) => a.value - b.value).slice(0, 3) as s (s.station)}
            <li class="flex items-center justify-between py-1 text-[13px]">
              <span class="truncate">{cityOf(s.stationName)}</span>
              <span class="num font-bold" style="color:{numColor(s.band?.label)}">{s.value}</span>
            </li>
          {/each}
        </ul>
      </div>
      <div class="card p-3.5">
        <div class="flex items-center gap-1.5 text-[12px] font-semibold text-muted"><span>🔴</span> {tr("worstNow")}</div>
        <ul class="mt-1.5 list-none p-0">
          {#each stations.slice(0, 3) as s (s.station)}
            <li class="flex items-center justify-between py-1 text-[13px]">
              <span class="truncate">{cityOf(s.stationName)}</span>
              <span class="num font-bold" style="color:{numColor(s.band?.label)}">{s.value}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}

  {#if app.scope === "near" && heroAir}
    {@const hc = numColor(heroAir.band?.label)}
    <div class="mt-3 mb-2 flex items-center justify-between gap-2">
      <h2 class="qh !m-0">{cityOf(heroAir.stationName)}</h2>
      <ShareButton payload={airSharePayload({ station: cityOf(heroAir.stationName), state: app.state, value: heroAir.value, band: bandLabel(heroAir.band?.label), color: hc, advice: bandAdvice(heroAir.band?.label) || heroAir.band?.advice || "", worst: app.scope === "malaysia" && stations[0] ? `The worst spot today is ${cityOf(stations[0].stationName)} at AQI ${Math.round(stations[0].value)}, for context.` : "" })} />
    </div>
    <div class="card p-4" style="border-top:3px solid {hc}">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="num text-[48px] font-extrabold leading-none tracking-tighter" style="color:{hc}">{heroAir.value}</div>
          <div class="mt-1 text-[15px] font-bold" style="color:{hc}">{bandLabel(heroAir.band?.label)}</div>
        </div>
        <div class="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-panel-2 text-center">
          <div class="px-3 py-2"><div class="text-[10.5px] font-semibold text-muted">PM2.5</div><div class="num text-[16px] font-bold leading-tight">{airTown?.meta?.pm2_5 ?? "—"}</div><div class="text-[9.5px] text-faint">µg/m³</div></div>
          <div class="px-3 py-2"><div class="text-[10.5px] font-semibold text-muted">PM10</div><div class="num text-[16px] font-bold leading-tight">{airTown?.meta?.pm10 ?? "—"}</div><div class="text-[9.5px] text-faint">µg/m³</div></div>
          <div class="px-3 py-2"><div class="text-[10.5px] font-semibold text-muted">UV</div><div class="num text-[16px] font-bold leading-tight">{airTown?.meta?.uv ?? "—"}</div><div class="text-[9.5px] text-faint">{airTown?.meta?.uv != null ? tr(uvWord(airTown.meta.uv)) : "index"}</div></div>
        </div>
      </div>
      <div class="mt-3"><AqiMeter value={heroAir.value} color={hc} showLabels={false} /></div>
      <p class="mt-3 text-[13px] text-muted"><span class="font-semibold text-fg">{tr("outdoorActivity")}:</span> {bandAdvice(heroAir.band?.label) || heroAir.band?.advice}</p>
      {#if airTown?.meta?.pm2_5 != null}
        <p class="mt-1.5 text-[12.5px] text-muted">{tr("mainPollutant")}: <span class="font-semibold text-fg">PM2.5</span></p>
      {/if}
      <div class="mt-3 flex items-center justify-between gap-2">
        <div class="seg">
          <button class:on={range === 24} class="segbtn" onclick={() => setRange(24)}>24h</button>
          <button class:on={range === 168} class="segbtn" onclick={() => setRange(168)}>7d</button>
        </div>
        {#if trendWord}<span class="text-[12px] font-semibold" style="color:{trendColor}">{tr("trend")} {trendWord}</span>{/if}
      </div>
      <p class="caption mt-2 text-[12px]">{range === 24 ? tr("chartPast24") : tr("chartPast7d")}</p>
      {#if seriesLoading}
        <div class="flex h-[170px] items-center justify-center"><Spinner size={22} label={tr("loading")} /></div>
      {:else if series.length >= 2}
        <TrendChart series={series} color={hc} ariaLabel="Air quality trend" mode={range === 168 ? "days" : "hours"} zones={AQI_ZONES} />
        {#if stats}<p class="caption mt-1 text-[12px]">{"min " + stats.min + " · avg " + stats.avg + " · max " + stats.max}</p>{/if}
      {/if}
    </div>
  {:else}
    {#if app.loading && !stations.length}
      <div class="mt-2 space-y-2">
        <Skeleton h={14} w="35%" />
        <Skeleton h={60} class="!rounded-2xl" />
        <Skeleton h={60} class="!rounded-2xl" />
        <Skeleton h={60} class="!rounded-2xl" />
      </div>
    {:else if !stations.length}
      <EmptyState icon="🌫️" title={trFmt("noAirNow", { scope: app.scope === "malaysia" ? "Malaysia" : app.state || "your area" })} desc={tr("noAirHint")} />
    {:else}
    {#each groups as g (g.key)}
      <Section title={g.key} startOpen={groups.length === 1}>
        <ul class="list-none m-0 space-y-2 p-0">
          {#each g.items as o (o.station)}
            {@const oc = numColor(o.band?.label)}
            <Disclosure open={open === o.station} onToggle={() => toggleRow(o)} accent={oc}>
              {#snippet header()}
                <div class="min-w-0 flex-1">
                  <div class="text-[15px] font-semibold leading-tight">{cityOf(o.stationName)}</div>
                  <div class="mt-0.5 text-[12.5px]" style="color:{oc}">{bandLabel(o.band?.label)}</div>
                </div>
                <span class="num text-[22px] font-extrabold leading-none" style="color:{oc}">{o.value}</span>
              {/snippet}
              <AqiMeter value={o.value} color={oc} showLabels={false} />
              <p class="mt-2 text-[13px] text-muted">{bandAdvice(o.band?.label) || o.band?.advice}</p>
              <div class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12.5px] text-muted">
                {#if o.meta?.place}<div>{tr("stationLbl")}</div><div class="text-fg">{o.meta.place}</div>{/if}
                {#if o.meta?.category}<div>{tr("categoryLbl")}</div><div class="text-fg">{o.meta.category}</div>{/if}
                {#if o.meta?.region}<div>{tr("region")}</div><div class="text-fg">{o.meta.region}</div>{/if}
                {#if o.meta?.param}<div>{tr("parameter")}</div><div class="text-fg">{o.meta.param}</div>{/if}
                {#if o.meta?.pm10 != null}<div>PM10</div><div class="num text-fg">{o.meta.pm10}</div>{/if}
              </div>
              <div class="mt-2.5 flex gap-2">
                <button class:on={range === 24} class="segbtn" onclick={() => setRange(24)}>24h</button>
                <button class:on={range === 168} class="segbtn" onclick={() => setRange(168)}>7d</button>
              </div>
              <p class="caption mt-1 text-[12px]">{range === 24 ? tr("chartPast24") : tr("chartPast7d")}</p>
              {#if seriesLoading}
                <div class="flex h-[170px] items-center justify-center"><Spinner size={22} label={tr("loading")} /></div>
              {:else if series.length >= 2}
                <TrendChart series={series} color={oc} ariaLabel="Air quality trend" mode={range === 168 ? "days" : "hours"} zones={AQI_ZONES} />
                {#if stats}<p class="caption mt-1 text-[12px]">{"min " + stats.min + " · avg " + stats.avg + " · max " + stats.max}</p>{/if}
              {/if}
            </Disclosure>
          {/each}
        </ul>
      </Section>
    {/each}
    {/if}
  {/if}

  {#if app.scope === "near" && (hazeLoading || haze.length)}
    <h2 class="qh">{tr("hazeTitle")}<span class="font-semibold text-muted"> · {tr("yourTown")}</span></h2>
    {#if hazeLoading && !haze.length}
      <Skeleton h={54} class="!rounded-2xl" />
    {:else}
      <p class="caption mb-2">{tr("hazeHint")}</p>
      <ul class="list-none m-0 space-y-2 p-0">
        {#each haze.slice(0, 4) as d (d.date)}
          {@const hb = hazeBand(d.pm25Max)}
          <li class="card flex items-center gap-3 px-3.5 py-2.5 text-[13.5px]">
            <span class="w-12 shrink-0 text-muted">{dayLabel(d.date)}</span>
            <span class="shrink-0"><span class="badge" style="color:{numColor(hb)};border-color:{numColor(hb)};background:color-mix(in srgb,{numColor(hb)} 10%, transparent)">{hazeEmoji(hb)} {bandLabel(hb)}</span></span>
            <span class="num ml-auto shrink-0 text-[13px] font-bold">{Math.round(d.pm25Max)}<span class="text-muted"> µg/m³</span></span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}