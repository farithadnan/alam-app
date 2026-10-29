<script>
let { series = [], color = "#e0451f", height = 180, ariaLabel = "Trend", unit = "", mode = "auto", zones = [] } = $props();

// Fixed viewBox with real margins so axis labels never overlap the plot.
const W = 640;
const L = 38;
const R = 12;
const T = 16;
const B = 26;
const innerW = W - L - R;
const innerH = $derived(height - T - B);
const gid = "tg" + Math.random().toString(36).slice(2, 8);

const values = $derived(series.map((s) => s.v));
const min = $derived(values.length ? Math.min(...values) : 0);
const max = $derived(values.length ? Math.max(...values) : 1);
const span = $derived(max - min || 1);

const px = (i) => L + (i / Math.max(1, values.length - 1)) * innerW;
const py = (v) => T + (1 - (v - min) / span) * innerH;

const line = $derived(values.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" "));
const area = $derived(line ? `${line} L ${(L + innerW).toFixed(1)} ${T + innerH} L ${L} ${T + innerH} Z` : "");
const yTicks = $derived([max, Math.round((max + min) / 2), min]);

/** Explicit range wins; "auto" falls back to the span (>48h = daily labels). */
const daily = $derived.by(() => {
  if (mode === "days") return true;
  if (mode === "hours") return false;
  if (series.length < 2) return false;
  const a = Date.parse(series[0]?.t ?? "");
  const b = Date.parse(series[series.length - 1]?.t ?? "");
  return Number.isFinite(a) && Number.isFinite(b) ? b - a > 48 * 3_600_000 : false;
});
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function tickLabel(t) {
  if (!t) return "";
  const d = new Date(String(t).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(t).slice(11, 16);
  return daily ? `${DAYS[d.getDay()]} ${d.getDate()}` : String(t).slice(11, 16);
}

/** Up to 5 evenly-spaced x ticks. */
const xTicks = $derived(
  values.length < 2
    ? []
    : Array.from({ length: Math.min(5, values.length) }, (_, k) => {
        const i = Math.round((k / (Math.min(5, values.length) - 1 || 1)) * (values.length - 1));
        return { i, x: px(i), label: tickLabel(series[i]?.t) };
      }),
);

// --- hover / touch readout -------------------------------------------------
let host = $state();
let hover = $state(null);
const point = $derived(hover != null ? { v: values[hover], t: series[hover]?.t, x: px(hover), y: py(values[hover]) } : null);

function onMove(e) {
  if (!host || !values.length) return;
  const rect = host.getBoundingClientRect();
  const vx = ((e.clientX - rect.left) / rect.width) * W;
  const i = Math.round(((vx - L) / innerW) * (values.length - 1));
  hover = Math.max(0, Math.min(values.length - 1, i));
}
</script>

{#if values.length >= 2}
  <div
    class="relative mt-2"
    bind:this={host}
    role="img"
    aria-label={ariaLabel}
    onpointermove={onMove}
    onpointerdown={onMove}
    onpointerleave={() => (hover = null)}
  >
    <svg viewBox="0 0 {W} {height}" class="block w-full touch-pan-y select-none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={color} stop-opacity="0.28" />
          <stop offset="100%" stop-color={color} stop-opacity="0" />
        </linearGradient>
      </defs>
      {#each zones as z (z[0] + ":" + z[1])}
        {@const ztop = py(Math.min(z[1], max))}
        {@const zbot = py(Math.max(z[0], min))}
        <rect x={L} width={innerW} y={ztop} height={Math.max(0, zbot - ztop)} fill={z[2]} opacity="0.10" />
      {/each}
      {#each yTicks as t, k (k)}
        <line x1={L} x2={L + innerW} y1={py(t)} y2={py(t)} stroke="currentColor" stroke-opacity="0.10" stroke-width="1" stroke-dasharray="3 5" />
        <text x={L - 7} y={py(t) + 3.5} text-anchor="end" font-size="10.5" fill="currentColor" fill-opacity="0.5">{t}</text>
      {/each}
      <path d={area} fill="url(#{gid})" />
      <path d={line} fill="none" stroke={color} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      {#each xTicks as t (t.i)}
        <text x={t.x} y={height - 8} text-anchor="middle" font-size="10.5" fill="currentColor" fill-opacity="0.5">{t.label}</text>
      {/each}
      {#if point}
        <line x1={point.x} x2={point.x} y1={T} y2={T + innerH} stroke={color} stroke-opacity="0.4" stroke-width="1" />
        <circle cx={point.x} cy={point.y} r="5" fill={color} stroke="#fff" stroke-width="2" />
      {/if}
    </svg>

    {#if point}
      <div
        class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-line bg-panel px-2.5 py-1.5 text-center shadow-[var(--shadow-pop)]"
        style="left:{Math.min(87, Math.max(13, (point.x / W) * 100))}%"
      >
        <div class="num text-[14px] font-bold" style="color:{color}">{point.v}{unit}</div>
        <div class="whitespace-nowrap text-[10.5px] text-faint">{tickLabel(point.t)}</div>
      </div>
    {/if}
  </div>
{/if}