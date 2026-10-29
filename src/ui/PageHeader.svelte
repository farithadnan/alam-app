<script>
  import { tr } from "../core/i18n.svelte.js";
  /** Uniform page header: title + a quiet freshness line. */
  let { title = "", updated = "", source = "" } = $props();
</script>

<div class="mb-2">
  <h1 class="text-[21px] font-extrabold leading-tight tracking-tight sm:text-[24px]">{title}</h1>
  {#if updated || source}
    <p class="mt-1 text-[12px] text-faint">
      {#if updated}{tr("updated")} {updated}{/if}{#if updated && source}<span class="mx-1.5">·</span>{/if}{#if source}{source}{/if}
    </p>
  {/if}
</div>