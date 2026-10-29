<script>
let { size = 18, label = "Loading", class: cls = "" } = $props();
</script>

<span
  class={"inline-block shrink-0 animate-spin rounded-full border-2 border-line border-t-accent " + cls}
  style="width:{size}px;height:{size}px"
  role="status"
  aria-label={label}
></span>
