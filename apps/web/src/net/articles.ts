// Articles — the seam between Home's "Articles" tab and Nostr long-form content (NIP-23, kind 30023).
//
// These are the "blog posts" of Nostr — what Habla.news / Yakihonne publish. NDK's NDKArticle wrapper
// parses the title / summary / header image / published_at for us; we render them as article cards and
// deeplink "Read" out to an open NIP-23 reader (habla.news) since there's no in-app reader yet — same
// pattern as the market Buy deeplink. Mock fallback (on-brand) so the tab is never blank.

import { NDKArticle } from "@nostr-dev-kit/ndk";
import { type Event, type NDKFilter, queryEvents } from "./nostr";

// habla.news resolves any NIP-23 article by its naddr at /a/<naddr>.
const HABLA_BASE = "https://habla.news/a";

export type Article = {
  id: string;
  title: string;
  summary: string;
  image?: string;
  author: string;
  /** Composed meta line: shortened npub · relative time. */
  meta: string;
  /** External read link (the article on habla.news). */
  href: string;
  readingMinutes: number;
};

function shortNpub(npub: string): string {
  return npub.length > 16 ? `${npub.slice(0, 10)}…${npub.slice(-4)}` : npub;
}

function npubFor(event: Event): string {
  try {
    return event.author.npub;
  } catch {
    return event.pubkey;
  }
}

function timeAgo(createdAtSec: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - createdAtSec));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Strip the loudest Markdown so a content excerpt reads as plain text in the summary line. */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toArticle(article: NDKArticle, name?: string): Article {
  const npub = npubFor(article);
  const when = article.published_at ?? article.created_at ?? 0;
  const words = article.content.trim().split(/\s+/).length;
  return {
    id: article.id,
    title: (article.title ?? "Untitled").trim(),
    summary: (article.summary?.trim() || stripMarkdown(article.content).slice(0, 180)).trim(),
    image: article.image,
    author: name ?? shortNpub(npub),
    meta: `${shortNpub(npub)} · ${timeAgo(when)}`,
    href: `${HABLA_BASE}/${article.encode()}`,
    readingMinutes: Math.max(1, Math.round(words / 200)),
  };
}

type Profile = { name?: string };

/** Resolve kind:0 display names for a set of pubkeys (newest profile wins). */
async function resolveNames(pubkeys: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(pubkeys)].slice(0, 100);
  const names = new Map<string, string>();
  if (!unique.length) return names;
  try {
    const metas = await queryEvents({ kinds: [0], authors: unique }, 3500);
    const newest = new Map<string, number>();
    for (const meta of metas) {
      const ts = meta.created_at ?? 0;
      if ((newest.get(meta.pubkey) ?? 0) >= ts) continue;
      newest.set(meta.pubkey, ts);
      try {
        const doc = JSON.parse(meta.content) as Profile & { display_name?: string };
        const name = (doc.display_name || doc.name || "").trim();
        if (name) names.set(meta.pubkey, name);
      } catch {
        /* profile content isn't valid JSON */
      }
    }
  } catch {
    /* relays quiet — fall back to short npubs */
  }
  return names;
}

/**
 * Real NIP-23 long-form off the relays (newest first), optionally narrowed to a `#t` hashtag set.
 * Substantial posts only (has a title + a body of real length). Falls back to the on-brand mock.
 */
export async function loadArticles(hashtags?: string[]): Promise<Article[]> {
  const filter: NDKFilter<number> = hashtags?.length
    ? { kinds: [30023], "#t": hashtags, limit: 40 }
    : { kinds: [30023], limit: 40 };
  try {
    const events = await queryEvents(filter, 5000);
    const articles = events
      .map((event) => NDKArticle.from(event))
      .filter((article) => article.title && article.content.trim().length > 200)
      .sort((a, b) => (b.published_at ?? b.created_at ?? 0) - (a.published_at ?? a.created_at ?? 0))
      .slice(0, 24);
    if (!articles.length) return MOCK_ARTICLES;
    const names = await resolveNames(articles.map((article) => article.pubkey));
    return articles.map((article) => toArticle(article, names.get(article.pubkey)));
  } catch {
    return MOCK_ARTICLES;
  }
}

// --- Mock fallback (on-brand, used when the relays are quiet) ---------------------------------------

export const MOCK_ARTICLES: Article[] = [
  {
    id: "mock-art-1",
    title: "Time as the only honest currency",
    summary:
      "Money buys style, but time builds legend. A short essay on why a timelock is worth more than what it holds.",
    author: "racooDNI",
    meta: "npub1dn…420 · 2d",
    href: "https://habla.news",
    readingMinutes: 6,
  },
  {
    id: "mock-art-2",
    title: "Building the Palace of Culture, brick by signed brick",
    summary:
      "How the app owns the truth while Nostr carries the social layer — notes from the build.",
    author: "flx",
    meta: "npub1fl…600 · 5d",
    href: "https://habla.news",
    readingMinutes: 9,
  },
];
