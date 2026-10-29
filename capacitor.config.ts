import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.farithadnan.alam',
  appName: 'OhAlam',
  webDir: 'dist',
  // The app talks to the data sources itself. Native-HTTTP (CapacitorHttp) is the hard
  // requirement from docs/device-only-app-spec.md §3.1: the sources that matter
  // (DOE eqms, InfoBanjir, NOAA, RSS) send no CORS headers, so the WebView's fetch
  // cannot reach them — routing through the native client removes that block entirely.
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    // Local notifications deliver on-device alerts (Phase 2 alert engine).
    // Local notifications deliver on-device alerts (Phase 2 alert engine).
    LocalNotifications: {},
    // Scheduled background refresh via @capacitor/background-runner. The runner script
    // lives at public/runners/fetch.js and is filled in during Phase 2 (alert checks
    // while the app is closed). Keeping the config here means the native plugin is
    // registered from day one.
    BackgroundRunner: {
      label: 'io.alam.background.fetch',
      src: 'runners/fetch.js',
      event: 'fetchInBackground',
      repeat: true,
      interval: 15,
      autoStart: true,
    },
  },
};

export default config;
