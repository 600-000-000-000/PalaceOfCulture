// The canonical tier → timelock-asset map: what a locked sat grows into, fixed by HOW LONG it's locked.
//
// Two MILESTONE tiers have iconic, hand-authored forms shared by everyone — 21 months = the Tree
// ("let it grow"), 21 years = the 21-year Spaceship ("time builds legend"). The three in-between tiers
// are SPECIAL assets — near-term these are also TEAM-AUTHORED and handed to holders as content (we build
// them; users receive them); their themes are deliberately left open for now. User-created content
// (Roblox-style) is the longer-term goal layered on later. "Art is static, state is data": whichever way,
// the chosen asset is data on the seal, signed into the ownership chain. Shown here as sealed placeholders.

export type TimelockTier = "21D" | "210D" | "21M" | "210M" | "21Y";
export type TimelockAssetKind = "tree" | "spaceship" | "special";

export interface TierAsset {
  tier: TimelockTier;
  kind: TimelockAssetKind;
  /** Short in-world name. */
  label: string;
  /** One-line meaning (shown on the legendwall / hover). */
  blurb: string;
  /** A fixed canonical form (tree/spaceship), or a player-defined UGC slot. */
  fixed: boolean;
}

/** Ordered shortest → longest lock — matches `timelockTiers` in frontend/data. */
export const TIER_ORDER: TimelockTier[] = ["21D", "210D", "21M", "210M", "21Y"];

export const TIER_ASSETS: Record<TimelockTier, TierAsset> = {
  "21D": {
    tier: "21D",
    kind: "special",
    label: "21-day token",
    blurb: "21 days — a special asset (coming)",
    fixed: false,
  },
  "210D": {
    tier: "210D",
    kind: "special",
    label: "210-day relic",
    blurb: "210 days — a special asset (coming)",
    fixed: false,
  },
  "21M": {
    tier: "21M",
    kind: "tree",
    label: "Tree",
    blurb: "21 months — the Tree. Let it grow.",
    fixed: true,
  },
  "210M": {
    tier: "210M",
    kind: "special",
    label: "210-month craft",
    blurb: "210 months — a special asset (coming)",
    fixed: false,
  },
  "21Y": {
    tier: "21Y",
    kind: "spaceship",
    label: "Spaceship",
    blurb: "21 years — the 21-year Spaceship. Time builds legend.",
    fixed: true,
  },
};
