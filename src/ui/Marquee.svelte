<script>
  /** A single line that, only when the text is wider than its box, slowly scrolls
   * back and forth (LED-ticker style) so the full name is always reachable without
   * changing the row height. Respects prefers-reduced-motion (stays put). */
  let { text = "", class: cls = "" } = $props();
  let box = $state();
  let inner = $state();
  let shift = $state(0);
  let dur = $state(0);

  $effect(() => {
    void text;
    if (!box || !inner) return;
    const measure = () => {
      const over = inner.scrollWidth - box.clientWidth;
      shift = over > 4 ? Math.ceil(over) : 0;
      dur = shift ? Math.max(6, Math.round(shift / 22)) : 0;
    };
    measure();
    requestAnimationFrame(measure);
  });
</script>

<span bind:this={box} class={"block overflow-hidden whitespace-nowrap " + cls}>
  <span
    bind:this={inner}
    class="inline-block align-bottom will-change-transform"
    class:ticker={shift > 0}
    style={shift > 0 ? `--shift:${shift}px;--dur:${dur}s` : ""}
  >{text}</span>
</span>

<style>
  @media (prefers-reduced-motion: no-preference) {
    .ticker { animation: ticker var(--dur, 8s) ease-in-out infinite alternate; }
    @keyframes ticker {
      from { transform: translateX(0); }
      to { transform: translateX(calc(-1 * var(--shift, 0px))); }
    }
  }
</style>