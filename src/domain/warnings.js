/**
 * Which warnings are on screen.
 *
 * The Home chip counted the raw API list while the list itself filtered out expired
 * bulletins, so the page could say "1 warnings in force" above an empty list. Both now
 * call this, so the number and the list always agree.
 */

/** A warning is shown while it is valid, and for an hour after it lapses. */
const GRACE_MS = 3_600_000;

export function activeWarnings(list = [], now = Date.now()) {
  return list.filter((w) => {
    const validTo = w?.meta?.validTo;
    if (!validTo) return true;
    const at = new Date(validTo).getTime();
    // An unparseable date is a data problem we cannot judge, so the warning stays
    // visible rather than being silently hidden.
    return !Number.isFinite(at) || at >= now - GRACE_MS;
  });
}
