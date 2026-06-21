import type { AgeRead, Gender } from "@600b/shared";

// The avatar trait catalog — the data the slot-builder is driven by. Each trait carries an `asset`
// slot for the VRM/GLB mesh that the AvatarComposer will load once the Builder asset kit lands
// (DESIGN-BRIEF first deliverable). `asset: null` = procedural placeholder today. Adding the real
// art is a one-file change here; the builder UI and the AvatarConfig never change.

/** A selectable trait that maps to a swappable avatar slot. */
export interface Trait {
  id: string;
  label: string;
  asset: string | null; // VRM/GLB slot mesh url; null = procedural placeholder
}

export const GENDERS: ReadonlyArray<{ id: Gender; label: string }> = [
  { id: "feminine", label: "Feminine" },
  { id: "masculine", label: "Masculine" },
  { id: "neutral", label: "Neutral" },
];

export const AGES: ReadonlyArray<{ id: AgeRead; label: string }> = [
  { id: "young", label: "Young" },
  { id: "adult", label: "Adult" },
  { id: "elder", label: "Elder" },
];

// Inclusive skin range — nothing default-coded to one ethnicity (DESIGN-BRIEF §2).
export const SKIN_TONES: readonly string[] = [
  "#f3d2b3",
  "#e7b48c",
  "#c98f63",
  "#a56a44",
  "#7c4a2d",
  "#52301c",
];

// The signature aura palette (DESIGN-BRIEF): gold, orange, coral, green, teal.
export const AURAS: readonly string[] = ["#e7b23c", "#f7931a", "#e8704f", "#2bd07a", "#1f6b62"];

export const HAIR: readonly Trait[] = [
  { id: "short", label: "Short", asset: null },
  { id: "long", label: "Long", asset: null },
  { id: "buzz", label: "Buzz", asset: null },
  { id: "bun", label: "Bun", asset: null },
];

export const OUTFITS: readonly Trait[] = [
  { id: "hoodie", label: "Hoodie", asset: null },
  { id: "jacket", label: "Jacket", asset: null },
  { id: "apron", label: "Maker apron", asset: null },
];

export const HEADWEAR: readonly Trait[] = [
  { id: "none", label: "None", asset: null },
  { id: "cap", label: "Cap", asset: null },
  { id: "beanie", label: "Beanie", asset: null },
];
