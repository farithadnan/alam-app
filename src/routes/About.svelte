<script>
    import { SITE } from "../core/config.js";
    import { tr } from "../core/i18n.svelte.js";
    import { dialog } from "../core/dialog.js";
    import Icon from "../ui/Icon.svelte";

    const FEAT_ICONS = ["air", "weather", "calendar", "alert", "globe", "moon"];
    const feats = $derived([tr("feat1"), tr("feat2"), tr("feat3"), tr("feat4"), tr("feat5"), tr("feat6")]);
    let reportOpen = $state(false);
    let rtype = $state("data");
    let rdesc = $state("");
    let remail = $state("");

    function openReport() { reportOpen = true; }
    function closeReport() { reportOpen = false; }

    function sendReport() {
      const subj = encodeURIComponent(`[Alam report] ${rtype}`);
      const body = encodeURIComponent(`${rdesc}\n\n—\nContact: ${remail || "n/a"}`);
      window.location.href = `mailto:${SITE.email}?subject=${subj}&body=${body}`;
    }
  </script>

  <section class="mx-auto max-w-[720px] py-4">
    <div class="card p-5">
      <div class="flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-2xl text-white text-[15px] font-extrabold tracking-tight" style="background:linear-gradient(135deg,var(--color-accent),#ff8a5c)">FA</span>
        <div>
          <h2 class="text-[20px] font-extrabold tracking-tight">{tr("aboutTitle")}</h2>
          <p class="text-[12.5px] text-muted">{tr("sources")}</p>
        </div>
      </div>
      <p class="mt-3 text-[14px] font-semibold leading-relaxed">{tr("aboutLead")}</p>
      <p class="mt-2 text-[14px] leading-relaxed text-muted">{tr("aboutWhat")}</p>
    </div>

    <h3 class="qh">{tr("featTitle")}</h3>
    <ul class="grid list-none gap-2 p-0 sm:grid-cols-2">
      {#each feats as f, i (f)}
        <li class="card flex items-center gap-3 p-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon name={FEAT_ICONS[i]} size={16} /></span>
          <span class="min-w-0 text-[13.5px] leading-snug">{f}</span>
        </li>
      {/each}
    </ul>

    <h3 class="qh">{tr("sourcesTitle")}</h3>
    <div class="card p-4"><p class="text-[14px] leading-relaxed text-muted">{tr("sourcesCredit")}</p></div>

    <h3 class="qh">{tr("privTitle")}</h3>
    <div class="card space-y-3 p-4 text-[14px] leading-relaxed text-muted">
      <p>{tr("privText")}</p>
      <p>{tr("discText")}</p>
    </div>

    <h3 class="qh">{tr("accuracyTitle")}</h3>
    <div class="card flex items-start gap-3 p-4">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-panel-2 text-muted"><Icon name="alert" size={16} /></span>
      <p class="text-[14px] leading-relaxed text-muted">{tr("dataNote")}</p>
    </div>

    <h3 class="qh">{tr("contactTitle")}</h3>
    <a class="card card-hover flex items-center gap-3 p-4" href={`mailto:${SITE.email}`}>
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-panel-2 text-muted"><Icon name="send" size={16} /></span>
      <span class="min-w-0">
        <span class="block text-[11.5px] text-muted">{tr("contactTitle")}</span>
        <span class="block truncate text-[14px] font-semibold">{SITE.email}</span>
      </span>
    </a>

    <button class="btn-primary mt-5" onclick={openReport} aria-haspopup="dialog" aria-expanded={reportOpen}><Icon name="alert" size={15} /> {tr("reportBtn")}</button>
  </section>

  {#if reportOpen}
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" tabindex="-1" class="absolute inset-0 bg-black/45 backdrop-blur-sm" aria-label={tr("dismiss")} onclick={closeReport}></button>
      <div use:dialog={{ onClose: closeReport }} class="relative w-full max-w-md rounded-t-3xl border border-line bg-panel p-5 shadow-2xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="report-title" tabindex="-1">
        <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden"></div>
        <div class="flex items-center justify-between">
          <h3 id="report-title" class="m-0 text-[17px] font-bold">{tr("reportTitle")}</h3>
          <button class="iconbtn !border-transparent !bg-transparent !px-2" onclick={closeReport} aria-label={tr("dismiss")}><Icon name="close" size={16} /></button>
        </div>
        <label class="mt-3 flex flex-col gap-1.5">
          <span class="eyebrow">{tr("reportType")}</span>
          <select bind:value={rtype}>
            <option value="data">{tr("reportTypeData")}</option>
            <option value="bug">{tr("reportTypeBug")}</option>
            <option value="idea">{tr("reportTypeIdea")}</option>
          </select>
        </label>
        <label class="mt-3 flex flex-col gap-1.5">
          <span class="eyebrow">{tr("reportDesc")}</span>
          <textarea class="min-h-[96px]" bind:value={rdesc} placeholder={tr("reportDescPh")}></textarea>
        </label>
        <label class="mt-3 flex flex-col gap-1.5">
          <span class="eyebrow">{tr("reportEmail")}</span>
          <input bind:value={remail} type="email" />
        </label>
        <div class="mt-4 flex items-center justify-between gap-2">
          <span class="caption text-[12px]">{tr("reportThanks")}</span>
          <button class="btn-primary" onclick={sendReport}>{tr("reportSend")}</button>
        </div>
      </div>
    </div>
  {/if}