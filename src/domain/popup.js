/**
 * Build a map popup in one place — every map used to inline its own HTML string.
 * @param {{title?:string, value?:string, valueColor?:string, sub?:string, note?:string, flag?:string}} p
 */
export function mapPopup(p) {
  const line = (t, style = "") => (t ? `<div style="${style}">${t}</div>` : "");
  return (
    line(p.title, "font:600 15px system-ui;color:#242628") +
    line(p.value, `font:800 26px system-ui;line-height:1.1;color:${p.valueColor || "#242628"}`) +
    line(p.flag, `font:700 12px system-ui;color:${p.valueColor || "#242628"}`) +
    line(p.sub, "font:12px system-ui;color:#6b6258") +
    line(p.note, "font:12px system-ui;color:#8a8277")
  );
}
