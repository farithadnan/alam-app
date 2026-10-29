<script>
  import { ICONS } from "./icons.js";

  /** Draws any icon in lib/icons.js; the geometry lives there, not here. */
  let { name = "", size = 18, class: cls = "", stroke = 1.8 } = $props();

  const shapes = $derived(ICONS[name] ?? []);
</script>

<svg class={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#each shapes as shape, i (i)}
    {#if shape.path}<path d={shape.path} />{:else if shape.circle}<circle cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} />{:else if shape.rect}<rect x={shape.rect[0]} y={shape.rect[1]} width={shape.rect[2]} height={shape.rect[3]} rx={shape.radius ?? 0} />{:else if shape.poly}<polyline points={shape.poly} />{/if}
  {/each}
</svg>