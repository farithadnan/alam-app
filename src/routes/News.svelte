<script>
    import { app } from "../core/store.svelte.js";
    import { timeAgo } from "../domain/flags.js";
    import { tr } from "../core/i18n.svelte.js";
    import SearchInput from "../ui/SearchInput.svelte";
    import PageHeader from "../ui/PageHeader.svelte";
    import EmptyState from "../ui/EmptyState.svelte";
    import Icon from "../ui/Icon.svelte";

    const news = $derived(app.data?.news ?? []);
    let newsQ = $state("");
    let showAll = $state(false);
    const NEWS_INITIAL = 8;

    const newsFiltered = $derived(
      news.filter((n) => {
        const q = newsQ.trim().toLowerCase();
        if (!q) return true;
        return `${n.title ?? ""} ${n.outlet ?? ""}`.toLowerCase().includes(q);
      }),
    );
  </script>

  <PageHeader title={tr("newsTitle")} updated={app.updated} />
  {#if news.length}
    <p class="caption mb-2 text-faint">{news.length} {tr("newsCount")}</p>
    <SearchInput bind:value={newsQ} placeholder={tr("searchNews")} ariaLabel={tr("searchNews")} />
    {#if newsFiltered.length}
      <ul class="mt-3 list-none space-y-2 p-0">
        {#each newsFiltered.slice(0, showAll ? newsFiltered.length : NEWS_INITIAL) as n, i (n.url ?? n.title + i)}
          <li class="card card-hover">
            <a class="flex items-start gap-2 p-3.5" href={n.url} target="_blank" rel="noopener">
              <span class="min-w-0 flex-1">
                <span class="block text-[14.5px] font-semibold leading-snug">{n.title}</span>
                <span class="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                  {#if n.outlet}<span class="badge">{n.outlet}</span>{/if}
                  {#if n.publishedAt}<span class="inline-flex items-center gap-1"><Icon name="clock" size={12} />{timeAgo(n.publishedAt)}</span>{/if}
                </span>
              </span>
              <Icon name="external" size={15} class="mt-0.5 shrink-0 text-faint" />
            </a>
          </li>
        {/each}
      </ul>
      {#if newsFiltered.length > NEWS_INITIAL}
        <button class="ghostbtn mt-3 w-full justify-center" onclick={() => (showAll = !showAll)}>{showAll ? tr("showLess") : tr("showMore")}</button>
      {/if}
    {:else}
      <EmptyState icon="🔍" title={tr("noMatches")} desc="" action={{ label: tr("clearSearch"), onClick: () => (newsQ = "") }} />
    {/if}
  {:else}
    <EmptyState icon="📰" title={tr("noNews")} />
  {/if}