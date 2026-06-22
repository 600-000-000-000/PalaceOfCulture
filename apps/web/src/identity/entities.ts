// Entity identities — the Nostr keys for places/groups/NPCs (palaces, guilds, system), so a palace can
// post announcements + (later) author its NIP-53 live events + receive zaps under its own npub.
//
// ⚠️ DEMO: entity keys are derived from packages/identity's PUBLIC DEMO_SEED *client-side* so palace
// npubs are stable and a palace can sign its own notes today. In the secure phase the master seed lives
// on the SERVER (never shipped to the client); entity signing moves server-side and the client only
// resolves the public npubs (via an endpoint). Same deriveEntityKey() — see the approved plan / hosting.md.
// The player's principal + identity stay non-custodial; these are app-operated SERVICE identities.

import { DEMO_ENTITIES, DEMO_SEED, type EntityId, deriveEntityKey } from "@600b/identity";
import { NDKEvent, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { connect, getNdk } from "../net/nostr";

const signers = new Map<string, NDKPrivateKeySigner>();

/** The demo signer for an entity. ⚠️ derives the private key client-side (demo); server-side later. */
export function entitySigner(entityId: EntityId): NDKPrivateKeySigner {
  const existing = signers.get(entityId);
  if (existing) return existing;
  const { privHex } = deriveEntityKey(DEMO_SEED, entityId);
  const signer = new NDKPrivateKeySigner(privHex);
  signers.set(entityId, signer);
  return signer;
}

/** The public npub for an entity (no private material) — what the UI shows. */
export function entityNpubFor(entityId: EntityId): string {
  return deriveEntityKey(DEMO_SEED, entityId).npub;
}

/** Stable demo npubs for the known entities (HQ palace, founders guild, world-agent). */
export const ENTITY_NPUBS = {
  hqPalace: entityNpubFor(DEMO_ENTITIES.hqPalace),
  foundersGuild: entityNpubFor(DEMO_ENTITIES.foundersGuild),
  worldAgent: entityNpubFor(DEMO_ENTITIES.worldAgent),
};

/** Publish a kind:1 note authored BY an entity (signed with its OWN key, not the player's). */
export async function postAsEntity(entityId: EntityId, body: string): Promise<string | null> {
  const text = body.trim();
  if (!text) return null;
  try {
    await connect();
    const event = new NDKEvent(getNdk());
    event.kind = 1;
    event.content = text;
    await event.sign(entitySigner(entityId)); // sign with the entity key — overrides the player signer
    await event.publish();
    return event.id;
  } catch {
    return null;
  }
}
