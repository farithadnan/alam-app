  <!-- Generic compact filter: one pill per option, optional count + active colour.
       Colour is a hex like "#a51612" (background is its 10% tint). -->
  <script>
    let { pills = [], value = "", onPick = null, allLabel = "", allValue = "", class: cls = "" } = $props();
  </script>

  <div class="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible {cls}">
    {#if allLabel}
      <button type="button" class="pillfilter inline-flex items-center gap-1.5" onclick={() => onPick?.(allValue)}
        style={value === allValue ? "border-color:#8a8277;color:#8a8277;background:#8a82771a" : ""}>
        <span class="size-2 shrink-0 rounded-full" style="background:#8a8277"></span>{allLabel}
      </button>
    {/if}
    {#each pills as p (p.key)}
      <button type="button" class="pillfilter inline-flex items-center gap-1.5" onclick={() => onPick?.(p.key)}
        style={value === p.key ? `border-color:${p.color || "#8a8277"};color:${p.color || "#8a8277"};background:${(p.color || "#8a8277")}1a` : ""}>
        {#if p.color}<span class="size-2 shrink-0 rounded-full" style="background:{p.color}"></span>{/if}{p.label}{#if p.count != null} <span class="font-mono font-semibold">{p.count}</span>{/if}
      </button>
    {/each}
  </div>
