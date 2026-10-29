<script>
  import { bandLabel } from "../../core/i18n.svelte.js";

  /** A linear AQI scale with a marker at `value`. Piecewise so each national band
   * gets a fair slice of the track (0–50, 51–100, 101–200, 201–300, 300+). */
  let { value = 0, band = "", color = "var(--color-accent)", showLabels = true, class: cls = "" } = $props();

  const BANDS = [
    { to: 50, c: "var(--color-good)", w: 20, label: "Good" },
    { to: 100, c: "var(--color-moderate)", w: 20, label: "Moderate" },
    { to: 200, c: "var(--color-unhealthy)", w: 30, label: "Unhealthy" },
    { to: 300, c: "var(--color-vunhealthy)", w: 15, label: "V. Unhealthy" },
    { to: 500, c: "var(--color-hazardous)", w: 15, label: "Hazardous" },
  ];
  const pct = $derived.by(() => {
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) return 0;
    let acc = 0, lo = 0;
    for (const b of BANDS) {
      if (v <= b.to) return acc + ((v - lo) / (b.to - lo)) * b.w;
      acc += b.w; lo = b.to;
    }
    return 100;
  });
  const active = $derived(band || bandLabel(
    value <= 50 ? "Good" : value <= 100 ? "Moderate" : value <= 200 ? "Unhealthy" : value <= 300 ? "Very Unhealthy" : "Hazardous",
  ));
</script>

<div class={"w-full " + cls}>
  <div class="relative h-2.5 w-full overflow-visible rounded-full" style="background:linear-gradient(90deg,var(--color-good) 0 20%,var(--color-moderate) 20% 40%,var(--color-unhealthy) 40% 70%,var(--color-vunhealthy) 70% 85%,var(--color-hazardous) 85% 100%)">
    <span class="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md" style="left:{pct}%;border:3px solid {color}"></span>
  </div>
  {#if showLabels}
    <div class="mt-1.5 flex items-center justify-between text-[10.5px] text-faint">
      <span>0</span><span>Air quality index</span><span>300+</span>
    </div>
  {/if}
  {#if active}
    <div class="mt-1 text-[12.5px] font-semibold" style="color:{color}">{active}</div>
  {/if}
</div>