// Pleb Market — the seam between the in-game market grid and a real Nostr marketplace (plebeian.market).
//
// "Wire plebeian.market in directly": plebeian.market is a Nostr-native marketplace — NIP-15 product
// events (kind 30018), pivoting to NIP-99 classified listings (kind 30402). We read those OPEN events
// off the same shared relay pool the feed + media use (net/nostr.ts) — never their GPL-3.0 code, just
// the open protocol — and drop them into the existing market grid. The Buy button deeplinks to the
// product on plebeian.market (`/products/<naddr>`, their documented share format) so the actual
// Lightning checkout happens on their domain — app-owns-truth, we never custody the payment.
//
// Plug-and-play first (same pattern as net/media.ts): an on-brand mock when relays are quiet so the
// grid is never empty.

import { NDKClassified } from "@nostr-dev-kit/ndk";
import type { IconName, MarketItem } from "../frontend/types";
import { type Event, queryEvents, tag } from "./nostr";

// plebeian.market individual product page is /products/<id>, where <id> is the NIP-19 `naddr` of the
// listing event (their share format). NDK encodes that for us via event.encode().
const PLEBEIAN_PRODUCT_BASE = "https://plebeian.market/products";

const TONES = ["gold", "coral", "teal", "deep"] as const;

/** Map a marketplace category (NIP `t` tags / free text) onto one of our existing market icons. */
function iconForCategory(category: string): IconName {
  const c = category.toLowerCase();
  if (/cloth|shirt|hoodie|wear|apparel|outfit|hat/.test(c)) return "shirt";
  if (/car|vehicle|bike|rover|boat|ship/.test(c)) return "car";
  if (/garden|plant|tree|seed|sapling|flower|herb/.test(c)) return "sprout";
  if (/tool|forge|craft|hardware|metal/.test(c)) return "hammer";
  if (/art|paint|print|decor|design/.test(c)) return "brush";
  if (/land|plot|estate|property|real/.test(c)) return "map";
  if (/pet|animal|collar/.test(c)) return "paw";
  if (/event|ticket|light|lantern|music/.test(c)) return "events";
  return "store";
}

/** Format a price for the card. Sats/btc render as a bare number (zap icon); fiat keeps its code. */
function formatPrice(amount: string | number | undefined, currency: string | undefined): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  const cur = (currency ?? "").trim().toUpperCase();
  if (!Number.isFinite(n) || n <= 0) return cur ? `ask · ${cur}` : "ask";
  const num = Math.round(n).toLocaleString("en-US");
  if (!cur || cur === "SAT" || cur === "SATS" || cur === "BTC" || cur === "MSAT") return num;
  return `${num} ${cur}`;
}

function shortNpub(npub: string): string {
  return npub.length > 16 ? `${npub.slice(0, 9)}…${npub.slice(-4)}` : npub;
}

/** Author npub for the meta line — NDK derives it from the event's pubkey. */
function npubFor(event: Event): string {
  try {
    return event.author.npub;
  } catch {
    return event.pubkey;
  }
}

/** First http(s) image URL from a string or string[] (NIP-15 `images` / NIP-99 `image` tag). */
function firstImage(value: unknown): string | undefined {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && /^https?:\/\//.test(entry)) return entry;
    }
  }
  return undefined;
}

/** The plebeian.market deeplink for a listing — its naddr (via NDK) on the /products page. */
function productHref(event: Event): string | undefined {
  try {
    return `${PLEBEIAN_PRODUCT_BASE}/${event.encode()}`;
  } catch {
    return undefined;
  }
}

/** NIP-15 product (kind 30018): JSON content {name, price, currency, quantity, ...} + `d`/`t` tags. */
function listingFromProduct(event: Event): MarketItem | null {
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(event.content) as Record<string, unknown>;
  } catch {
    return null;
  }
  const title = typeof doc.name === "string" ? doc.name.trim() : tag(event, "title");
  const identifier = tag(event, "d") ?? (typeof doc.id === "string" ? doc.id : undefined);
  if (!title || !identifier) return null;
  const quantity = Number(doc.quantity);
  if (Number.isFinite(quantity) && quantity <= 0) return null; // out of stock
  const category = tag(event, "t") ?? "goods";
  return {
    id: `nip15:${event.id}`,
    title,
    meta: `${category} · ${shortNpub(npubFor(event))}`,
    price: formatPrice(doc.price as string | number | undefined, doc.currency as string),
    image: firstImage(doc.images) ?? firstImage(doc.image),
    badge: "WTS",
    icon: iconForCategory(category),
    tone: "gold",
    href: productHref(event),
  };
}

/** NIP-99 classified (kind 30402): NDKClassified parses title/summary/price; `image` tag for the photo. */
function listingFromClassified(event: Event): MarketItem | null {
  const listing = NDKClassified.from(event);
  const title = listing.title;
  if (!title) return null;
  const status = tag(event, "status");
  if (status === "sold" || status === "ended") return null; // only show what's still for sale
  const category = tag(event, "t") ?? "goods";
  return {
    id: `nip99:${event.id}`,
    title,
    meta: `${category} · ${shortNpub(npubFor(event))}`,
    price: formatPrice(listing.price?.amount, listing.price?.currency),
    image: firstImage(event.tagValue("image")),
    badge: "WTS",
    icon: iconForCategory(category),
    tone: "gold",
    href: productHref(event),
  };
}

/** Drop duplicate listings (same title + price) and give the survivors a rotating tone for variety. */
function finalize(items: MarketItem[]): MarketItem[] {
  const seen = new Set<string>();
  const out: MarketItem[] = [];
  for (const item of items) {
    const key = `${item.title.toLowerCase()}|${item.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, tone: TONES[out.length % TONES.length] ?? "gold" });
  }
  return out;
}

const isItem = (x: MarketItem | null): x is MarketItem => x !== null;

/**
 * Real listings off Nostr: NIP-15 products (kind 30018) + NIP-99 classifieds (kind 30402), the open
 * events plebeian.market publishes. Falls back to the on-brand mock if relays return nothing or error,
 * so the grid is never blank. The Buy button on each card deeplinks to plebeian.market for checkout.
 */
export async function loadPlebListings(): Promise<MarketItem[]> {
  try {
    const [products, classifieds] = await Promise.all([
      queryEvents({ kinds: [30018], limit: 60 }),
      queryEvents({ kinds: [30402], limit: 60 }),
    ]);
    const items = finalize([
      ...products.map(listingFromProduct).filter(isItem),
      ...classifieds.map(listingFromClassified).filter(isItem),
    ]).slice(0, 24);
    return items.length ? items : MARKET_MOCK;
  } catch {
    return MARKET_MOCK;
  }
}

// --- Mock fallback (on-brand, used when the market relays are quiet) --------------------------------
// Buy links point at the plebeian.market storefront so the deeplink is exercised even on fallback.

export const MARKET_MOCK: MarketItem[] = [
  {
    id: "lantern",
    title: "Founder Lantern",
    meta: "goods · npub1fo…rge",
    price: "50,000",
    badge: "WTS",
    icon: "events",
    tone: "gold",
    href: PLEBEIAN_PRODUCT_BASE,
  },
  {
    id: "corner-plot",
    title: "Corner Plot / near stage",
    meta: "land · npub1pl…aza",
    price: "1,200,000",
    badge: "WTS",
    icon: "map",
    tone: "coral",
    href: PLEBEIAN_PRODUCT_BASE,
  },
  {
    id: "rover",
    title: "Restored Rover",
    meta: "vehicle · npub1ro…ver",
    price: "380,000",
    badge: "WTS",
    icon: "car",
    tone: "teal",
    href: PLEBEIAN_PRODUCT_BASE,
  },
  {
    id: "sapling",
    title: "Cherry Sapling",
    meta: "garden · npub1gr…den",
    price: "8,000",
    badge: "WTS",
    icon: "sprout",
    tone: "deep",
    href: PLEBEIAN_PRODUCT_BASE,
  },
  {
    id: "sign",
    title: "Hand-forged Sign",
    meta: "goods · npub1si…gns",
    price: "22,000",
    badge: "WTB",
    icon: "hammer",
    tone: "gold",
    href: PLEBEIAN_PRODUCT_BASE,
  },
  {
    id: "collar",
    title: "Woven Collar",
    meta: "pet cosmetic · npub1pe…t",
    price: "12,000",
    badge: "WTS",
    icon: "paw",
    tone: "coral",
    href: PLEBEIAN_PRODUCT_BASE,
  },
];
