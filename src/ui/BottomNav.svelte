<script>
  import { tr } from "../core/i18n.svelte.js";
  import Icon from "./Icon.svelte";

  /** Mobile bottom tab bar. Generic: pass the nav items and the active value. */
  let { items = [], value = "", onNavigate = () => {} } = $props();
</script>

<nav class="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-panel/90 pt-1 backdrop-blur-xl lg:hidden" aria-label="Main">
  <div class="mx-auto flex max-w-[560px]">
    {#each items as n (n.view)}
      <button
        class="relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-1.5"
        onclick={() => onNavigate(n.view)}
        aria-current={value === n.view ? "page" : undefined}
      >
        {#if value === n.view}<span class="absolute top-0 h-0.5 w-7 rounded-full bg-accent"></span>{/if}
        <span class={value === n.view ? "text-accent" : "text-muted"}><Icon name={n.icon} size={21} /></span>
        <span class={"text-[11px] font-medium " + (value === n.view ? "text-accent" : "text-muted")}>{tr(n.key)}</span>
      </button>
    {/each}
  </div>
</nav>