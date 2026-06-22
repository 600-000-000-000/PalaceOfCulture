// Media catalog — the seam between the in-game player and Podcasting 2.0 feeds + Nostr live (ADR 0004).
//
// Plug-and-play first: a mock catalog with real, CORS-friendly audio so the player actually plays.
// Then swap in real sources without touching the UI:
//   - music + podcasts → `createPodcastingFeedCatalog(feedUrls)` parsing **Podcasting 2.0 RSS**
//     (`<podcast:medium>`, `<enclosure>`, artwork, `<podcast:value>` for V4V splits).
//   - live → a Nostr **NIP-53** (`kind:30311`) subscription → live events (streaming URL = HLS).
// UI modelled on Podverse (FOSS PC2.0 + V4V player): a browse list + a bottom now-playing bar.

import { loadFeedItems } from "./feed";
import { type Event, queryEvents, tag } from "./nostr";

export type MediaKind = "music" | "podcast" | "live";

export interface MediaItem {
  id: string;
  title: string;
  author: string;
  kind: MediaKind;
  audioUrl: string;
  /** Placeholder artwork tint until feeds bring real artwork. */
  tone: "gold" | "coral" | "teal";
  /** V4V: the Lightning value split boosts/stream-sats flow to (from <podcast:value> / NIP-57). */
  valueRecipient?: string;
  /** Live only: current listener count (from the NIP-53 event participants). */
  listeners?: number;
}

export interface MediaCatalog {
  load(): Promise<MediaItem[]>;
}

// Placeholder audio (SoundHelix, freely usable, CORS-open) so play/skip work end-to-end today.
const MOCK: MediaItem[] = [
  // --- Music ---
  {
    id: "mus-1",
    title: "Golden Hour",
    author: "The Builder",
    kind: "music",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    tone: "gold",
    valueRecipient: "builder@getalby.com",
  },
  {
    id: "mus-2",
    title: "Patience (Annual Rings)",
    author: "Wren",
    kind: "music",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    tone: "teal",
    valueRecipient: "wren@getalby.com",
  },
  {
    id: "mus-3",
    title: "Coral Festival",
    author: "Bríd",
    kind: "music",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    tone: "coral",
    valueRecipient: "brid@getalby.com",
  },
  // --- Podcasts ---
  {
    id: "pod-1",
    title: "The Signal — ep. 21",
    author: "600 Billion",
    kind: "podcast",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    tone: "gold",
    valueRecipient: "signal@getalby.com",
  },
  {
    id: "pod-2",
    title: "Time Builds Legend",
    author: "racooDNI",
    kind: "podcast",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    tone: "teal",
    valueRecipient: "dni@getalby.com",
  },
  // --- Live (mock NIP-53 events; real stream = HLS) ---
  {
    id: "live-1",
    title: "Strings of the Atlantic",
    author: "Plaza Main Stage",
    kind: "live",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    tone: "coral",
    valueRecipient: "stage@getalby.com",
    listeners: 142,
  },
  {
    id: "live-2",
    title: "Builder's Workshop (live)",
    author: "The Builder",
    kind: "live",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    tone: "gold",
    valueRecipient: "builder@getalby.com",
    listeners: 38,
  },
];

/** The plug-and-play catalog: on-brand mock items with real playable audio across all three kinds. */
export function createMockMediaCatalog(): MediaCatalog {
  return {
    load: () => Promise.resolve(MOCK),
  };
}

/**
 * Factory the player calls. Mock today; swap to PC2.0 feed parsing (music/podcasts) + a NIP-53 live
 * subscription (live) behind this same interface. See ADR 0004.
 */
// --- Real Nostr data ---------------------------------------------------------------------------

/** NIP-53 live event (kind 30311) → a live MediaItem. Streaming URL is usually HLS. */
function liveItem(event: Event): MediaItem | null {
  const streaming = tag(event, "streaming") ?? tag(event, "recording");
  const title = tag(event, "title");
  if (!streaming || !/^https?:/.test(streaming) || !title) return null;
  const listeners = Number(tag(event, "current_participants"));
  return {
    id: `live:${tag(event, "d") ?? event.id}`,
    title,
    author: tag(event, "summary") ?? "Live on Nostr",
    kind: "live",
    audioUrl: streaming,
    tone: "coral",
    valueRecipient: event.pubkey,
    listeners: Number.isFinite(listeners) && listeners > 0 ? listeners : undefined,
  };
}

/** Nostr audio track (kind 31337 Zapstr tags, or kind 32123 Wavlake JSON content) → a music item. */
function musicItem(event: Event): MediaItem | null {
  let url = tag(event, "media") ?? tag(event, "url") ?? tag(event, "enclosure");
  let title = tag(event, "title") ?? tag(event, "subject");
  let author = tag(event, "c") ?? tag(event, "creator") ?? tag(event, "artist");
  if (!url || !title) {
    try {
      const doc = JSON.parse(event.content) as Record<string, string>;
      url = url ?? doc.enclosure ?? doc.media ?? doc.url ?? doc.link;
      title = title ?? doc.title ?? doc.name;
      author = author ?? doc.creator ?? doc.artist ?? doc.author;
    } catch {
      /* content isn't a JSON track document */
    }
  }
  if (!url || !/^https?:/.test(url) || !title) return null;
  return {
    id: `mus:${event.id}`,
    title,
    author: author ?? "Nostr artist",
    kind: "music",
    audioUrl: url,
    tone: "teal",
    valueRecipient: event.pubkey,
  };
}

function dedupe(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  for (const item of items) {
    if (seen.has(item.audioUrl)) continue;
    seen.add(item.audioUrl);
    out.push(item);
  }
  return out;
}

/**
 * Real data off Nostr: live = NIP-53 (kind 30311), music = kind 31337/32123. Podcasts stay mock
 * (they're Podcasting 2.0 RSS, not a Nostr kind — a feed parser comes next). Falls back to the full
 * mock catalog if relays return nothing, so the player always has content.
 */
const isItem = (x: MediaItem | null): x is MediaItem => x !== null;

async function loadLive(): Promise<MediaItem[]> {
  try {
    const events = await queryEvents({ kinds: [30311], limit: 50 });
    return dedupe(events.map(liveItem).filter(isItem)).slice(0, 8);
  } catch {
    return [];
  }
}

async function loadMusic(): Promise<MediaItem[]> {
  try {
    const events = await queryEvents({ kinds: [31337, 32123], limit: 60 });
    return dedupe(events.map(musicItem).filter(isItem)).slice(0, 12);
  } catch {
    return [];
  }
}

async function loadPodcasts(): Promise<MediaItem[]> {
  try {
    return dedupe(await loadFeedItems()).slice(0, 12);
  } catch {
    return [];
  }
}

/**
 * Factory the player calls. Real data: music + live = Nostr (kind 31337/32123, NIP-53 30311);
 * podcasts = Podcasting 2.0 RSS (the same open catalog Fountain uses). Each kind falls back to its
 * mock if its source is empty, so the player always has content. See ADR 0004.
 */
export function createMediaCatalog(): MediaCatalog {
  return {
    async load() {
      const [music, podcasts, live] = await Promise.all([loadMusic(), loadPodcasts(), loadLive()]);
      const merged = [
        ...(music.length ? music : MOCK.filter((m) => m.kind === "music")),
        ...(podcasts.length ? podcasts : MOCK.filter((m) => m.kind === "podcast")),
        ...(live.length ? live : MOCK.filter((m) => m.kind === "live")),
      ];
      return merged.length ? merged : MOCK;
    },
  };
}
