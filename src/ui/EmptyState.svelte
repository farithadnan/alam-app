<script>
  import Icon from "./Icon.svelte";
  /** A calm, centered empty state — used wherever a list/map has truly no data after
   * loading. Skeleton loaders are for loading only; this replaces "nothing here".
   * `action` = { label, onClick } (button) or { label, href } (link). */
  let { icon = "", title = "", desc = "", action = null } = $props();
</script>

<div class="mx-auto flex min-h-[200px] w-full max-w-[520px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
  {#if icon}<div class="mb-1 grid size-14 place-items-center rounded-2xl bg-panel-2 text-[26px] leading-none" aria-hidden="true">{icon}</div>{/if}
  {#if title}<div class="text-[16px] font-bold">{title}</div>{/if}
  {#if desc}<p class="mx-auto max-w-[44ch] text-[13px] text-muted">{desc}</p>{/if}
  {#if action}
    {#if action.href}
      <a class="ghostbtn mt-2" href={action.href} onclick={action.onClick}>{action.label}</a>
    {:else}
      <button class="ghostbtn mt-2" onclick={action.onClick}>{action.label}</button>
    {/if}
  {/if}
</div>