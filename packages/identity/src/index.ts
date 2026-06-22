// @600b/identity — the Nostr key identities for 600 Billion: the player (non-custodial) and the
// ENTITY service identities (palaces / guilds / system NPCs), derived from one master seed.
//
// ⚠️ DEMO PHASE: a hardcoded, public DEMO_SEED makes entity npubs stable so the whole write path can
// be built and tested with throwaway keys. The real seed lives in the SERVER env (never shipped to the
// client) and drops into deriveEntityKey() later with no consumer change — every entity npub rotates
// when it does, by design. See the approved plan / BUILD-BRIEF §3. nsec/priv is never logged or shipped.

import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import * as nip19 from "nostr-tools/nip19";
import { getPublicKey } from "nostr-tools/pure";

/**
 * ⚠️ DEMO ONLY — a public, throwaway master seed so entity npubs are stable while we build the write
 * path. NOT secret, NOT secure. The real master seed lives in the server env and replaces this later.
 */
export const DEMO_SEED = "600b-demo-master-seed-not-secret-replace-before-real-keys";

export interface EntityKey {
  /** 32-byte secp256k1 private key, hex. Server-side / demo only — never log, never ship to client. */
  privHex: string;
  /** x-only public key, hex. */
  pubHex: string;
  /** bech32 npub (public, shareable). */
  npub: string;
}

/** Stable entity ids — the things that get their own Nostr identity. */
export type EntityId = `palace:${string}` | `guild:${string}` | `system:${string}`;

/**
 * Deterministically derive an entity's Nostr key from a master seed + its stable id. Same (seed, id)
 * → same key, always (recoverable from the seed alone). Domain-separated HMAC-SHA256; a counter
 * rejection-samples the astronomically rare out-of-range scalar so the output is always a valid key.
 */
export function deriveEntityKey(seed: string, entityId: EntityId): EntityKey {
  const key = utf8ToBytes(seed);
  for (let counter = 0; counter < 256; counter += 1) {
    const priv = hmac(sha256, key, utf8ToBytes(`600b:entity:${entityId}:${counter}`));
    try {
      const pubHex = getPublicKey(priv); // throws if the 32 bytes aren't a valid secp256k1 scalar
      return { privHex: bytesToHex(priv), pubHex, npub: nip19.npubEncode(pubHex) };
    } catch {
      /* invalid scalar (vanishingly rare) — bump the counter and re-derive */
    }
  }
  throw new Error(`deriveEntityKey: exhausted derivation for ${entityId}`);
}

/** Just the public npub for an entity (no private material) — what clients use. */
export function entityNpub(seed: string, entityId: EntityId): string {
  return deriveEntityKey(seed, entityId).npub;
}

/** The demo entity roster — stable ids whose npubs the app references while building the write path. */
export const DEMO_ENTITIES = {
  hqPalace: "palace:hq",
  foundersGuild: "guild:founders",
  worldAgent: "system:world-agent",
} as const satisfies Record<string, EntityId>;
