import type { MediaItem } from "./media";

// Podcasting 2.0 RSS → MediaItems (ADR 0004). This is the same open catalog Fountain uses, so the
// content matches. Browsers can't fetch arbitrary feeds cross-origin (CORS), so the real path is a
// server proxy (apps/server) that also fronts the Podcast Index API (search the whole catalog) +
// caching. For now we parse same-origin sample feeds saved under public/feeds/ (real PC2.0 shows).

const FEEDS = ["/feeds/pc20.xml"];
const TONES = ["gold", "teal", "coral"] as const;

/** First descendant element's text by (qualified) tag name. */
function text(scope: Element | Document, name: string): string | undefined {
  return scope.getElementsByTagName(name)[0]?.textContent?.trim() || undefined;
}

/** Parse one Podcasting 2.0 feed document into MediaItems (latest episodes/tracks). */
export function parseFeed(xml: string, toneSeed = 0): MediaItem[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const channel = doc.querySelector("channel");
  if (!channel || doc.querySelector("parsererror")) return [];

  const show = text(channel, "title") ?? "Podcast";
  const medium = text(channel, "podcast:medium");
  const kind: MediaItem["kind"] = medium === "music" ? "music" : "podcast";
  const valueRecipient =
    doc.getElementsByTagName("podcast:valueRecipient")[0]?.getAttribute("address") ?? undefined;

  const out: MediaItem[] = [];
  const items = Array.from(doc.getElementsByTagName("item")).slice(0, 12);
  items.forEach((item, index) => {
    const enclosure = item.getElementsByTagName("enclosure")[0];
    const url = enclosure?.getAttribute("url");
    const type = enclosure?.getAttribute("type") ?? "";
    const title = text(item, "title");
    if (!url || !title || !/^https?:/.test(url)) return;
    if (type && !/audio|mpeg|mp3|m4a|aac|ogg/i.test(type)) return; // audio enclosures only
    out.push({
      id: `feed:${url}`,
      title,
      author: show,
      kind,
      audioUrl: url,
      tone: TONES[(toneSeed + index) % TONES.length] ?? "gold",
      valueRecipient,
    });
  });
  return out;
}

/** A podcast show from the catalog search (the server proxy fronts iTunes / Podcast Index). */
export interface PodcastShow {
  title: string;
  author: string;
  feedUrl: string;
  artwork?: string;
}

/** Search the whole podcast catalog (the same shows Fountain lists) via the server proxy. */
export async function searchPodcastShows(query: string): Promise<PodcastShow[]> {
  if (!query.trim()) return [];
  try {
    const response = await fetch(`/api/podcasts/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = (await response.json()) as { shows?: PodcastShow[] };
    return data.shows ?? [];
  } catch {
    return [];
  }
}

/** Load a show's episodes by RSS feed URL via the server proxy (parses PC2.0 incl. the value block). */
export async function loadShowEpisodes(feedUrl: string): Promise<MediaItem[]> {
  try {
    const response = await fetch(`/api/podcasts/feed?url=${encodeURIComponent(feedUrl)}`);
    if (!response.ok) return [];
    return parseFeed(await response.text());
  } catch {
    return [];
  }
}

/** Fetch + parse the configured feeds (same-origin for now; a server proxy widens this later). */
export async function loadFeedItems(): Promise<MediaItem[]> {
  const perFeed = await Promise.all(
    FEEDS.map(async (url, index) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return [];
        return parseFeed(await response.text(), index * 5);
      } catch {
        return [];
      }
    }),
  );
  return perFeed.flat();
}
