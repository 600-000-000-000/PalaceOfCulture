// Tier 2 — the truth-tier entrypoint. First real endpoint: the podcast discovery proxy (ADR 0004)
// so the browser can search the full catalog + fetch RSS feeds without CORS. Built on Node's http
// (zero runtime deps) for now; folds into Fastify + the event log / state machine per BUILD-BRIEF §6.

import { createServer } from "node:http";
import { fetchFeed, searchPodcasts } from "./api/podcasts";

const PORT = Number(process.env.PORT) || 8787;

const server = createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/api/health") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
      return;
    }
    if (url.pathname === "/api/podcasts/search") {
      const shows = await searchPodcasts(url.searchParams.get("q") ?? "");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ shows }));
      return;
    }
    if (url.pathname === "/api/podcasts/feed") {
      const xml = await fetchFeed(url.searchParams.get("url") ?? "");
      if (xml === null) {
        res.writeHead(502, { "content-type": "text/plain" });
        res.end("feed fetch failed");
        return;
      }
      res.writeHead(200, { "content-type": "application/rss+xml; charset=utf-8" });
      res.end(xml);
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  } catch {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("error");
  }
});

server.listen(PORT, () => {
  process.stdout.write(`[600b] feed proxy listening on http://localhost:${PORT}\n`);
});
