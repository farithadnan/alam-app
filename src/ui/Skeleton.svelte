<script>
let { h = 16, w = "100%", class: cls = "" } = $props();
</script>

<div class={"rounded-xl bg-line/70 " + cls} style="height:{h}px;width:{w}" aria-hidden="true"></div>