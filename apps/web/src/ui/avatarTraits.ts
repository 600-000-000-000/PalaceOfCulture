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

// Hair colours — tint the loaded character's "Hair" material(s). Elder age overrides to grey.
export const HAIR_COLORS: readonly string[] = [
  "#1a1208",
  "#3a2a1a",
  "#6a4a2a",
  "#a9783c",
  "#caa15a",
  "#2b2b2b",
];

// Outfits map to cute Quaternius preset characters (per gender) — see scene/AvatarView.tsx.
export const OUTFITS: readonly Trait[] = [
  { id: "casual", label: "Casual", asset: null },
  { id: "worker", label: "Worker", asset: null },
  { id: "suit", label: "Suit", asset: null },
  { id: "explorer", label: "Explorer", asset: null },
];

export const HEADWEAR: readonly Trait[] = [
  { id: "none", label: "None", asset: null },
  { id: "cap", label: "Cap", asset: null },
  { id: "beanie", label: "Beanie", asset: null },
];
