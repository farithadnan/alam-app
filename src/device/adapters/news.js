import { fetchText } from "../http.js";
import { slug } from "../text.js";

/**
 * Hazard news from key-free Malaysian RSS feeds only. (The server version also used
 * newsdata.io, which needs a paid key that cannot be shipped inside an installable
 * app — dropped per docs/device-only-app-spec.md §2.) General-category feeds are
 * included alongside the national feeds to keep the hazard feed populated on quiet
 * news days.
 */
const FEEDS = [
  { outlet: "Free Malaysia Today", url: "https://www.freemalaysiatoday.com/feed/" },
  { outlet: "Free Malaysia Today", url: "https://www.freemalaysiatoday.com/category/nation/feed/" },
  { outlet: "New Straits Times", url: "https://www.nst.com.my/feed" },
  { outlet: "Utusan Malaysia", url: "https://www.utusan.com.my/feed" },
  { outlet: "Malay Mail", url: "https://www.malaymail.com/feed" },
];

const KEYWORDS =
  /\b(flood|floods|flooding|flash flood|haze|hazy|jerebu|banjir|thunderstorm|thunderstorms|ribut petir|monsoon|drought|kemarau|heatwave|heat wave|earthquake|quake|gempa|tsunami|landslide|tanah runtuh|mudslide|typhoon|cyclone|aqi|air quality|air pollution|el niño|el nino|la niña|la nina|heavy rain|hujan lebat|weather warning|amaran cuaca|severe weather|kabus|kebakaran hutan|forest fire|hotspot)\b/i;

const OFF_TOPIC =
  /\b(badminton|football|soccer|hockey|medal|olympic|asian games|sea games|league|match|fixture|stadium|team|coach|player|title drought|box office|celebrity|artist|concert|album|zoo negara|pet|recipe|travel deal|share price|stocks?|ringgit|bond|ipo|earnings)\b/i;

export function relevance(title) {
  if (OFF_TOPIC.test(title)) return false;
  return KEYWORDS.test(title);
}

function parseRss(xml, outlet) {
  const out = [];
  for (const item of xml.split(/<item[\s>]/).slice(1)) {
    const title = (/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(item)?.[1] ?? "").trim();
    const link = (/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/.exec(item)?.[1] ?? "").trim();
    const date = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(item)?.[1] ?? "").trim();
    if (!title || !link || !relevance(title)) continue;
    out.push({
      source: "news",
      station: slug(link),
      stationName: title.slice(0, 200),
      measuredAt: date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : new Date().toISOString(),
      kind: "news",
      value: 0,
      meta: { url: link, outlet },
    });
  }
  return out;
}

export class NewsAdapter {
  id = "news";

  async poll() {
    const results = await Promise.allSettled(
      FEEDS.map(async (f) => parseRss(await fetchText(f.url), f.outlet)),
    );
    const seen = new Set();
    const out = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const o of r.value) {
        if (seen.has(o.station)) continue;
        seen.add(o.station);
        out.push(o);
      }
    }
    return out;
  }
}
