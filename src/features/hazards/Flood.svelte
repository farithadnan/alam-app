  <script>
    import FloodAlerts from "./FloodAlerts.svelte";
    import PageHeader from "../../ui/PageHeader.svelte";
    import { app } from "../../core/store.svelte.js";
    import { getFlood } from "../../core/api.js";
    import { createLoader } from "../../core/async.js";
    import { tr } from "../../core/i18n.svelte.js";

    // Scope comes from the top nav bar (shared Near / State / Malaysia seg, same as
    // Weather & AQI). Flood is state-level data, so Near and State both resolve to
    // the user's declared state; Malaysia shows every state.
    let sevFilter = $state(""); // "" = all, else one severity
    const state = $derived(app.scope === "malaysia" ? "" : app.state || "");
    const SEV = { Danger: { c: "var(--color-vunhealthy)", e: "🔴" }, Warning: { c: "var(--color-unhealthy)", e: "🟠" }, Alert: { c: "var(--color-moderate)", e: "🟡" }, Heavy: { c: "#3b6ea8", e: "🌧" } };

    let data = $state({ river: [], rain: [] });
    let loading = $state(false);
    let updatedAt = $state("");
    const loadFlood = createLoader();
    $effect(() => {
      const s = state || undefined;
      loading = true;
      loadFlood(() => getFlood(s), {
        onValue: (r) => { data = r ?? { river: [], rain: [] }; updatedAt = r?.timestamp || ""; },
        onError: () => (data = { river: [], rain: [] }),
        onSettled: () => (loading = false),
      });
    });

    const summary = $derived.by(() => {
      const sev = (s) => data.river.filter((a) => a.severity === s).length;
      const highest = data.river.reduce((m, a) => (a.level > (m?.level ?? -1) ? a : m), null);
      return { danger: sev("Danger"), warning: sev("Warning"), alert: sev("Alert"), heavy: data.rain.filter((a) => a.severity === "Heavy").length, highest };
    });
    const present = $derived(
      [["Danger", summary.danger], ["Warning", summary.warning], ["Alert", summary.alert], ["Heavy", summary.heavy]]
        .filter(([, n]) => n > 0)
        .map(([s, n]) => ({ s, n, c: SEV[s].c, e: SEV[s].e, label: tr(s === "Heavy" ? "sev_heavy" : s === "Danger" ? "sev_danger" : s === "Warning" ? "sev_warning" : "sev_alert") })),
    );
    const total = $derived(data.river.length + data.rain.length);
    const toggleSev = (s) => { sevFilter = sevFilter === s ? "" : s; };
  </script>

  <PageHeader title={tr("floodTitle")} updated={updatedAt ? new Date(updatedAt).toLocaleTimeString() : ""} source="JPS InfoBanjir" />
  <p class="caption mb-2">{tr("floodNote")} · <a class="font-medium text-accent underline" href="https://publicinfobanjir.water.gov.my/" target="_blank" rel="noopener">{tr("floodOpen")}</a></p>

  <FloodAlerts river={data.river} rain={data.rain} loading={loading} state={state} sevFilter={sevFilter} onSev={toggleSev} present={present} total={total} highest={summary.highest} />
