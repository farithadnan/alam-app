<script>
  import Icon from "./Icon.svelte";
  /** Underline tab bar for in-page sub-navigation (distinct from the scope segmented
   * pills, so the two never read as duplicate controls). `items = [{ key, label, icon? }]`. */
  let { items = [], value = "", onPick = () => {}, class: cls = "" } = $props();
</script>

<div class={"flex items-stretch gap-1 border-b border-line " + cls} role="tablist">
  {#each items as it (it.key)}
    <button
      type="button"
      role="tab"
      aria-selected={value === it.key}
      class={"relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-[13.5px] font-semibold transition " + (value === it.key ? "text-accent" : "text-muted hover:text-fg")}
      onclick={() => onPick(it.key)}
    >
      {#if it.icon}<Icon name={it.icon} size={15} />{/if}{it.label}
      {#if value === it.key}<span class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"></span>{/if}
    </button>
  {/each}
</div>