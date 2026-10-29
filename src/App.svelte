<script>
import { onMount } from "svelte";
import { app, load, initLoc } from "./core/store.svelte.js";
import { SITE } from "./core/config.js";
import { applyTheme } from "./core/theme.svelte.js";
import { tr, trFmt } from "./core/i18n.svelte.js";
import { NAV, SCOPES } from "./core/shell.js";
import { useMyLocation } from "./features/location/location.js";
import LocationPicker from "./features/location/LocationPicker.svelte";
import SettingsMenu from "./features/settings/SettingsMenu.svelte";
import BottomNav from "./ui/BottomNav.svelte";
import Icon from "./ui/Icon.svelte";
import Skeleton from "./ui/Skeleton.svelte";
import Home from "./routes/Home.svelte";
import Weather from "./routes/Weather.svelte";
import Air from "./routes/Air.svelte";
import Hazards from "./routes/Hazards.svelte";
import News from "./routes/News.svelte";
import About from "./routes/About.svelte";
import Api from "./routes/Api.svelte";

const HASH_TO_VIEW = { "": "home", weather: "weather", air: "air", flood: "hazards", earthquakes: "hazards", news: "news", about: "about", api: "api" };
const VIEW_TO_HASH = { home: "", weather: "weather", air: "air", hazards: "flood", news: "news", about: "about", api: "api" };
function readHash() {
  const h = (typeof location !== "undefined" ? location.hash : "").replace(/^#\/?/, "");
  if (h === "flood" || h === "earthquakes") app.hazard = h;
  return HASH_TO_VIEW[h] ?? "home";
}
let view = $state(readHash());
$effect(() => {
  // Keep the URL in sync (replaceState avoids a hashchange loop). The Hazards center
  // owns its sub-tab in app.hazard, so its hash reflects Flood vs Earthquakes.
  const want = view === "hazards" ? `#/${app.hazard || "flood"}` : VIEW_TO_HASH[view] ? `#/${VIEW_TO_HASH[view]}` : "#/";
  if (typeof location !== "undefined" && location.hash !== want) history.replaceState(null, "", want);
});
let locOpen = $state(false);
let locBusy = $state(false);
// Was this location ever actually claimed by the user, or are they seeing a default?
let claimed = $state(true);
$effect(() => {
  let stored = "1";
  try { stored = localStorage.getItem("alam.claimed") ?? "0"; } catch {}
  claimed = stored === "1";
});

const states = $derived(app.data?.states ?? []);
const townName = $derived(app.data?.weather?.find((r) => r.station === app.town && r.kind === "weather")?.stationName ?? app.data?.allTowns?.find((t) => t.station === app.town)?.name ?? app.town ?? "");

let _lastSig = "";
$effect(() => {
  const sig = `${app.scope}|${app.state}|${app.town}|${app.picked}`;
  void sig;
  // Only reload when the visible scope/town/state actually changed. load() itself
  // adopts a default state/town into these fields; without this guard Svelte re-fires
  // the effect (same sig) and load() spins — the loading bar "blinks".
  if (sig === _lastSig) return;
  _lastSig = sig;
  if (app.state) load();
});
onMount(() => {
  initLoc();
  load();
  applyTheme();
  const t = setInterval(() => { if (!document.hidden) load(); }, 300000); // 5 min, paused when tab hidden
  window.addEventListener("hashchange", () => { const v = readHash(); if (v !== view) view = v; });
  return () => { clearInterval(t); window.removeEventListener("hashchange", () => {}); };
});
function markClaimed() {
  claimed = true;
  try { localStorage.setItem("alam.claimed", "1"); } catch {}
}
async function nudgeLocate() {
  markClaimed();
  locBusy = true;
  try { await useMyLocation(states); } catch { /* denied — ignore */ } finally { locBusy = false; }
}
const scopeRelevant = $derived(view === "weather" || view === "air" || (view === "hazards" && app.hazard === "flood"));
</script>

{#snippet scopeSeg(cls = "", btnCls = "")}
  <div class={"seg " + cls} role="group" aria-label="Scope">
    {#each SCOPES as s (s.value)}
      <button class:on={app.scope === s.value} class={"segbtn " + btnCls} onclick={() => (app.scope = s.value)}>{tr(s.key)}</button>
    {/each}
  </div>
{/snippet}

<header class="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
  <div class="mx-auto flex w-full max-w-[1240px] items-center gap-2 px-3 py-2 sm:px-4">
    <button class="group flex items-center gap-2 pr-1" onclick={() => (view = "home")} aria-label="Home">
      <span class="grid size-8 place-items-center rounded-xl text-white shadow-sm" style="background:linear-gradient(135deg,var(--color-accent),#ff8a5c)">
        <Icon name="air" size={17} stroke={2} />
      </span>
      <span class="hidden text-[17px] font-extrabold tracking-tight sm:inline">{SITE.name}<span class="text-accent">.</span></span>
    </button>

    <nav class="ml-2 hidden items-center gap-0.5 lg:flex">
      {#each NAV as n (n.view)}
        <button class:on={view === n.view} class="navbtn" onclick={() => (view = n.view)} aria-current={view === n.view ? "page" : undefined}>
          <Icon name={n.icon} size={15} />{tr(n.key)}
        </button>
      {/each}
    </nav>

    <div class="ml-auto flex min-w-0 items-center gap-1.5">
      {#if scopeRelevant && !app.picked}
        <div class="hidden lg:block">{@render scopeSeg("scope-seg")}</div>
      {/if}
      <button class="iconbtn inline-flex min-w-0 max-w-[48vw] items-center gap-1.5 sm:max-w-none" onclick={() => (locOpen = true)} aria-haspopup="dialog" aria-expanded={locOpen}>
        <Icon name="pin" size={15} class="shrink-0 text-accent" />
        <span class="truncate font-semibold">{townName || tr("changeLoc")}</span>
      </button>
      <SettingsMenu />
    </div>
  </div>

  {#if scopeRelevant && !app.picked}
    <div class="px-3 pb-2 lg:hidden">
      {@render scopeSeg("w-full", "flex-1 py-1.5")}
    </div>
  {/if}

  {#if app.loading}
    <div class="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden" aria-hidden="true">
      <div class="loadingbar"></div>
    </div>
  {/if}

  {#if app.error && app.data}
    <div class="flex items-center justify-center gap-3 border-t border-line bg-panel px-4 py-2 text-[12.5px]">
      <span class="text-muted">{tr("staleData")}</span>
      <button class="ghostbtn !min-h-0 !py-1 text-[12px]" onclick={load}>{tr("retry")}</button>
    </div>
  {/if}
</header>

<LocationPicker bind:open={locOpen} onClaim={markClaimed} />

<a class="skip-link" href="#main-content">{tr("skipToContent")}</a>
<main id="main-content" class="mx-auto w-full max-w-[1240px] px-3 pt-3 pb-24 sm:px-4 lg:pb-10">
  {#if !claimed && view !== "about" && view !== "api" && view !== "hazards" && view !== "news"}
    <!-- Slim, quiet location nudge: the hero owns the first screen. -->
    <div class="mb-3 flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-[12.5px]">
      <Icon name="pin" size={14} class="shrink-0 text-accent" />
      <span class="min-w-0 text-muted">{trFmt("locationPrompt", { place: app.state || "Malaysia" })}</span>
      <span class="ml-auto flex shrink-0 items-center gap-1">
        <button type="button" class="ghostbtn !min-h-0 !py-1 text-[12px]" onclick={nudgeLocate}>{locBusy ? "…" : tr("useMyLocation")}</button>
        <button type="button" class="iconbtn !border-transparent !bg-transparent !p-1.5" onclick={markClaimed} aria-label={tr("dismiss")} title={tr("dismiss")}><Icon name="close" size={14} /></button>
      </span>
    </div>
  {/if}
  {#if !app.data && app.loading}
    <div class="mt-2 space-y-3">
      <Skeleton h={150} class="!rounded-2xl" />
      <div class="flex gap-2"><Skeleton h={34} w="104px" /><Skeleton h={34} w="104px" /><Skeleton h={34} w="104px" /></div>
      <Skeleton h={14} w="38%" />
      <Skeleton h={170} class="!rounded-2xl" />
      <Skeleton h={14} w="24%" />
      <Skeleton h={120} class="!rounded-2xl" />
    </div>
  {:else if !app.data}
    <div class="mx-auto mt-16 max-w-sm text-center">
      <div class="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon name="alert" size={22} /></div>
      <p class="text-[16px] font-bold">{tr("loadFailed")}</p>
      <p class="caption mt-1">{tr("loadFailedHint")}</p>
      <button class="btn-primary mt-4" onclick={load}>{tr("retry")}</button>
    </div>
  {:else if view === "home"}
    <Home onNavigate={(v) => (view = v)} />
  {:else if view === "weather"}
    <Weather />
  {:else if view === "air"}
    <Air />
  {:else if view === "hazards"}
    <Hazards />
  {:else if view === "news"}
    <News />
  {:else if view === "api"}
    <Api />
  {:else}
    <About />
  {/if}
</main>

<footer class="border-t border-line px-4 pt-4 pb-20 text-center text-[12.5px] text-muted lg:pb-5">
  <div class="flex items-center justify-center gap-2.5">
    <button class="hover:text-fg" onclick={() => (view = "about")}>{tr("navAbout")}</button>
    <span class="text-faint">·</span>
    <button class="hover:text-fg" onclick={() => (view = "api")}>API</button>
    <span class="text-faint">·</span>
    <span>© {new Date().getFullYear()} {SITE.name}</span>
  </div>
</footer>

<BottomNav items={NAV} value={view} onNavigate={(v) => (view = v)} />