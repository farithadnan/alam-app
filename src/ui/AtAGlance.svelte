<script>
  /** Compact hazard summary as a responsive tile grid — scannable at a glance. */
  let { items = [], onTap = () => {} } = $props();
</script>

{#if items.length}
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {#each items as it (it.key)}
      {@const c = it.color || "var(--color-muted)"}
      <button class="card card-hover flex flex-col gap-2 p-3 text-left" onclick={() => onTap(it.key)}>
        <span class="grid size-9 place-items-center rounded-xl text-[17px] leading-none" style="background:color-mix(in srgb, {c} 14%, transparent)" aria-hidden="true">{it.icon}</span>
        <span class="min-w-0">
          {#if it.value != null && it.value !== ""}
            <span class="num block text-[24px] font-extrabold leading-none" style="color:{c}">{it.value}</span>
          {/if}
          <span class="mt-1 block truncate text-[12px] font-medium text-muted">{it.label}</span>
        </span>
      </button>
    {/each}
  </div>
{/if}