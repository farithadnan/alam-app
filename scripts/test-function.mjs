import { onRequest } from "../functions/api/[[path]].js";

// Proves the Pages function's guard: with no UDARA_API_ORIGIN set it must 502 with a
// clear message rather than fall back to a hardcoded origin. Run: node scripts/test-function.mjs
const ctx = {
  env: { UDARA_API_ORIGIN: "" },
  request: new Request("https://udara-dashboard.pages.dev/api/current?source=doe-eqms"),
};
const res = await onRequest(ctx);
const body = await res.text();
console.log("status:", res.status, "(expected 502)");
console.log("ct:", res.headers.get("content-type"));
console.log("body:", body.slice(0, 120));
if (res.status !== 502) process.exit(1);
