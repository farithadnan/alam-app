import { mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 8098);
const API = process.env.API_UPSTREAM ?? "http://localhost:8080";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

// Dev preview: serves the dashboard static app AND proxies /api/* to the API service,
// so one port/tunnel exposes both (otherwise the browser's fetch would hit the user's
// own localhost, not the server). Remove in favour of Cloudflare Pages + real API host later.
mkdirSync(join(ROOT, ".cache"), { recursive: true });

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname.startsWith("/api/")) {
    try {
      const up = await fetch(API + url.pathname + url.search);
      res.writeHead(up.status, { "content-type": "application/json; charset=utf-8" });
      res.end(await up.text());
    } catch {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "api upstream unavailable" }));
    }
    return;
  }
  let file = join(ROOT, url.pathname === "/" ? "index.html" : url.pathname.slice(1));
  try {
    if (!statSync(file).isFile()) throw new Error("not file");
    const body = readFileSync(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(PORT, () => console.log(`preview: http://localhost:${PORT} (api -> ${API})`));
