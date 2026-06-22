// Character & avatar schema — shared by the client (builder + store) and the future server
// truth-tier, so both speak the same vocabulary (per BUILD-BRIEF §3 / ADR 0001).
//
// Design rule (ADR 0003): the **AvatarConfig is the source of truth** — a small, portable,
// verifiable set of slot/trait choices. The rendered avatar is *derived*: today a procedural
// placeholder, later a composed/loaded **VRM** referenced by `avatarVrmRef`. "Art is static, state
// is data" — the config is the data; the VRM mesh is the static art it points at.

/** Body/face preset. Inclusive by design — never default-coded to one ethnicity (DESIGN-BRIEF §2). */
export type Gender = "feminine" | "masculine" | "neutral";

/** Age *read* of the avatar (this is an 18+ world — young-adult through older-adult, no children). */
export type AgeRead = "young" | "adult" | "elder";

/**
 * The swappable avatar slots. Each value is a trait id from the client trait catalog; the catalog
 * maps it to a VRM/GLB slot mesh once the Builder asset kit lands (null asset = procedural today).
 */
export interface AvatarConfig {
  gender: Gender;
  age: AgeRead;
  skinTone: string; // hex; full inclusive range
  aura: string; // hex accent — hoodie/glow, the signature Builder colour
  hair: string; // trait id
  outfit: string; // trait id (hoodie variants etc.)
  headwear: string; // trait id; "none" allowed
  /**
   * Optional **imported rigged model** (pipeline output: Meshy → rig → VRM/GLB, ADR 0003). A
   * same-origin/CDN url to a skinned glTF; when set it overrides the parametric preset entirely
   * (the avatar IS that mesh). "Art is static, state is data": the url is the data, the mesh the art.
   */
  modelUrl?: string;
}

/**
 * The player's identity + avatar record — the row the character database stores. `id` is a local
 * uuid now; it ties to the per-seal Nostr key (`pubkey`) later. `updatedBy` carries the ISO-19650
 * audit prefix convention from the global standard (`user:<handle>` / `auto:<source>`).
 */
export interface Character {
  id: string;
  handle: string;
  pubkey?: string; // the player's npub (demo key now; their own NIP-07/46 key later)
  /** How the player's key is held — a throwaway demo key now; NIP-07/NIP-46 in the secure phase. */
  keySource?: "demo" | "nip07" | "bunker";
  avatar: AvatarConfig;
  avatarVrmRef?: string; // Blossom sha256 / CDN url of the composed VRM (added when the kit lands)
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
}

/** The factory-default "Builder" look every new player starts from (DESIGN-BRIEF §2). */
export const DEFAULT_AVATAR: AvatarConfig = {
  gender: "neutral",
  age: "young",
  skinTone: "#c98f63",
  aura: "#e7b23c",
  hair: "#3a2a1a",
  outfit: "casual",
  headwear: "none",
};
