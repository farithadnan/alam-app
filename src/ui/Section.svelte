<script>
  import { untrack } from "svelte";
  import Icon from "./Icon.svelte";
  let { title = "", startOpen = false, children } = $props();
  let open = $state(untrack(() => startOpen));
</script>

<div class="border-b border-line last:border-b-0">
  <button class="flex w-full items-center justify-between gap-2 py-3 text-left" onclick={() => (open = !open)} aria-expanded={open}>
    <span class="text-[15px] font-bold tracking-tight">{title}</span>
    <span class="grid size-6 place-items-center rounded-full bg-panel-2 text-muted transition-transform" style={open ? "transform:rotate(180deg)" : ""}><Icon name="chevronDown" size={14} /></span>
  </button>
  {#if open}
    <div class="pb-3">{@render children()}</div>
  {/if}
</div>