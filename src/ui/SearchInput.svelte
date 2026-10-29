<script>
import Icon from "./Icon.svelte";
let { value = $bindable(""), placeholder = "Search…", ariaLabel = "Search", class: cls = "" } = $props();
</script>

<div class={"relative " + cls}>
  <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"><Icon name="search" size={15} /></span>
  <input class="!pl-9" type="search" {placeholder} aria-label={ariaLabel} bind:value />
</div>