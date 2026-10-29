<script>
    import { app } from "../../core/store.svelte.js";
    import { tr, trFmt } from "../../core/i18n.svelte.js";
    import { mapPopup } from "../../domain/popup.js";
    import MapView from "../../ui/MapView.svelte";
    import Section from "../../ui/Section.svelte";
    import FilterPills from "../../ui/FilterPills.svelte";
    import FloodRow from "./FloodRow.svelte";
    import Skeleton from "../../ui/Skeleton.svelte";
    import EmptyState from "../../ui/EmptyState.svelte";
    import Legend from "../../ui/Legend.svelte";
    import Icon from "../../ui/Icon.svelte";

    /** Presentational: parent fetches and passes river/rain/loading/state/sevFilter.
     * state "" = all Malaysia (grouped by collapsible state); otherwise one state.
     * sevFilter "" = all severities, else only that severity. */
    let { river = [], rain = [], loading = false, state = "", sevFilter = "", present = [], total = 0, highest = null, onSev = null } = $props();

    const PIN_COLOR = { Danger: "#a51110", Warning: "#e05d2b", Alert: "#b26a00", Heavy: "#3b6ea8", Moderate: "#6f8fb0" };

    // The feed can list a station more than once — show each station once (worst severity).
    const RANK = { Danger: 0, Warning: 1, Alert: 2, Moderate: 3, Heavy: 3 };
    const dedupe = (list) => {
      const m = new Map();
      for (const a of list) {
        const cur = m.get(a.station);
        const rk = RANK[a.severity] ?? 9;
        if (!cur || rk < (RANK[cur.severity] ?? 9)) m.set(a.station, a);
      }
      return [...m.values()];
    };

    const friver = $derived(dedupe(sevFilter ? river.filter((a) => a.severity === sevFilter) : river));
    const frain = $derived(dedupe(sevFilter ? rain.filter((a) => a.severity === sevFilter) : rain));
    const hasData = $derived(friver.length > 0 || frain.length > 0);
    const displayState = $derived(state || app.state || "Malaysia");

    const floodPts = $derived.by(() => {
      const out = [];
      for (const a of friver) {
        if (typeof a.lat === "number" && typeof a.lon === "number") {
          out.push({
            lat: a.lat, lon: a.lon, color: PIN_COLOR[a.severity] ?? "#8a8277", num: Number(a.level).toFixed(1), size: 24,
            html: mapPopup({ title: a.stationName, value: `${a.level} m`, valueColor: PIN_COLOR[a.severity] ?? "#6b6258", flag: a.severity, sub: `${a.district}, ${a.state}` }),
          });
        }
      }
      for (const a of frain) {
        if (typeof a.lat === "number" && typeof a.lon === "number") {
          out.push({
            lat: a.lat, lon: a.lon, color: PIN_COLOR[a.severity] ?? "#6f8fb0", num: String(Math.round(a.mmHour)), size: 20,
            html: mapPopup({ title: a.stationName, value: `${a.mmHour} mm/hr`, valueColor: PIN_COLOR[a.severity] ?? "#6b6258", flag: a.severity, sub: `${a.district}, ${a.state}` }),
          });
        }
      }
      return out;
    });

    // All-Malaysia view: one collapsible section per state (river + rain rows inside).
    const sections = $derived.by(() => {
      const map = new Map();
      const add = (list, isRain) => {
        for (const a of list) {
          const k = a.state || "Other";
          let g = map.get(k);
          if (!g) { g = { state: k, river: [], rain: [] }; map.set(k, g); }
          (isRain ? g.rain : g.river).push(a);
        }
      };
      add(friver, false);
      add(frain, true);
      return [...map.values()].sort((a, b) => a.state.localeCompare(b.state));
    });
  </script>

  {#if loading && !hasData}
    <div class="space-y-2">
      <Skeleton h={288} class="!rounded-2xl" />
      <Skeleton h={58} class="!rounded-2xl" />
      <Skeleton h={58} class="!rounded-2xl" />
      <Skeleton h={58} class="!rounded-2xl" />
    </div>
  {:else if hasData}
    {#if present.length}
      {@const topC = PIN_COLOR[present[0]?.s] ?? "#b26a00"}
      <div class="mb-3 flex items-start gap-3 rounded-2xl border-2 p-3.5" style="border-color:color-mix(in srgb,{topC} 55%, transparent);background:color-mix(in srgb,{topC} 9%, var(--color-panel))">
        <span class="grid size-9 shrink-0 place-items-center rounded-xl" style="background:color-mix(in srgb,{topC} 16%,transparent);color:{topC}"><Icon name="alert" size={18} /></span>
        <div class="min-w-0">
          <div class="text-[15px] font-bold" style="color:{topC}">{trFmt("floodRiskNow", { n: total })}</div>
          <p class="mt-0.5 text-[12.5px] text-muted">{tr("floodRiskAct")}</p>
        </div>
      </div>
    {/if}
    {#if floodPts.length}
      <MapView pts={floodPts} class="mb-3 h-72 w-full rounded-2xl lg:h-[52vh] lg:min-h-[400px]" fitMax={9} />
    {/if}

    <!-- Severity filter: compact pills (the old cards read as unexplained counts) -->
    {#if total}
      <FilterPills pills={[{ key: "", label: tr("floodSevAll"), count: total, color: "#8a8277" }, ...present.map((p) => ({ key: p.s, label: p.label, count: p.n, color: p.c }))]} value={sevFilter} onPick={(k) => onSev?.(k)} class="mb-2" />
    {/if}
    {#if present.length}
      {@const floodLevel = [
        { color: "#b26a00", label: tr("floodMeanAlert") },
        { color: "#e05d2b", label: tr("floodMeanWarning") },
        { color: "#a51110", label: tr("floodMeanDanger") },
        { color: "#3b6ea8", label: tr("floodMeanHeavy") },
      ]}
      <Legend title={tr("floodLevelTitle")} items={floodLevel} columns={2} class="mb-3" />
    {/if}
    {#if highest}
      <div class="card mb-3 flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
        <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-panel-2" aria-hidden="true">🔺</span>
        <span>{tr("floodHighest")} <span class="num font-bold">{highest.level} m</span> · {highest.district ?? highest.stationName}</span>
      </div>
    {/if}
    {#if state}
      {#if friver.length}
        <div class="eyebrow mb-1.5 mt-1">{tr("floodRiver")}</div>
        <ul class="list-none m-0 space-y-2 p-0">
          {#each friver as a, i (i)}
            <FloodRow {a} />
          {/each}
        </ul>
      {/if}
      {#if frain.length}
        <div class="eyebrow mb-1.5 mt-4">{tr("floodRain")}</div>
        <ul class="list-none m-0 space-y-2 p-0">
          {#each frain as a, i1 (i1)}
            <FloodRow {a} isRain />
          {/each}
        </ul>
      {/if}
    {:else}
      {#each sections as sec (sec.state)}
        <Section title={sec.state} startOpen={false}>
          {#if sec.river.length}
            <div class="eyebrow mb-1.5 mt-1">{tr("floodRiver")}</div>
            <ul class="list-none m-0 space-y-2 p-0">
              {#each sec.river as a, i (i)}
                <FloodRow {a} />
              {/each}
            </ul>
          {/if}
          {#if sec.rain.length}
            <div class="eyebrow mb-1.5 mt-4">{tr("floodRain")}</div>
            <ul class="list-none m-0 space-y-2 p-0">
              {#each sec.rain as a, i1 (i1)}
                <FloodRow {a} isRain />
              {/each}
            </ul>
          {/if}
        </Section>
      {/each}
    {/if}
  {:else}
    <EmptyState
      icon="💧"
      title={trFmt("floodNone", { state: displayState })}
      desc={tr("floodMonitor")}
      action={state ? { label: tr("viewMalaysia"), onClick: () => (app.scope = "malaysia") } : null}
    />
  {/if}