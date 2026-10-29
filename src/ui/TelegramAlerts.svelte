  <script>
    import { tr } from "../core/i18n.svelte.js";
    import { telegramAlertsUrl } from "../domain/share.js";

    /** town (slug) + state open the bot pre-subscribed to that place. */
    let { town, state, class: cls = "", pill = false } = $props();
    let url = $derived(telegramAlertsUrl(town, state));
  </script>

  {#if url}
    <a
      class="{(pill ? "pillbtn" : "iconbtn") + " shrink-0 gap-1.5 " + cls}"
      href={url}
      target="_blank"
      rel="noopener"
      aria-label={tr("alertsTelegram")}
      title={tr("alertsTelegram")}
    >
      <span aria-hidden="true">🔔</span>
      <span class="text-[12px] font-medium hidden sm:inline">{tr("alertsTelegram")}</span>
    </a>
  {/if}
