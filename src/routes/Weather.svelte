<script>
  import PageHeader from "../ui/PageHeader.svelte";
  import { app } from "../core/store.svelte.js";
  import { groupBy, shortState, cityOf } from "../domain/flags.js";
  import { wmo, isNightNow } from "../domain/weather-codes.js";
  import { mapPopup } from "../domain/popup.js";
  import { tr, trFmt, wmoLabel } from "../core/i18n.svelte.js";
  import MapView from "../ui/MapView.svelte";
  import Section from "../ui/Section.svelte";
  import Marquee from "../ui/Marquee.svelte";
  import WeatherDetail from "../features/weather/WeatherDetail.svelte";
  import Skeleton from "../ui/Skeleton.svelte";
  import EmptyState from "../ui/EmptyState.svelte";

  const weather = $derived(app.data?.weather ?? []);
  const towns = $derived(weather.filter((r) => r.kind === "weather"));
  const tempColor = (v) => (v >= 32 ? "#dc2626" : v >= 29 ? "#ef6c1a" : v >= 26 ? "#b3491a" : v >= 22 ? "#16a34a" : "#2563eb");
  const weatherPts = $derived(
    towns
      .filter((r) => r.coords?.lat)
      .map((r) => {
        const [icon, label] = wmo(String(r.meta?.code));
        const col = tempColor(r.value);
        return {
          lat: r.coords.lat, lon: r.coords.lon, emoji: icon, color: col, size: 28,
          html: mapPopup({ title: r.stationName, value: `${Math.round(r.value)}°`, valueColor: col, flag: `${icon} ${wmoLabel(label)}` }),
        };
      }),
  );
  const scopeGroups = $derived(groupBy(towns.slice().sort((a, b) => a.meta?.state?.localeCompare(b.meta?.state) || 0), (r) => r.meta?.state ?? ""));
  const avg = $derived(towns.length ? towns.reduce((s, r) => s + r.value, 0) / towns.length : null);
  const hi = $derived(towns.length ? Math.max(...towns.map((r) => r.value)) : null);
  const lo = $derived(towns.length ? Math.min(...towns.map((r) => r.value)) : null);

  /** Tapping a card or map marker inspects that town without changing the saved location. */
  const picked = $derived(app.picked);
</script>

{#if picked}
  <WeatherDetail station={picked} onClose={() => (app.picked = null)} />
{:else if app.scope === "near"}
  <WeatherDetail station={app.town} />
{:else}
  {@const scopeLabel = app.scope === "malaysia" ? "Malaysia" : shortState(app.state)}
  <PageHeader title={`${tr("navWeather")} · ${scopeLabel}`} updated={app.updated} source="MET Malaysia / Open-Meteo" />
  {#if app.loading && !towns.length}
    <div class="mt-1 space-y-3">
      <Skeleton h={256} class="!rounded-2xl" />
      <Skeleton h={14} w="40%" />
      <Skeleton h={60} class="!rounded-2xl" />
      <Skeleton h={60} class="!rounded-2xl" />
    </div>
  {:else if towns.length === 0}
    <EmptyState icon="⛅" title={trFmt("noWeatherAny", { scope: scopeLabel })} desc={tr("noWeatherHint")} />
  {:else}
    {#if weatherPts.length}
      <MapView pts={weatherPts} onPick={(id) => (app.picked = id)} class="h-72 w-full rounded-2xl lg:h-[52vh] lg:min-h-[400px]" fitMax={app.scope === "state" ? 9 : 8} />
    {/if}
    {#if avg != null}
      <div class="mt-3 mb-2 grid grid-cols-3 gap-1.5">
        <div class="card px-3 py-2"><div class="text-[11px] leading-tight text-muted">{tr("avgTemp")}</div><div class="num mt-0.5 text-[17px] font-bold">{Math.round(avg)}°</div></div>
        <div class="card px-3 py-2"><div class="text-[11px] leading-tight text-muted">{tr("highTemp")}</div><div class="num mt-0.5 text-[17px] font-bold">{Math.round(hi)}°</div></div>
        <div class="card px-3 py-2"><div class="text-[11px] leading-tight text-muted">{tr("lowTemp")}</div><div class="num mt-0.5 text-[17px] font-bold">{Math.round(lo)}°</div></div>
      </div>
    {/if}
    {#each scopeGroups as g (g.key)}
      <Section title={g.key} startOpen={scopeGroups.length === 1}>
        <ul class="mt-1 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-4">
          {#each g.items as r (r.station)}
            {@const [icon, label] = wmo(String(r.meta?.code), isNightNow(r.meta))}
            <li>
              <button class="card card-hover flex h-[62px] w-full items-center gap-2.5 p-3 text-left" onclick={() => (app.picked = r.station)}>
                <span class="text-[24px] leading-none" aria-hidden="true">{icon}</span>
                <span class="min-w-0 flex-1">
                  <Marquee text={cityOf(r.stationName)} class="text-[13px] font-semibold leading-snug" />
                  <span class="block truncate text-[12px] text-muted">{wmoLabel(label)}</span>
                </span>
                <span class="num shrink-0 text-[17px] font-bold" style="color:{tempColor(r.value)}">{Math.round(r.value)}°</span>
              </button>
            </li>
          {/each}
        </ul>
      </Section>
    {/each}
  {/if}
{/if}