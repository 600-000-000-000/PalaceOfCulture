// @600b/ownership — the home of "the app owns the truth".
//
// Ownership is a per-asset SIGNED HASH-CHAIN, not "latest relay wins". Nostr is transport +
// registry, NOT consensus. This package is imported by BOTH apps/web and apps/server so the
// chain is verified with the SAME code on both sides. NEVER fork this logic. (BUILD-BRIEF §3.)
//
// Shape is fixed by the brief; the crypto + conflict-resolution rules are deliberately stubbed
// until ADR-level sign-off on the signature scheme and tie-breaks.

/** A single ownership event in an asset's transfer chain. */
export interface OwnershipEvent {
  /** the object instance this chain is about (a signed Nostr event) */
  assetId: string;
  /** monotonic counter; the genesis event is revision 0 */
  revision: number;
  /** hash of the previous ownership event (null only for genesis) */
  prevHash: string | null;
  /** current owner (Nostr / seal pubkey) */
  ownerPubkey: string;
  /** transfer metadata (gifting in v1; trading is post-MVP) */
  payload: Record<string, unknown>;
  /** signature by the TRANSFERRING owner's key over the canonical event bytes */
  signature: string;
}

export interface VerifyResult {
  valid: boolean;
  /** the verified head (highest revision on a valid chain), if any */
  head?: OwnershipEvent;
  /** human-readable reason when invalid */
  reason?: string;
}

/**
 * Verify a full ownership chain locally (no relay trust). Checks genesis, revision monotonicity,
 * prevHash linkage, and per-event signatures, applying the conflict-resolution rules.
 *
 * STUB — not implemented. The conflict rules and signature scheme must be specified and identical
 * on client and server before this is filled (BUILD-BRIEF §7.1, the load-bearing risk).
 */
export function verifyChain(_events: readonly OwnershipEvent[]): VerifyResult {
  throw new Error("verifyChain: not implemented — see BUILD-BRIEF §7.1 before implementing");
}
