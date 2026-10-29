<script>
    import { app, load } from "../core/store.svelte.js";
    import { numColor, atTown, severityColor, apiBandOf, hourLabel } from "../domain/flags.js";
    import { wmo, isNightNow } from "../domain/weather-codes.js";
    import { tr, bandLabel } from "../core/i18n.svelte.js";
    import WeatherBanner from "../features/weather/WeatherBanner.svelte";
    import AtAGlance from "../ui/AtAGlance.svelte";
    import EmptyState from "../ui/EmptyState.svelte";
    import Icon from "../ui/Icon.svelte";
    import { sharePayload } from "../domain/share.js";
    import { activeWarnings } from "../domain/warnings.js";
    import { getFlood } from "../core/api.js";
    import { createLoader } from "../core/async.js";
    import Skeleton from "../ui/Skeleton.svelte";
    import Warnings from "../features/hazards/Warnings.svelte";
    import { pushSupported, pushEnabled, subscribePush, unsubscribePush } from "../core/push.js";

    let { onNavigate = () => {} } = $props();

    const weather = $derived(app.data?.weather ?? []);
    const stations = $derived((app.data?.stations ?? []).slice().sort((a, b) => b.value - a.value));
    const townName = $derived(weather.find((r) => r.station === app.town && r.kind === "weather")?.stationName ?? app.data?.allTowns?.find((t) => t.station === app.town)?.name ?? app.town ?? "");
    const now = $derived(weather.find((r) => r.station === app.town && r.kind === "weather"));
    const air = $derived(weather.find((r) => r.station === app.town && r.kind === "aqi"));
    const townAir = $derived(stations.find((s) => atTown(s, townName, app.town)) ?? null);
    const warnings = $derived(activeWarnings(app.data?.hazards?.warnings ?? []));
    const quakes = $derived(app.data?.hazards?.earthquakes ?? []);
    const climate = $derived(app.data?.hazards?.climate ?? null);

    const wmo2 = $derived.by(() => (now?.meta?.code != null ? wmo(String(now.meta.code), isNightNow(now.meta)) : ["", ""]));
    const bannerAqi = $derived(
      townAir
        ? { value: townAir.value, band: bandLabel(townAir.band?.label), color: numColor(townAir.band?.label) }
        : air
          ? { value: Math.round(air.value), band: bandLabel(apiBandOf(air.value)), color: numColor(apiBandOf(air.value)) }
          : null,
    );

    // Hero extras from the town's own hourly series (hi/lo + next rain chance).
    const hourlyTown = $derived((app.data?.hourly ?? []).filter((r) => r.station === app.town));
    const dayHiLo = $derived.by(() => {
      const vals = hourlyTown.map((h) => Number(h.value)).filter(Number.isFinite);
      return vals.length ? { hi: Math.max(...vals), lo: Math.min(...vals) } : { hi: null, lo: null };
    });
    const nextRainChance = $derived.by(() => {
      const n = hourlyTown.find((h) => Number(h.meta?.precip || 0) >= 30);
      return n ? Number(n.meta.precip) : null;
    });
    const nextRainAt = $derived.by(() => {
      const n = hourlyTown.find((h) => Number(h.meta?.precip || 0) >= 30);
      return n ? hourLabel(n.measuredAt) : "";
    });

    // Lightweight live flood count for the homepage chip (independent of the Flood tab).
    // Scoped to the current view scope so the number always matches what the Flood page
    // shows when tapped (Malaysia = whole country; Near/State = that state).
    let floodCount = $state(0);
    let floodLoaded = $state(false);
    let floodErrored = $state(false);
    const loadFlood = createLoader();
    $effect(() => {
      const scopeState = app.scope === "malaysia" ? undefined : app.state || undefined;
      loadFlood(() => getFlood(scopeState), {
        onValue: (r) => { floodCount = (r?.river?.length ?? 0) + (r?.rain?.length ?? 0); floodLoaded = true; floodErrored = false; },
        onError: () => { floodLoaded = true; floodErrored = true; },
      });
    });

    let flash = $state(false);
    const jump = (id, highlight = false) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!highlight) return;
      flash = true;
      setTimeout(() => (flash = false), 1600);
    };

    const OFFICIAL = [
      { name: "MET Malaysia", by: "Weather & warnings", href: "https://www.met.gov.my/", icon: "weather" },
      { name: "JPS InfoBanjir", by: "River levels & floods", href: "https://publicinfobanjir.water.gov.my/", icon: "flood" },
      { name: "DOE APIMS", by: "Air quality", href: "https://apims.doe.gov.my/", icon: "air" },
      { name: "NADMA", by: "Disaster info", href: "https://portalbencana.nadma.gov.my/", icon: "shield" },
      { name: "USGS", by: "Earthquakes", href: "https://earthquake.usgs.gov/", icon: "quake" },
    ];

    // Personal device alerts (Web Push) for the saved location.
    let pushStat = $state("loading");
    $effect(() => {
      if (!pushSupported()) { pushStat = "unsupported"; return; }
      pushEnabled().then((v) => (pushStat = v ? "on" : "off"));
    });
    async function togglePush() {
      if (pushStat === "on") { pushStat = "busy"; const r = await unsubscribePush(); pushStat = r.status === "unsubscribed" ? "off" : pushStat; return; }
      pushStat = "busy";
      const r = await subscribePush(app.town || "", app.state || "");
      pushStat = r.status === "subscribed" ? "on" : r.status === "denied" ? "denied" : "off";
    }
  </script>

  {#if now}
    {@const payload = sharePayload({ town: townName, state: app.state, now, townAir, air, warnings, floodCount, high: dayHiLo.hi, low: dayHiLo.lo, precip: nextRainChance, rainAt: nextRainAt })}
    <div class="mt-1">
      <WeatherBanner icon={wmo2[0]} label={wmo2[1] || tr("weather")} temp={now.value} feels={now.meta?.apparentTemp ?? now.value} townName={townName} appState={app.state || ""} aqi={bannerAqi} town={app.town} state={app.state} share={payload} high={dayHiLo.hi} low={dayHiLo.lo} rainChance={nextRainChance} humidity={now.meta?.humidity} wind={now.meta?.wind} />
    </div>
  {:else if app.loading}
    <div class="mt-1 h-[190px] rounded-2xl border border-line bg-panel p-4">
      <Skeleton h={18} w="55%" />
      <div class="mt-10 flex items-end justify-between gap-3">
        <Skeleton h={44} w="42%" />
        <Skeleton h={64} w="92px" class="!rounded-2xl" />
      </div>
    </div>
  {/if}

  {#if !app.data && !app.loading}
    <EmptyState icon="⚠️" title={tr("loadFailed")} action={{ label: tr("retry"), onClick: () => load() }} class="mt-2" />
  {:else}
    <!-- Primary answer first: a compact at-a-glance, then the full advisories below. -->
    <h2 class="qh">{tr("atAGlance")}</h2>
    <AtAGlance
      onTap={(k) => {
        if (k === "floods" || k === "quakes") { app.hazard = k === "floods" ? "flood" : "earthquakes"; onNavigate("hazards"); }
        else jump("advisories", k === "warnings");
      }}
      items={[
        { key: "warnings", icon: "⚠️", label: tr("glanceWarnings"), value: `${warnings.length}`, color: warnings.length ? severityColor(warnings[0].severity) : "var(--color-muted)" },
        { key: "floods", icon: "🌊", label: tr("glanceFloods"), value: floodLoaded ? (floodErrored ? "—" : `${floodCount}`) : "…", color: floodCount ? "var(--color-unhealthy)" : "var(--color-muted)" },
        { key: "quakes", icon: "🌐", label: tr("glanceQuakes"), value: `${quakes.length}`, color: quakes.length ? "#9333ea" : "var(--color-muted)" },
        { key: "climate", icon: "🌡️", label: tr("glanceClimate"), value: climate?.meta?.phase || "", color: climate ? "#b26a00" : "var(--color-muted)" },
      ]}
    />
    {#if pushSupported()}
      <div class="card mt-3 flex items-center justify-between gap-3 p-3.5">
        <div class="flex min-w-0 items-center gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon name="bell" size={17} /></span>
          <div class="min-w-0">
            <div class="text-[13.5px] font-semibold">{tr("enableAlerts")}</div>
            <div class="mt-0.5 truncate text-[12px] text-muted">{townName || app.town}{#if app.state}, {app.state}{/if} · {tr("alertsOnHint")}</div>
          </div>
        </div>
        <button class="shrink-0" class:btn-primary={pushStat !== "on"} class:ghostbtn={pushStat === "on"} onclick={togglePush} disabled={pushStat === "busy"}>
          {pushStat === "on" ? tr("alertsOn") : pushStat === "denied" ? tr("alertsDenied") : tr("enableAlerts")}
        </button>
      </div>
    {/if}

    {#if app.updated}
      <p class="caption mt-2 flex items-center gap-1.5 text-faint"><Icon name="clock" size={13} /> {tr("updated")} {app.updated}</p>
    {/if}
  {/if}

  <h2 class="qh" id="advisories" class:text-accent={flash}>{tr("advisories")}</h2>
  <Warnings />
  {#if climate}
    {@const phase = climate.meta?.phase || "Neutral"}
    {@const v = climate.meta?.value}
    {@const season = climate.meta?.season}
    <div class="card mt-3 flex items-start gap-3 p-3.5">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-panel-2 text-[17px]" aria-hidden="true">🌡️</span>
      <div class="min-w-0">
        <div class="text-[13.5px] font-semibold">{phase.includes("El Niño") ? tr("climateEl") : phase.includes("La Niña") ? tr("climateLa") : tr("climateNeutral")}{#if v != null}<span class="num ml-1 font-normal text-muted">{v > 0 ? "+" : ""}{v}°C{#if season} ({season}){/if}</span>{/if}</div>
        <p class="caption mt-0.5">{phase.includes("El Niño") ? tr("climateElEffect") : phase.includes("La Niña") ? tr("climateLaEffect") : tr("climateNeutralEffect")}</p>
      </div>
    </div>
  {/if}

  <p class="caption mt-4 leading-relaxed">{tr("homeIntro")}</p>

  <h2 class="qh">{tr("srcTitle")}</h2>
  <p class="caption -mt-1 mb-2">{tr("srcHint")}</p>
  <div class="grid gap-2 sm:grid-cols-2">
    {#each OFFICIAL as s (s.href)}
      <a class="card card-hover flex items-center gap-3 p-3" href={s.href} target="_blank" rel="noopener">
        <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-panel-2 text-muted"><Icon name={s.icon} size={17} /></span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[14px] font-semibold">{s.name}</span>
          <span class="block truncate text-[12px] text-muted">{s.by}</span>
        </span>
        <Icon name="external" size={15} class="shrink-0 text-faint" />
      </a>
    {/each}
  </div>