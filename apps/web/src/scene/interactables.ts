// Interactables — things in the world you can activate with the Interact button (E): NPCs, objects,
// doors. v1 is proximity-based: when you walk within an interactable's radius, a prompt appears; E (or
// the on-screen button) fires its action. Positions are world coords near the Home/HQ spawn + plot.
// Real door animations / NPC dialog trees come later — v1 shows the response so the loop is testable.

export type InteractKind = "door" | "npc" | "object";

export interface Interactable {
  id: string;
  /** World position [x, y, z]; proximity is measured on the XZ plane. */
  position: [number, number, number];
  /** Activation radius in metres. */
  radius: number;
  kind: InteractKind;
  /** Prompt verb shown on the button, e.g. "Open the gate". */
  label: string;
  /** Response shown when activated (placeholder until doors animate / NPCs get dialog trees). */
  message: string;
}

// Spawn is ~[6,4,44]; the growing tree sits at [-7,0,40], the asset shelf at z≈52.
export const INTERACTABLES: Interactable[] = [
  {
    id: "tree",
    position: [-7, 0, 40],
    radius: 4.5,
    kind: "object",
    label: "Tend your Tree",
    message: "You tend the Tree. Its rings thicken with the time you lock — come back as it grows.",
  },
  {
    id: "racoo",
    position: [2, 0, 36],
    radius: 4,
    kind: "npc",
    label: "Talk to racooDNI",
    message: 'racooDNI: "gm, builder. money buys style — time builds legend."',
  },
  {
    id: "gate",
    position: [0, 0, 50],
    radius: 5,
    kind: "door",
    label: "Open the palace gate",
    message: "The gate creaks open. (Real door animation lands with the rigged palace doors.)",
  },
];
