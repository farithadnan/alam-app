<script>
    import { app } from "../core/store.svelte.js";
    import { tr } from "../core/i18n.svelte.js";
    import Tabs from "../ui/Tabs.svelte";
    import Flood from "../features/hazards/Flood.svelte";
    import Quakes from "../features/hazards/Quakes.svelte";
  </script>

  <Tabs
    class="mb-4"
    value={app.hazard}
    onPick={(k) => (app.hazard = k)}
    items={[
      { key: "flood", label: tr("subFlood"), icon: "flood" },
      { key: "earthquakes", label: tr("subQuake"), icon: "quake" },
    ]}
  />

  {#if app.hazard === "flood"}
    <Flood />
  {:else}
    <Quakes />
  {/if}