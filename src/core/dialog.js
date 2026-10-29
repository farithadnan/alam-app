/**
 * Accessible dialog behavior as a Svelte action — one implementation for every
 * modal/sheet in the app: locks background scroll, traps Tab inside the node,
 * closes on Escape, and focuses the first control on open.
 *
 *   <div use:dialog={{ onClose }} role="dialog" aria-modal="true">…</div>
 */
export function dialog(node, params = {}) {
  let opts = params;
  const opener = typeof document !== "undefined" ? document.activeElement : null;
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const focusables = () =>
    [...node.querySelectorAll('button, [href], select, input, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);

  const onKey = (e) => {
    if (e.key === "Escape") { opts.onClose?.(); return; }
    if (e.key !== "Tab") return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  node.addEventListener("keydown", onKey);
  requestAnimationFrame(() => node.querySelector("select, input, textarea, button")?.focus());

  return {
    update(p) { opts = p; },
    destroy() {
      node.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    },
  };
}
