<script>
  import { tr } from "../core/i18n.svelte.js";
  import { shareCard, shareText, shareCaption, shareIntent } from "../domain/sharecard.js";
  import Icon from "./Icon.svelte";

  /** `payload` comes from domain/share.js so every share entry point is identical.
   * Where the platform supports it, sharing sends the infographic image (via the OS
   * share sheet, which attaches the file to any chosen app). The text fallback menu
   * only appears where native file sharing is unavailable (most desktops). */
  let { payload, textOnly = false, class: cls = "", pill = false } = $props();
  let open = $state(false);
  let el;
  let pos = $state({ left: 0, top: 0 });
  const msg = $derived(payload?.text || shareCaption(payload));
  const items = $derived([
    { label: "WhatsApp", href: shareIntent("wa", msg) },
    { label: "X (Twitter)", href: shareIntent("x", msg) },
    { label: "Facebook", href: shareIntent("fb", msg) },
    { label: "Telegram", href: shareIntent("t", msg) },
  ]);
  const nativeShare = typeof navigator !== "undefined" && !!navigator.share;

  // The menu is position:fixed (not absolute) so a clipped/overflow:hidden ancestor (the
  // home weather banner) can never cut it off. Position from the button's real viewport
  // rect, flip up when it would run off the bottom, and clamp inside the viewport.
  const W = 224, H = 232;
  function place() {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const up = r.bottom + H > vh;
    const left = Math.max(8, Math.min(r.right - W, vw - W - 8));
    const top = up ? Math.max(8, r.top - H - 4) : r.bottom + 4;
    pos = { left, top };
  }

  function onClick() {
    if (textOnly) { void shareText(payload); return; }   // warnings: plain text
    if (nativeShare) { void shareCard(payload); return; } // image via OS sheet (any app)
    open = !open;
    if (open) place();
  }
</script>

<div class="relative inline-flex" bind:this={el}>
  <button
    class="{(pill ? "pillbtn" : "iconbtn") + " shrink-0 gap-1.5 " + cls}"
    onclick={onClick}
    aria-label={tr("share")}
    title={tr("share")}
    aria-haspopup={nativeShare && !textOnly ? undefined : "menu"}
    aria-expanded={open}
  >
    <span aria-hidden="true" class="inline-flex"><Icon name="share" size={16} /></span>
    <span class="text-[12px] font-medium hidden sm:inline">{tr("share")}</span>
  </button>

  {#if open}
    <button class="fixed inset-0 z-40 cursor-default" onclick={() => (open = false)} aria-label="Close share menu"></button>
    <div style="position:fixed;left:{pos.left}px;top:{pos.top}px" role="menu" class="z-50 w-56 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-panel p-1.5 text-[13px] shadow-[var(--shadow-pop)]">
      <button class="shareitem font-semibold" role="menuitem" onclick={() => { open = false; void shareCard(payload); }}>
        <span aria-hidden="true">🖼</span>{tr("shareCardBtn")}
      </button>
      <a class="shareitem" role="menuitem" href="https://wa.me/?text={encodeURIComponent(msg)}" target="_blank" rel="noopener" onclick={() => (open = false)}>
        <span aria-hidden="true">💬</span>WhatsApp
      </a>
      <a class="shareitem" role="menuitem" href={items[1].href} target="_blank" rel="noopener" onclick={() => (open = false)}>
        <span aria-hidden="true">𝕏</span>X (Twitter)
      </a>
      <a class="shareitem" role="menuitem" href={items[2].href} target="_blank" rel="noopener" onclick={() => (open = false)}>
        <span aria-hidden="true">📘</span>Facebook
      </a>
      <a class="shareitem" role="menuitem" href={items[3].href} target="_blank" rel="noopener" onclick={() => (open = false)}>
        <span aria-hidden="true">✈️</span>Telegram
      </a>
    </div>
  {/if}
</div>

<style>
  .shareitem { display: flex; align-items: center; gap: 0.5rem; width: 100%; border-radius: 0.5rem; padding: 0.45rem 0.6rem; text-align: left; cursor: pointer; color: var(--color-fg); }
  .shareitem:hover { background: var(--color-line); }
</style>