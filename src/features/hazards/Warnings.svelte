<script>
import { app } from "../../core/store.svelte.js";
import { timeAgo, severityColor } from "../../domain/flags.js";
import { tr, severityWord } from "../../core/i18n.svelte.js";
import { activeWarnings } from "../../domain/warnings.js";
import ShareButton from "../../ui/ShareButton.svelte";
import { warningSharePayload } from "../../domain/share.js";

const warnings = $derived(activeWarnings(app.data?.hazards?.warnings ?? []));
let openW = $state({});
function toggle(w) {
  openW[w.station + w.measuredAt] = !openW[w.station + w.measuredAt];
}
</script>

{#if warnings.length}
  <ul class="mt-1 list-none space-y-2 p-0">
    {#each warnings as w (w.station + w.measuredAt)}
      {@const c = severityColor(w.severity)}
      <li class="card p-3.5" style="border-left:3px solid {c}">
        <div class="flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="text-[14.5px] font-bold leading-snug">{w.title}</div>
              <ShareButton textOnly payload={warningSharePayload({ title: w.title, text: w.meta?.textEn ?? w.meta?.textBm ?? "", when: timeAgo(w.measuredAt) })} />
            </div>
            <div class="mt-1 text-[12.5px] text-muted">{timeAgo(w.measuredAt)}</div>
            {#if w.meta?.validTo}
              <div class="text-[12px] text-faint">{tr("validUntil")} {new Date(w.meta.validTo).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}</div>
            {/if}
            {#if w.meta?.textEn}
              <button class="ghostbtn mt-2 !min-h-0 !py-1.5 text-[12px]" onclick={() => toggle(w)} aria-expanded={openW[w.station + w.measuredAt]}>
                {openW[w.station + w.measuredAt] ? tr("hideFull") : tr("readFull")}
              </button>
              {#if openW[w.station + w.measuredAt]}
                <p class="mt-2 text-[12.5px] leading-relaxed text-muted">{w.meta.textEn}</p>
              {/if}
            {/if}
          </div>
          <span class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold" style="color:{c};background:color-mix(in srgb, {c} 14%, transparent)">{severityWord(w.severity)}</span>
        </div>
      </li>
    {/each}
  </ul>
{/if}