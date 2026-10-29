<script>
  import { untrack } from "svelte";
  import { tr } from "../core/i18n.svelte.js";
  import Icon from "./Icon.svelte";

  /** Collapsible AQI explainer: the colour scale plus a plain-language meaning per band.
   * Each band's string is "Good 0–50 · safe for everyone", so the range/label reads bold
   * and the meaning stays quiet. */
  let { startOpen = true, class: cls = "" } = $props();
  let open = $state(untrack(() => startOpen));
  const bands = [
    { c: "var(--color-good)", key: "aqiMeanGood" },
    { c: "var(--color-moderate)", key: "aqiMeanModerate" },
    { c: "var(--color-unhealthy)", key: "aqiMeanUnhealthy" },
    { c: "var(--color-vunhealthy)", key: "aqiMeanVery" },
    { c: "var(--color-hazardous)", key: "aqiMeanHazardous" },
  ];
</script>

<button class="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted hover:text-fg" onclick={() => (open = !open)} aria-expanded={open}>
  <Icon name={open ? "minus" : "plus"} size={13} /> {tr("aqiScaleToggle")}
</button>
{#if open}
  <div class={"card mt-2 p-4 " + cls}>
    <div class="h-2.5 w-full rounded-full" style="background:linear-gradient(90deg,var(--color-good) 0 20%,var(--color-moderate) 20% 40%,var(--color-unhealthy) 40% 70%,var(--color-vunhealthy) 70% 85%,var(--color-hazardous) 85% 100%)"></div>
    <ul class="mt-3 list-none m-0 space-y-2 p-0">
      {#each bands as b (b.key)}
        {@const parts = tr(b.key).split("·")}
        <li class="flex items-start gap-2.5 text-[12.5px]">
          <span class="mt-1.5 size-2.5 shrink-0 rounded-full" style="background:{b.c}"></span>
          <span><b class="font-semibold text-fg">{parts[0].trim()}</b>{#if parts.length > 1}<span class="text-muted"> — {parts.slice(1).join("·").trim()}</span>{/if}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}