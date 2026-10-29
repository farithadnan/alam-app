import { locate } from "../../core/location.js";
import { nearestState } from "../../domain/flags.js";
import { app } from "../../core/store.svelte.js";

/** Ask the browser for a position and move the app to the nearest known state.
 * Returns the matched state ({ name, km }) or null. Throws when permission fails. */
export async function useMyLocation(states = []) {
  const { lat, lon } = await locate();
  const near = nearestState(lat, lon);
  if (near && states.includes(near.name)) app.state = near.name;
  return near;
}