/**
 * Alam — background sync runner (Power of the @capacitor/background-runner headless JS env).
 *
 * Loaded by the native BackgroundRunner when the OS wakes the app in the background.
 * This runs OUTSIDE the WebView: no DOM, no localStorage — but native `fetch` (no CORS,
 * it is not a browser) plus console/setTimeout/etc. are available.
 *
 * Phase 0: stub. Phase 1 fills this with the on-device ingest loop (adapters + SQLite
 * writes + alert evaluation). Must call resolve()/reject() or the OS kills the runner.
 */
addEventListener('fetchInBackground', (resolve, _reject) => {
  console.log('[alam-bg] background runner woke up (stub — ingest lands in Phase 1)');
  resolve();
});
