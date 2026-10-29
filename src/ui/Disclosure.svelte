<script>
  import Icon from "./Icon.svelte";
  /** A card row that expands to reveal detail. Renders an `<li>` so it drops into a
   * list. Pass the clickable row via the `header` snippet; the body as children. */
  let { open = false, onToggle = () => {}, accent = "", class: cls = "", header, children } = $props();
</script>

<li class={"card overflow-hidden " + cls} style={accent ? `border-left:3px solid ${accent}` : ""}>
  <button class="flex w-full items-center gap-3 px-3.5 py-3 text-left" onclick={onToggle} aria-expanded={open}>
    {@render header()}
    <span class="grid size-6 shrink-0 place-items-center rounded-full bg-panel-2 text-muted transition-transform" style={open ? "transform:rotate(180deg)" : ""}><Icon name="chevronDown" size={14} /></span>
  </button>
  {#if open}
    <div class="border-t border-line px-3.5 pb-3.5 pt-3">{@render children()}</div>
  {/if}
</li>