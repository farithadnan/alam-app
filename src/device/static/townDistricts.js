import { MALAYSIA_LOCALITIES } from "../static/localities.js";
import { districtsOf } from "../static/metDistricts.js";

/**
 * Resolve a locality slug to its MET district. Pure function; the asserted town →
 * district exceptions live in the device store (town_districts table, migration 003).
 */
export function districtFor(townSlug, asserted) {
  if (!townSlug) return null;
  const town = MALAYSIA_LOCALITIES.find((l) => l.slug === townSlug);
  if (!town) return null;
  const districts = districtsOf(town.state).map((d) => d.name);
  if (asserted) return districts.includes(asserted) ? asserted : null;
  return districts.find((d) => d.toLowerCase() === town.name.toLowerCase()) ?? null;
}

/** True when the slug is a locality we poll. */
export function isLocality(townSlug) {
  return !!townSlug && MALAYSIA_LOCALITIES.some((l) => l.slug === townSlug);
}
