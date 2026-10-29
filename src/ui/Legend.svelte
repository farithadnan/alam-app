<script>
  import { untrack } from "svelte";
  import Icon from "./Icon.svelte";
  /** A collapsible legend: a toggle row plus a card of coloured items
   * (`items = [{ color, label }]`). Open by default so meaning is never hidden. */
  let { title = "", items = [], startOpen = true, columns = 1, class: cls = "" } = $props();
  let open = $state(untrack(() => startOpen));
</script>

<button class="mb-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted hover:text-fg" onclick={() => (open = !open)} aria-expanded={open}>
  <Icon name={open ? "minus" : "plus"} size={13} /> {title}
</button>
{#if open}
  <div class={"card mb-2 p-3.5 " + cls}>
    <ul class={"list-none m-0 grid gap-2 p-0 text-[12.5px] " + (columns === 2 ? "sm:grid-cols-2" : "")}>
      {#each items as it (it.label)}
        {@const parts = String(it.label).split("·")}
        <li class="flex items-start gap-2.5">
          <span class="mt-1.5 size-2.5 shrink-0 rounded-full" style="background:{it.color}"></span>
          <span><b class="font-semibold text-fg">{parts[0].trim()}</b>{#if parts.length > 1}<span class="text-muted"> — {parts.slice(1).join("·").trim()}</span>{/if}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}