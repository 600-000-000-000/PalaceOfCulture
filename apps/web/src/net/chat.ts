// Chat transport — the seam between the in-world chat UI and whatever carries the messages.
//
// Plug-and-play first (this file ships a local mock), then swap the implementation for Nostr
// without touching a line of UI:
//   - public channels (world/plaza) → NIP-29 relay-based groups (kind-9 chat); the relay is the
//     policy engine for admins/roles/bans. One group per channel; per-plaza groups later.
//   - whispers (DMs)               → NIP-17 private DMs over NIP-59 gift-wrap + NIP-44 encryption.
//   - identity                     → the player's per-seal Nostr key signs every send; `author`
//     becomes the npub's profile name (applesauce), exactly the innpub pattern.
// The UI only ever sees `ChatTransport`, so the migration is a one-file change here. See
// docs/adr/0002-chat-and-voice-transport.md.

export type ChatChannelId = "world" | "plaza" | "whisper";

export interface ChatMessage {
  id: string;
  channel: ChatChannelId;
  author: string; // display handle (later: derived from the sender's npub profile)
  body: string;
  at: number; // epoch ms
  self?: boolean; // sent by the local player (loopback now; our own published event later)
  system?: boolean; // join/notice/emote line, rendered muted
}

export interface ChatTransport {
  /** Send a message to a channel. Mock echoes locally; Nostr publishes a signed event. */
  send(channel: ChatChannelId, body: string): void;
  /** Subscribe to incoming messages (backlog is replayed first). Returns an unsubscribe fn. */
  subscribe(listener: (message: ChatMessage) => void): () => void;
  dispose(): void;
}

// Calm, on-brand ambient chatter so a fresh channel feels lived-in (the world is dignified, not spam).
const AMBIENT: ReadonlyArray<{ channel: ChatChannelId; author: string; body: string }> = [
  {
    channel: "plaza",
    author: "Wren",
    body: "the first hall went up by the garden — go look before dusk",
  },
  { channel: "world", author: "Tomas", body: "another day given. patience builds the palace." },
  { channel: "plaza", author: "Isa", body: "my sapling just hit its third ring 🌱" },
  { channel: "world", author: "Pelle", body: "welcome the new builders — and mind the raccoon" },
  {
    channel: "plaza",
    author: "Bríd",
    body: "string quartet tuning on the main stage at the top of the hour",
  },
];

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `m${Date.now().toString(36)}-${idCounter}`;
}

/** The plug-and-play transport: loopback for your own lines + gentle ambient townsfolk. */
export function createMockChatTransport(localHandle: string): ChatTransport {
  const listeners = new Set<(message: ChatMessage) => void>();
  const emit = (message: ChatMessage) => {
    for (const listener of listeners) listener(message);
  };

  const backlog: ChatMessage[] = [
    {
      id: nextId(),
      channel: "world",
      author: "Palace",
      body: "You enter the Palace of Culture.",
      at: Date.now() - 8000,
      system: true,
    },
    {
      id: nextId(),
      channel: "plaza",
      author: "Wren",
      body: "welcome home, builder",
      at: Date.now() - 5000,
    },
  ];

  let ambientTimer: ReturnType<typeof setInterval> | undefined;
  const startAmbient = () => {
    ambientTimer = setInterval(() => {
      const pick = AMBIENT[Math.floor(Math.random() * AMBIENT.length)];
      if (pick)
        emit({
          id: nextId(),
          channel: pick.channel,
          author: pick.author,
          body: pick.body,
          at: Date.now(),
        });
    }, 12000);
  };
  const stopAmbient = () => {
    if (ambientTimer) clearInterval(ambientTimer);
    ambientTimer = undefined;
  };

  return {
    send(channel, body) {
      emit({ id: nextId(), channel, author: localHandle, body, at: Date.now(), self: true });
      // Nostr: sign + publish a kind-9 (NIP-29) event for world/plaza, or a NIP-17 wrap for whispers.
    },
    subscribe(listener) {
      listeners.add(listener);
      for (const message of backlog) listener(message);
      if (!ambientTimer) startAmbient();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stopAmbient();
      };
    },
    dispose() {
      listeners.clear();
      stopAmbient();
    },
  };
}

/**
 * Factory the UI calls. Returns the plug-and-play mock today; swap to a NostrChatTransport
 * (NIP-29 groups + NIP-17 DMs, signed by the per-seal key) when the relay + signer land.
 */
export function createChatTransport(localHandle: string): ChatTransport {
  return createMockChatTransport(localHandle);
}
