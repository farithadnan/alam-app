/**
 * WMO weather codes.
 *
 * Open-Meteo reports a numeric code; this maps it to the emoji and label the UI shows.
 * Split out of flags.js, which had grown into a drawer of five unrelated things.
 */

const WMO = {
  "0": ["☀️", "Clear"], "1": ["🌤️", "Mostly clear"], "2": ["⛅", "Partly cloudy"], "3": ["☁️", "Overcast"],
  "45": ["🌫️", "Fog"], "48": ["🌫️", "Fog"],
  "51": ["🌦️", "Drizzle"], "53": ["🌦️", "Drizzle"], "55": ["🌦️", "Drizzle"],
  "61": ["🌧️", "Rain"], "63": ["🌧️", "Rain"], "65": ["🌧️", "Rain"],
  "80": ["🌧️", "Showers"], "81": ["🌧️", "Showers"], "82": ["🌧️", "Showers"],
  "71": ["❄️", "Snow"], "73": ["❄️", "Snow"], "75": ["❄️", "Snow"],
  "95": ["⛈️", "Thunderstorm"], "96": ["⛈️", "Thunderstorm"], "99": ["⛈️", "Thunderstorm"],
};

/** Icon + label for a code. Pass `isNight` to swap clear skies for a night icon. */
export const wmo = (code, isNight = false) => {
  const c = String(code);
  const [icon, label] = WMO[c] || ["🌡️", "—"];
  if (isNight && (c === "0" || c === "1")) return ["🌙", label];
  if (isNight && c === "2") return ["☁️", label];
  return [icon, label];
};

/** Whether it is currently night at the station, from the sunrise/sunset its feed gave. */
export const isNightNow = (meta) => {
  const sR = meta?.sunrise, sS = meta?.sunset;
  if (!sR || !sS) return false;
  const hm = (iso) => {
    const h = parseInt(iso.slice(11, 13), 10), m = parseInt(iso.slice(14, 16), 10);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };
  const rise = hm(sR), set = hm(sS);
  const d = new Date();
  let mh = d.getUTCHours() + 8; // Malaysia is UTC+8, no DST
  if (mh >= 24) mh -= 24;
  const now = mh * 60 + d.getUTCMinutes();
  return now < rise || now >= set;
};
