<script>
  import { theme, toggleTheme } from "../../core/theme.svelte.js";
  import { lang, setLang } from "../../core/i18n.svelte.js";
  import Icon from "../../ui/Icon.svelte";

  /** Header settings popover: language + theme. */
  let open = $state(false);
</script>

<div class="relative">
  <button class="iconbtn !border-transparent !bg-transparent !px-2.5 hover:!bg-panel-2" onclick={() => (open = !open)} aria-label="Settings" title="Settings" aria-expanded={open} aria-haspopup="true"><Icon name="sliders" size={18} /></button>
  {#if open}
    <button class="fixed inset-0 z-40 cursor-default" onclick={() => (open = false)} aria-label="Close settings" tabindex="-1"></button>
    <div class="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-line bg-panel p-4 shadow-[var(--shadow-pop)]">
      <div class="eyebrow mb-2">Language</div>
      <div class="seg flex w-full">
        <button class:on={lang.code === "en"} class="segbtn flex-1 py-2" onclick={() => setLang("en")}>English</button>
        <button class:on={lang.code === "ms"} class="segbtn flex-1 py-2" onclick={() => setLang("ms")}>Bahasa</button>
      </div>
      <div class="eyebrow mb-2 mt-4">Theme</div>
      <div class="seg flex w-full">
        <button class:on={!theme.dark} class="segbtn flex flex-1 items-center justify-center gap-1.5 py-2" onclick={() => { if (theme.dark) toggleTheme(); }}><Icon name="sun" size={14} /> Light</button>
        <button class:on={theme.dark} class="segbtn flex flex-1 items-center justify-center gap-1.5 py-2" onclick={() => { if (!theme.dark) toggleTheme(); }}><Icon name="moon" size={14} /> Dark</button>
      </div>
    </div>
  {/if}
</div>