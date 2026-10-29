// One-tap shareable card, drawn on a <canvas> (no server, no image deps).
// Shares as a PNG via the Web Share API where available (mobile → WhatsApp,
// Telegram, etc.) and falls back to a download on desktop.
const W = 1080;
const H = 1080;

import { SITE } from "../core/config.js";

function wrap(ctx, text, x, y, maxW, lineH) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      line = w;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}

/** Rounded-rect path. `top` rounds only the top corners (for the accent bar). */
function rr(ctx, x, y, w, h, r, top = false) {
  ctx.beginPath();
  if (top) {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw the share card and return the canvas. `d` is any share.js payload:
 * { place, headline, valueLabel, icon, band, tip, extra, stats, footer, color }.
 * Same payload drives the friendly text and this infographic, so what you preview
 * is exactly what sends.
 */
function drawCard(d) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  const color = d.color || "#c14a1f";
  const M = 44;
  const X = M + 60;
  const CW = W - 2 * X;
  x.textBaseline = "alphabetic";

  // Page + white card + accent top bar.
  x.fillStyle = "#eef1f6";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#ffffff";
  rr(x, M, M, W - 2 * M, H - 2 * M, 44);
  x.fill();
  x.fillStyle = color;
  rr(x, M, M, W - 2 * M, 18, 44, true);
  x.fill();

  // Wordmark.
  x.fillStyle = "#0f1720";
  x.font = "800 46px system-ui, -apple-system, Segoe UI, sans-serif";
  x.fillText("OhAlam", X, M + 120);
  x.fillStyle = color;
  x.fillText(".", X + x.measureText("OhAlam").width, M + 120);

  // Place.
  x.fillStyle = "#5a6675";
  x.font = "400 40px system-ui, sans-serif";
  let y = wrap(x, d.place || "", X, M + 198, CW, 52);

  // Big value, with an optional condition glyph.
  const icon = d.icon || "";
  const big = String(d.valueLabel || d.headline || "").slice(0, 14);
  const bigY = y + 150;
  if (icon) { x.font = "84px serif"; x.fillText(icon, X, bigY - 22); }
  x.fillStyle = color;
  x.font = "800 118px system-ui, sans-serif";
  x.fillText(big, X + (icon ? 130 : 0), bigY);
  y = bigY;

  // Condition line under the value (when the value is a separate number).
  if (d.valueLabel && d.headline) {
    x.fillStyle = "#0f1720";
    x.font = "600 44px system-ui, sans-serif";
    y = wrap(x, d.headline, X, y + 70, CW, 54);
  }
  if (d.band) {
    x.fillStyle = color;
    x.font = "700 52px system-ui, sans-serif";
    y = wrap(x, d.band, X, y + 66, CW, 60);
  }

  // Stat chips (2 or 3 columns), the "infographic" part.
  const stats = (d.stats || []).slice(0, 6);
  if (stats.length) {
    const gap = 22;
    const cols = stats.length > 4 ? 3 : 2;
    const cw = (CW - gap * (cols - 1)) / cols;
    const ch = cols === 3 ? 118 : 132;
    const pad = cols === 3 ? 22 : 28;
    const labelFont = cols === 3 ? "600 26px system-ui, sans-serif" : "600 32px system-ui, sans-serif";
    const valFont = cols === 3 ? "800 44px system-ui, sans-serif" : "800 54px system-ui, sans-serif";
    const sy = y + 50;
    stats.forEach((s, i) => {
      const cxp = X + (i % cols) * (cw + gap);
      const cyp = sy + Math.floor(i / cols) * (ch + gap);
      x.fillStyle = "#f1f4f7";
      rr(x, cxp, cyp, cw, ch, 20);
      x.fill();
      x.fillStyle = "#5a6675";
      x.font = labelFont;
      x.fillText(String(s.label), cxp + pad, cyp + 46);
      x.fillStyle = "#0f1720";
      x.font = valFont;
      x.fillText(String(s.value), cxp + pad, cyp + 96);
    });
    y = sy + Math.ceil(stats.length / cols) * (ch + gap) - gap;
  }

  // Gentle tip.
  if (d.tip) {
    x.fillStyle = "#5a6675";
    x.font = "400 38px system-ui, sans-serif";
    y = wrap(x, d.tip, X, y + 70, CW, 50);
  }

  // Extra context above the footer.
  if (d.extra) {
    x.fillStyle = "#8a94a3";
    x.font = "400 32px system-ui, sans-serif";
    wrap(x, d.extra, X, H - M - 108, CW, 42);
  }

  // Footer link.
  x.fillStyle = "#8a94a3";
  x.font = "400 30px system-ui, sans-serif";
  wrap(x, d.footer || "OhAlam · Malaysia air, weather & hazards", X, H - M - 54, CW, 40);
  return c;
}

/** Render then share (or download). Returns "shared" | "downloaded" | "cancelled". */
/**
 * The share caption, composed from the same data the card is drawn from.
 *
 * Without this the share produced a bare image with no message, which is what made
 * an existing feature look like a missing one. The link is the live origin, so it
 * stays correct when the app moves to its own domain.
 */
export function shareCaption(d) {
  const where = [d.town, d.state].filter(Boolean).join(", ");
  const bits = [];
  if (d.value != null) {
    const shown = d.unit === "M" ? Number(d.value).toFixed(1) : Math.round(d.value);
    bits.push(`${d.unit ?? "AQI"} ${shown}${d.band ? ` ${d.band}` : ""}`);
  }
  if (d.temp != null) bits.push(`${d.temp}°${d.cond ? ` ${d.cond}` : ""}`);
  else if (d.cond) bits.push(d.cond);
  if (d.advice) bits.push(d.advice);
  const link = SITE.url;
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const body = [where, bits.join(", ")].filter(Boolean).join(": ");
  return link ? `${body}\n${date}\n${link}` : body;
}

/** A pre-filled social share intent (open in a new tab). */
export function shareIntent(service, text) {
  const t = encodeURIComponent(text || "").slice(0, 2000);
  switch (service) {
    case "wa": return `https://wa.me/?text=${t}`;
    case "x": return `https://twitter.com/intent/tweet?text=${t}`;
    case "fb": return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE.url)}&quote=${t}`;
    case "t": return `https://t.me/share/url?url=${encodeURIComponent(SITE.url)}&text=${t}`;
  }
  return "";
}

/** Share just the message: right for a warning that is going into a family chat. */
export async function shareText(d) {
  const text = d.text || shareCaption(d);
  const title = `OhAlam — ${d.town ?? "Malaysia"}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try { await navigator.share({ title, text }); return; } catch { /* dismissed */ }
  }
  try { await navigator.clipboard.writeText(text); } catch { /* nothing else to do */ }
}

export async function shareCard(d) {
  const canvas = drawCard(d);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return "cancelled";
  const file = new File([blob], "alam.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      // A share with no message is just an image; always carry the numbers.
      await navigator.share({ files: [file], title: `OhAlam — ${d.town ?? "Malaysia"}`, text: d.text || shareCaption(d) });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alam.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
