/**
 * Warning grouping — direct port of alam-api/src/core/warnings.ts.
 * MET issues one bulletin per state with identical text; group by heading and keep
 * the most complete text + newest issue time.
 */

function keyOf(w) {
  const meta = w.meta ?? {};
  return String(meta.headingEn ?? w.title ?? "").trim();
}

function textOf(w) {
  const meta = w.meta ?? {};
  return String(meta.textEn ?? meta.textBm ?? "");
}

export function groupWarnings(rows) {
  const byKey = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    const seen = byKey.get(key);
    if (!seen) {
      byKey.set(key, row);
      continue;
    }
    const keep = textOf(row).length > textOf(seen).length ? row : seen;
    const at = String(row.measuredAt ?? "") > String(seen.measuredAt ?? "") ? row.measuredAt : seen.measuredAt;
    byKey.set(key, { ...keep, measuredAt: at ?? keep.measuredAt });
  }
  return [...byKey.values()];
}
