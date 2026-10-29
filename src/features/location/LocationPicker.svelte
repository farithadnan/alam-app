<script>
  import { app } from "../../core/store.svelte.js";
  import { tr } from "../../core/i18n.svelte.js";
  import { dialog } from "../../core/dialog.js";
  import { useMyLocation } from "./location.js";
  import Icon from "../../ui/Icon.svelte";

  /** The location picker sheet: instant search, state/town selects, and "use my
   * location". Owns only its own form state; the chosen place lives in the app store. */
  let { open = $bindable(false), onClaim = () => {} } = $props();

  const states = $derived(app.data?.states ?? []);
  const towns = $derived((app.data?.allTowns ?? []).filter((t) => t.state === app.state));

  // Common informal aliases (JB → Johor Bahru, KL → Kuala Lumpur…).
  const ALIASES = {
    jb: "johor bahru", "johor bahru": "johor bahru", kl: "kuala lumpur", "kuala lumpur": "kuala lumpur",
    pj: "petaling jaya", "petaling jaya": "petaling jaya", "shah alam": "shah alam", klang: "klang",
    subang: "subang jaya", "subang jaya": "subang jaya", kk: "kota kinabalu", "kota kinabalu": "kota kinabalu",
    kch: "kuching", kuching: "kuching", ipoh: "ipoh", penang: "george town", "george town": "george town",
    melaka: "melaka", miri: "miri", sibu: "sibu", bintulu: "bintulu", bangi: "bangi", cyberjaya: "cyberjaya",
  };
  let q = $state("");
  let busy = $state(false);
  const normz = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const placeMatches = $derived.by(() => {
    const raw = q.trim();
    if (!raw) return [];
    const sub = normz(raw);
    const aliasTarget = normz(ALIASES[sub] || "");
    return (app.data?.allTowns ?? []).filter((t) => {
      const nm = normz(t.name), slug = normz(t.station);
      if (nm.includes(sub) || slug.includes(sub)) return true;
      if (aliasTarget && nm.includes(aliasTarget)) return true;
      if (Object.values(ALIASES).some((tg) => normz(tg) === nm && sub.length >= 3 && nm.includes(sub))) return true;
      return false;
    }).slice(0, 12);
  });

  function pickPlace(t) {
    app.state = t.state;
    app.town = t.station;
    q = "";
  }
  function onStatePick(e) {
    // Move the town with the state right away, so we never request a town that
    // belongs to the previous state (that returns no hourly/forecast data).
    const first = (app.data?.allTowns ?? []).find((t) => t.state === e.currentTarget.value);
    if (first) app.town = first.station;
  }
  async function locateMe() {
    onClaim();
    busy = true;
    try { await useMyLocation(states); open = false; } catch { /* denied — leave open */ } finally { busy = false; }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
    <button type="button" tabindex="-1" class="absolute inset-0 bg-black/45 backdrop-blur-sm" aria-label={tr("dismiss")} onclick={() => (open = false)}></button>
    <div use:dialog={{ onClose: () => (open = false) }} class="relative w-full max-w-md rounded-t-3xl border border-line bg-panel p-5 shadow-2xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="loc-title" tabindex="-1">
      <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden"></div>
      <div class="flex items-center justify-between">
        <h2 id="loc-title" class="m-0 text-[17px] font-bold">{tr("changeLoc")}</h2>
        <button class="iconbtn !border-transparent !bg-transparent !px-2" onclick={() => (open = false)} aria-label={tr("dismiss")}><Icon name="close" size={16} /></button>
      </div>

      <label class="relative mt-3 block">
        <span class="sr-only">{tr("searchPlace")}</span>
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"><Icon name="search" size={16} /></span>
        <input class="!pl-10" bind:value={q} placeholder={tr("searchPlacePh")} aria-label={tr("searchPlace")} />
      </label>
      {#if q}
        <ul class="mt-2 max-h-52 list-none overflow-y-auto rounded-xl border border-line bg-panel-2 p-0">
          {#if placeMatches.length}
            {#each placeMatches as t (t.station)}
              <li class="border-b border-line last:border-b-0">
                <button class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[14px]" onclick={() => pickPlace(t)}>
                  <span class="min-w-0 truncate font-medium">{t.name}</span>
                  <span class="shrink-0 text-[12px] text-muted">{t.state}</span>
                </button>
              </li>
            {/each}
          {:else}
            <li class="px-3 py-2.5 text-[13px] text-muted">{tr("noSearchResults")}</li>
          {/if}
        </ul>
      {/if}

      <div class="mt-3 grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1.5">
          <span class="eyebrow">{tr("state")}</span>
          <select id="state-select" bind:value={app.state} onchange={onStatePick}>
            {#each states as name (name)}
              <option value={name}>{name}</option>
            {/each}
          </select>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="eyebrow">{tr("town")}</span>
          <select id="town-select" bind:value={app.town}>
            {#each towns as t (t.station)}
              <option value={t.station}>{t.name}</option>
            {/each}
          </select>
        </label>
      </div>

      <button class="ghostbtn mt-3 w-full" onclick={locateMe}>
        <Icon name="compass" size={15} /> {busy ? tr("locating") : tr("useLoc")}
      </button>
      <p class="caption mt-2 text-center text-[12px]">{tr("locHint")}</p>
      <button class="btn-primary mt-3 w-full" onclick={() => (open = false)}>{tr("done")}</button>
    </div>
  </div>
{/if}