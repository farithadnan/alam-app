<script>
    import { app } from "../../core/store.svelte.js";
    import { timeAgo, regionOf, friendlyLoc, magWord, magText, groupBy } from "../../domain/flags.js";
    import { tr, magWordL } from "../../core/i18n.svelte.js";
    import { mapPopup } from "../../domain/popup.js";
    import MapView from "../../ui/MapView.svelte";
    import PageHeader from "../../ui/PageHeader.svelte";
    import Section from "../../ui/Section.svelte";
    import FilterPills from "../../ui/FilterPills.svelte";
    import EmptyState from "../../ui/EmptyState.svelte";
    import Legend from "../../ui/Legend.svelte";
    import Disclosure from "../../ui/Disclosure.svelte";
    import Icon from "../../ui/Icon.svelte";

    const quakes = $derived(app.data?.hazards?.earthquakes ?? []);
    let magFilter = $state("all"); // all | strong | moderate | light
    const shown = $derived(
      magFilter === "all"
        ? quakes
        : quakes.filter((q) => (magFilter === "strong" ? q.magnitude >= 6 : magFilter === "moderate" ? q.magnitude >= 5 && q.magnitude < 6 : q.magnitude >= 4.5 && q.magnitude < 5)),
    );
    const quakePts = $derived(
      shown
        .filter((q) => q.meta?.lat && q.meta?.lon)
        .map((q) => {
          const col = magText(magWord(q.magnitude));
          const depth = q.meta?.depth != null ? `Depth ${Math.round(q.meta.depth)} km` : "";
          const flags = [q.meta?.tsunami === 1 ? "⚠ tsunami" : "", q.meta?.alert ? `alert ${q.meta.alert}` : ""].filter(Boolean).join(" · ");
          const meta = [depth, flags, regionOf(q.stationName)].filter(Boolean).join(" · ");
          return {
            lat: q.meta.lat, lon: q.meta.lon, color: col, num: Number(q.magnitude).toFixed(1), size: 26,
            html: mapPopup({ title: friendlyLoc(q.stationName) || q.stationName, value: `M${Number(q.magnitude).toFixed(1)}`, valueColor: col, flag: magWordL(q.magnitude), sub: meta }),
          };
        }),
    );
    const groups = $derived(groupBy(shown.slice().sort((a, b) => b.magnitude - a.magnitude), (q) => regionOf(q.stationName)));
    const MATCARDS = $derived([
      { id: "all", label: "All", n: quakes.length, color: "#8a94a3" },
      { id: "strong", label: "Strong 6.0+", n: quakes.filter((q) => q.magnitude >= 6).length, color: "#a51612" },
      { id: "moderate", label: "Moderate 5.0–5.9", n: quakes.filter((q) => q.magnitude >= 5 && q.magnitude < 6).length, color: "#b3491a" },
      { id: "light", label: "Light 4.5–4.9", n: quakes.filter((q) => q.magnitude < 5).length, color: "#6b6258" },
    ]);
    const alertColor = (a) => ({ green: "#16a34a", yellow: "#b26a00", orange: "#ef6c1a", red: "#dc2626" }[a] || "#6b6258");
    let open = $state(null);
  </script>

  <PageHeader title={tr("quakeTitle")} updated={app.updated} source="USGS / MET Malaysia" />
  <p class="caption mb-2">{tr("quakeCap")}</p>
  <div class="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
    <div class="min-w-0">
    {#if quakePts.length}
    <MapView pts={quakePts} class="h-72 w-full rounded-2xl lg:h-[52vh] lg:min-h-[400px]" fitMax={8} />
    {/if}

  <FilterPills allLabel="All" allValue="all" pills={MATCARDS.filter((c) => c.id !== "all").map((c) => ({ key: c.id, label: c.label, count: c.n, color: c.color }))} value={magFilter} onPick={(k) => (magFilter = k)} class="mt-3 mb-1" />
  <Legend
    title={tr("quakeGuide")}
    items={[
      { color: "#6b6258", label: tr("quakeGuideLight") },
      { color: "#b3491a", label: tr("quakeGuideMod") },
      { color: "#a51612", label: tr("quakeGuideStrong") },
    ]}
  />
  </div>
  <div class="mt-2 min-w-0 lg:mt-0">
  {#each groups as g (g.key)}
    <Section title={g.key} startOpen={groups.length === 1}>
      <ul class="list-none m-0 space-y-2 p-0">
        {#each g.items as q (q.station + q.measuredAt)}
          {@const qc = magText(magWord(q.magnitude))}
          <Disclosure open={open === q.station} onToggle={() => (open = open === q.station ? null : q.station)} accent={qc === "#6b6258" ? "var(--color-line)" : qc}>
            {#snippet header()}
              <span class="grid size-10 shrink-0 place-items-center rounded-xl text-[14px] font-extrabold" style="background:color-mix(in srgb,{qc} 13%, transparent);color:{qc}">{q.magnitude?.toFixed(1)}</span>
              <div class="min-w-0 flex-1">
                <div class="truncate text-[14.5px] font-semibold leading-tight">{friendlyLoc(q.stationName) || q.stationName}</div>
                <div class="mt-0.5 text-[12px] text-muted">{timeAgo(q.measuredAt)}</div>
              </div>
            {/snippet}
            {#if q.meta?.tsunami === 1}
              <p class="mb-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold" style="background:#dc26261a;color:#a51612">⚠ {tr("tsunamiFlag")}</p>
            {/if}
            <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted">
              <div>{tr("magnitude")}</div><div class="num text-fg">{q.magnitude?.toFixed(1)}{#if q.meta?.magType} <span class="text-muted">({q.meta.magType})</span>{/if}</div>
              <div>{tr("depth")}</div><div class="num text-fg">{q.meta?.depth != null ? Math.round(q.meta.depth) + " km" : "—"}</div>
              <div>{tr("region")}</div><div class="text-fg">{regionOf(q.stationName)}</div>
              {#if q.meta?.alert}<div>PAGER</div><div class="font-semibold" style="color:{alertColor(q.meta.alert)}">{q.meta.alert}</div>{/if}
              {#if q.meta?.mmi != null}<div>{tr("intensity")}</div><div class="num text-fg">MMI {q.meta.mmi}</div>{/if}
              {#if q.meta?.felt != null}<div>{tr("feltReports")}</div><div class="num text-fg">{q.meta.felt}</div>{/if}
              {#if q.meta?.tsunami != null}<div>{tr("tsunami")}</div><div class="text-fg">{q.meta.tsunami ? tr("yes") : tr("no")}</div>{/if}
              {#if q.meta?.cdi != null}<div>{tr("reportedIntensity")}</div><div class="num text-fg">MMI {q.meta.cdi}</div>{/if}
              {#if q.meta?.sig != null}<div>{tr("significance")}</div><div class="num text-fg">{q.meta.sig}</div>{/if}
              {#if q.meta?.eqType}<div>{tr("eventType")}</div><div class="text-fg">{q.meta.eqType}</div>{/if}
              {#if q.meta?.nst != null}<div>{tr("stationsUsed")}</div><div class="num text-fg">{q.meta.nst}</div>{/if}
              {#if q.meta?.status}<div>{tr("status")}</div><div class="text-fg">{q.meta.status}</div>{/if}
            </div>
            {#if q.meta?.url}<p class="m-0 mt-1.5"><a class="inline-flex items-center gap-1 font-medium text-accent underline" href={q.meta.url} target="_blank" rel="noopener">USGS event page <Icon name="external" size={13} /></a></p>{/if}
          </Disclosure>
        {/each}
      </ul>
    </Section>
  {/each}
  {#if !shown.length}
    <EmptyState icon="🌐" title={tr("noQuakesFilter")} desc={tr("noQuakesHint")} action={{ label: tr("viewAllQuakes"), onClick: () => (magFilter = "all") }} />
  {/if}
  </div>
</div>