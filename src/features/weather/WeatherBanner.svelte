<!--
  Homepage hero: a calm, condition-tinted panel that answers "what is it like
  right now?" at a glance — place, temperature, condition, key readings and a
  compact Air-now block. No particle scene; one soft condition gradient.
-->
<script>
  import { sceneOf } from "./scene.js";
  import Icon from "../../ui/Icon.svelte";
  import ShareButton from "../../ui/ShareButton.svelte";
  import TelegramAlerts from "../../ui/TelegramAlerts.svelte";
  import { tr } from "../../core/i18n.svelte.js";

  let { icon = "☀️", label = "", temp = 0, feels = 0, townName = "", appState = "", aqi = null, town = "", state = "", share = null, high = null, low = null, rainChance = null, humidity = null, wind = null } = $props();
  const scene = $derived(sceneOf(icon));
  const facts = $derived([
    high != null || low != null ? { key: "hl", label: `${tr("high")} / ${tr("low")}`, value: `${high != null ? Math.round(high) : "–"}° / ${low != null ? Math.round(low) : "–"}°` } : null,
    rainChance != null ? { key: "rain", label: tr("rainChance"), value: `${Math.round(rainChance)}%` } : null,
    humidity != null ? { key: "hum", label: tr("humidity"), value: `${humidity}%` } : null,
    wind != null ? { key: "wind", label: tr("wind"), value: `${wind} km/h` } : null,
  ].filter(Boolean));
</script>

<div class="banner scene-{scene} relative overflow-hidden rounded-2xl text-white shadow-lg" role="img" aria-label={label}>
  <div class="glow" aria-hidden="true"></div>
  <div class="relative z-10 flex flex-col gap-4 p-4 sm:p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5 text-[13px] font-medium text-white/85">
          <Icon name="pin" size={13} />
          <span class="truncate">{townName}{#if appState}<span class="text-white/65">, {appState}</span>{/if}</span>
        </div>
        <div class="mt-3 flex items-end gap-3">
          <span class="num text-[46px] font-extrabold leading-none tracking-tighter sm:text-[56px]">{Math.round(temp)}°</span>
          <div class="pb-1">
            <div class="text-[15px] font-semibold leading-tight">{icon} {label}</div>
            <div class="text-[12.5px] text-white/80">{tr("feels")} {Math.round(feels)}°</div>
          </div>
        </div>
      </div>
      {#if aqi}
        <div class="shrink-0 rounded-2xl bg-black/25 px-3.5 py-2.5 text-center backdrop-blur-md">
          <div class="text-[10px] font-semibold uppercase tracking-wider text-white/75">Air now</div>
          <div class="num text-[26px] font-extrabold leading-none">{aqi.value}</div>
          <div class="text-[11px] font-semibold">{aqi.band}</div>
        </div>
      {/if}
    </div>

    {#if facts.length}
      <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {#each facts as f (f.key)}
          <div class="rounded-xl bg-white/12 px-3 py-2">
            <div class="truncate text-[10.5px] font-medium capitalize text-white/70">{f.label}</div>
            <div class="num mt-0.5 text-[14px] font-bold leading-tight">{f.value}</div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex items-center justify-end gap-1.5">
      {#if town}<TelegramAlerts pill {town} {state} />{/if}
      {#if share}<ShareButton pill payload={share} />{/if}
    </div>
  </div>
</div>

<style>
  .banner { min-height: 190px; box-sizing: border-box; }

  .scene-sunny   { background: linear-gradient(140deg, #b45309 0%, #92400e 55%, #78350f 115%); }
  .scene-partly  { background: linear-gradient(140deg, #1e40af 0%, #1d4ed8 55%, #2563eb 115%); }
  .scene-cloudy,
  .scene-overcast{ background: linear-gradient(140deg, #475569 0%, #334155 60%, #1e293b 115%); }
  .scene-rain    { background: linear-gradient(140deg, #334155 0%, #1e293b 55%, #0f172a 115%); }
  .scene-thunder { background: linear-gradient(140deg, #1e293b 0%, #0f172a 55%, #020617 115%); }
  .scene-mist    { background: linear-gradient(140deg, #4b5563 0%, #374151 60%, #1f2937 115%); }
  .scene-night   { background: linear-gradient(140deg, #0f172a 0%, #1e293b 55%, #334155 115%); }

  .glow {
    position: absolute; right: -60px; top: -80px; width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(255,255,255,.35), transparent 65%);
    pointer-events: none;
  }
</style>