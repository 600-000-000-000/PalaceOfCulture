// Podcast discovery proxy (ADR 0004): server-side so the browser dodges CORS and (later) the Podcast
// Index API key stays off the client. Search = Apple iTunes (keyless, the whole public catalog —
// the same shows Fountain lists) today; swap to the Podcast Index API when PODCASTINDEX_KEY/SECRET
// are set (richer PC2.0 metadata). Feeds are fetched with a browser UA (some hosts 403 the default
// agent) and passed through to the client's Podcasting 2.0 parser, which reads the `<podcast:value>`
// V4V block straight from the real RSS.

const UA = "Mozilla/5.0 (compatible; 600Billion/0.1; +https://600000000000)";

export interface PodcastShow {
  title: string;
  author: string;
  feedUrl: string;
  artwork?: string;
}

interface ItunesResult {
  collectionName?: string;
  artistName?: string;
  feedUrl?: string;
  artworkUrl600?: string;
  artworkUrl100?: string;
}

/** Search the podcast catalog (Apple iTunes, keyless) → shows with their RSS feed URLs. */
export async function searchPodcasts(query: string): Promise<PodcastShow[]> {
  const term = query.trim();
  if (!term) return [];
  const url = `https://itunes.apple.com/search?media=podcast&limit=24&term=${encodeURIComponent(term)}`;
  const response = await fetch(url, { headers: { "user-agent": UA } });
  if (!response.ok) return [];
  const data = (await response.json()) as { results?: ItunesResult[] };
  const shows: PodcastShow[] = [];
  for (const result of data.results ?? []) {
    if (!result.feedUrl || !result.collectionName) continue;
    shows.push({
      title: result.collectionName,
      author: result.artistName ?? "",
      feedUrl: result.feedUrl,
      artwork: result.artworkUrl600 ?? result.artworkUrl100,
    });
  }
  return shows;
}

/** Fetch a podcast RSS feed (browser UA) and return the raw XML for the client's PC2.0 parser. */
export async function fetchFeed(feedUrl: string): Promise<string | null> {
  if (!/^https?:\/\//.test(feedUrl)) return null;
  const response = await fetch(feedUrl, { headers: { "user-agent": UA } });
  if (!response.ok) return null;
  return response.text();
}
