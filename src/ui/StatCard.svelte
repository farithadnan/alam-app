<script>
let { label = "", value = "–", sub = "", class: cls = "" } = $props();
</script>

<div class={"glass px-3.5 py-3 " + cls}>
  <div class="text-[11.5px] font-medium text-muted">{label}</div>
  <div class="num mt-0.5 text-[17px] font-bold leading-tight">{value}</div>
  {#if sub}<div class="mt-0.5 text-[11px] text-faint">{sub}</div>{/if}
</div>