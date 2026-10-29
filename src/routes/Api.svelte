<script>
    import { SITE } from "../core/config.js";
    import { tr } from "../core/i18n.svelte.js";
    import SearchInput from "../ui/SearchInput.svelte";
    import Section from "../ui/Section.svelte";
    import Icon from "../ui/Icon.svelte";

    const base = SITE.url;
    const CATS = ["Weather", "Air", "Hazards", "System"];
    const ENDPOINTS = [
      { m: "GET", cat: "System", p: "/api", d: "Self-describing index: name, version, endpoints, rate limit. /v1 is an alias." },
      { m: "GET", cat: "Weather", p: "/api/summary?state=Johor&town=johor-bahru", d: "Everything this app shows in one call: weather, AQI, forecast, warnings, earthquakes. Scope to a town to keep it small." },
      { m: "GET", cat: "Weather", p: "/api/official?state=Johor&town=johor-bahru", d: "MET Malaysia's official district forecast and the district it resolved." },
      { m: "GET", cat: "Weather", p: "/api/forecast?source=open-meteo", d: "Daily forecast rows." },
      { m: "GET", cat: "Air", p: "/api/stations", d: "List of known monitoring stations." },
      { m: "GET", cat: "Air", p: "/api/current?source=doe-eqms", d: "Latest observation per station for a source." },
      { m: "GET", cat: "Air", p: "/api/history?source=doe-eqms&station=<slug>&hours=24", d: "Observation history for a station." },
      { m: "GET", cat: "Hazards", p: "/api/hazards", d: "Weather warnings, recent earthquakes and climate phase." },
      { m: "GET", cat: "Hazards", p: "/api/flood?state=Johor", d: "InfoBanjir river levels and heavy-rain alerts (state optional)." },
      { m: "GET", cat: "Hazards", p: "/api/news", d: "Latest Malaysia weather/hazard news items." },
      { m: "GET", cat: "System", p: "/health", d: "Liveness check (not rate-limited)." },
    ];

    let q = $state("");
    let open = $state(null);
    let copied = $state("");
    const copy = async (text) => { try { await navigator.clipboard?.writeText(text); copied = text; setTimeout(() => (copied = ""), 1300); } catch { /* noop */ } };
    const filtered = $derived(ENDPOINTS.filter((e) => `${e.m} ${e.p} ${e.cat} ${e.d}`.toLowerCase().includes(q.trim().toLowerCase())));
    const curlOf = (p) => `curl "${base}${p.replace(/<[^>]+>/g, "{value}")}"`;
    const urlOf = (e) => (e.p.includes("<") ? "" : `${base}${e.p}`); // openable live sample (no placeholders)
  </script>

  <section class="mx-auto max-w-[800px] py-4">
    <div class="card p-5">
      <div class="flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon name="globe" size={21} /></span>
        <div>
          <h2 class="text-[20px] font-extrabold tracking-tight">{tr("apiTitle")}</h2>
          <p class="text-[12.5px] text-muted">{tr("apiConventions")}</p>
        </div>
      </div>
      <p class="mt-3 text-[14px] leading-relaxed">{tr("apiIntro")}</p>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">{tr("apiNote")}</p>
    </div>

    <div class="mb-2 mt-6 flex flex-wrap items-center justify-between gap-2">
      <h3 class="qh !m-0">Endpoints</h3>
      <SearchInput bind:value={q} placeholder={tr("searchEndpoints")} ariaLabel={tr("searchEndpoints")} class="w-full max-w-[260px]" />
    </div>

    {#if filtered.length}
      {#each CATS as cat (cat)}
        {@const items = filtered.filter((e) => e.cat === cat)}
        {#if items.length}
          <Section title={cat} startOpen={!q}>
            <ul class="list-none m-0 space-y-2 p-0">
              {#each items as e (e.p)}
                <li class="card overflow-hidden">
                  <button class="flex w-full items-center gap-2.5 px-3.5 py-3 text-left" onclick={() => (open = open === e.p ? null : e.p)} aria-expanded={open === e.p}>
                    <span class="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-bold text-accent">{e.m}</span>
                    <code class="num min-w-0 flex-1 break-all text-[13px] font-medium">{e.p}</code>
                    <span class="grid size-6 shrink-0 place-items-center rounded-full bg-panel-2 text-muted transition-transform" style={open === e.p ? "transform:rotate(180deg)" : ""}><Icon name="chevronDown" size={14} /></span>
                  </button>
                  <p class="px-3.5 pb-2 text-[13px] leading-relaxed text-muted">{e.d}</p>
                  {#if open === e.p}
                    <pre class="num mx-3.5 mb-2 overflow-auto rounded-xl border border-line bg-panel-2 p-2.5 text-[12px]">{curlOf(e.p)}</pre>
                    <div class="mx-3.5 mb-3 flex gap-2">
                      <button class="pillfilter" onclick={() => copy(curlOf(e.p))}>{copied === curlOf(e.p) ? "Copied ✓" : "Copy"}</button>
                      {#if urlOf(e)}
                        <a class="pillfilter" href={urlOf(e)} target="_blank" rel="noopener">Open <Icon name="external" size={12} /></a>
                      {/if}
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          </Section>
        {/if}
      {/each}
    {:else}
      <p class="caption">No endpoints match “{q}”.</p>
    {/if}
  </section>