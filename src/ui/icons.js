/**
 * Icon geometry.
 *
 * Kept out of the component so adding an icon is a data edit, and so the nav, buttons
 * and empty states all draw from one set. Each icon is a list of shapes; the component
 * only knows how to render them.
 */

/** @typedef {{ path?: string, circle?: [number, number, number], poly?: string, rect?: [number, number, number, number], radius?: number }} Shape */

/** @type {Record<string, Shape[]>} */
export const ICONS = {
  weather: [
    { circle: [12, 12, 4] },
    { path: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" },
  ],
  air: [
    { path: "M3 8h11a3 3 0 1 0-3-3" },
    { path: "M3 12h15a3 3 0 1 1-3 3" },
    { path: "M3 16h8" },
  ],
  quake: [{ path: "M2 12h4l2-7 4 14 2-7h8" }],
  home: [{ path: "M3 10.5 12 3l9 7.5" }, { path: "M5 9.5V20h14V9.5" }],
  flood: [{ path: "M2 9c1.6-2 3.2-2 4.8 0s3.2 2 4.8 0 3.2-2 4.8 0 3.2 2 4.8 0" }, { path: "M2 15c1.6-2 3.2-2 4.8 0s3.2 2 4.8 0 3.2-2 4.8 0 3.2 2 4.8 0" }],
  news: [{ path: "M4 5h13v16H4z" }, { path: "M17 9h3v12" }, { path: "M7 9h5M7 13h5M7 17h4" }],
  pin: [{ circle: [12, 10, 3] }, { path: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" }],
  sun: [
    { circle: [12, 12, 4] },
    { path: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" },
  ],
  moon: [{ path: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" }],
  sliders: [
    { path: "M4 7h9M17 7h3" }, { circle: [15, 7, 2] },
    { path: "M4 12h3M11 12h9" }, { circle: [9, 12, 2] },
    { path: "M4 17h9M17 17h3" }, { circle: [15, 17, 2] },
  ],
  close: [{ path: "M6 6l12 12M18 6L6 18" }],
  share: [
    { circle: [18, 5, 3] }, { circle: [6, 12, 3] }, { circle: [18, 19, 3] },
    { path: "M8.6 13.5l6.8 4.4M15.4 6.1L8.6 10.5" },
  ],
  chevron: [{ path: "M9 6l6 6-6 6" }],
  chevronDown: [{ path: "M6 9l6 6 6-6" }],
  chevronLeft: [{ path: "M15 6l-6 6 6 6" }],
  refresh: [{ path: "M21 12a9 9 0 1 1-2.6-6.4" }, { path: "M21 3v6h-6" }],
  search: [{ circle: [11, 11, 7] }, { path: "M20 20l-3.6-3.6" }],
  wind: [{ path: "M3 8h10a2.5 2.5 0 1 0-2.5-2.5" }, { path: "M3 12h14a2.5 2.5 0 1 1-2.5 2.5" }, { path: "M3 16h7" }],
  droplet: [{ path: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" }],
  thermometer: [{ path: "M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" }],
  gauge: [{ path: "M20 15a8 8 0 1 0-16 0" }, { path: "M12 15l4-4" }],
  shield: [{ path: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" }],
  alert: [{ path: "M12 3l9.5 16.5H2.5z" }, { path: "M12 10v4M12 17h.01" }],
  info: [{ circle: [12, 12, 9] }, { path: "M12 11v5M12 8h.01" }],
  external: [{ path: "M14 4h6v6" }, { path: "M20 4l-8 8" }, { path: "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" }],
  map: [{ path: "M9 4l6 2 6-2v14l-6 2-6-2-6 2V6z" }, { path: "M9 4v14M15 6v14" }],
  clock: [{ circle: [12, 12, 9] }, { path: "M12 7v5l3 2" }],
  layers: [{ path: "M12 3l9 5-9 5-9-5z" }, { path: "M3 13l9 5 9-5" }],
  compass: [{ circle: [12, 12, 9] }, { path: "M15.5 8.5l-2 5-5 2 2-5z" }],
  arrowRight: [{ path: "M5 12h14M13 6l6 6-6 6" }],
  arrowLeft: [{ path: "M19 12H5M11 6l-6 6 6 6" }],
  check: [{ path: "M5 13l4 4L19 7" }],
  plus: [{ path: "M12 5v14M5 12h14" }],
  minus: [{ path: "M5 12h14" }],
  globe: [{ circle: [12, 12, 9] }, { path: "M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" }],
  bell: [{ path: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" }, { path: "M10 20a2 2 0 0 0 4 0" }],
  activity: [{ path: "M3 12h4l2-7 4 14 2-7h6" }],
  eye: [{ path: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" }, { circle: [12, 12, 2.5] }],
  calendar: [{ rect: [3, 5, 18, 16], radius: 2 }, { path: "M3 10h18M8 3v4M16 3v4" }],
  sunrise: [{ path: "M12 3v4M5 10H3M21 10h-2M6 7 4.5 5.5M18 7l1.5-1.5" }, { path: "M4 18h16" }, { path: "M8 14a4 4 0 0 1 8 0" }],
  sunset: [{ path: "M12 7V3M5 10H3M21 10h-2M6 7 4.5 5.5M18 7l1.5-1.5" }, { path: "M4 18h16" }, { path: "M8 14a4 4 0 0 1 8 0" }],
  send: [{ path: "M22 2 11 13" }, { path: "M22 2l-7 20-4-9-9-4z" }],
  sparkle: [{ path: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" }],
};