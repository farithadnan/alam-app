<script>
  import Icon from "./Icon.svelte";
  let { class: cls = "", children } = $props();
  let el;
  const scroll = (d) => el?.scrollBy({ left: d * 340, behavior: "smooth" });
</script>

<div class="relative">
  <button class="absolute left-1 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-panel/95 text-fg shadow-md sm:size-9" onclick={() => scroll(-1)} aria-label="Scroll left"><Icon name="chevronLeft" size={16} /></button>
  <div bind:this={el} class={"no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-10 pb-1 " + cls}>{@render children()}</div>
  <button class="absolute right-1 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-panel/95 text-fg shadow-md sm:size-9" onclick={() => scroll(1)} aria-label="Scroll right"><Icon name="chevron" size={16} /></button>
</div>