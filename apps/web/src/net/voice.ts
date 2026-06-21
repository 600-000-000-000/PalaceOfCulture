// Voice transport — central (non-positional) voice for the in-world chat dock.
//
// Decision (ADR 0002): characters don't collide and voice is room-scoped, so there is NO
// spatial-audio math — by design the simplest possible voice. Plug-and-play first (this file is a
// mock with no audio), then migrate the implementation behind this same interface:
//   1) LiveKit (Apache-2.0) — self-hosted SFU room; "everyone in the palace hears everyone". The
//      boring, ships-today pick: room.connect(url, token) + publish the mic track.
//   2) MoQ (Media over QUIC, @kixelated/moq) — room-scoped `audio.pcm` + `speaking.json` tracks
//      keyed by npub, the same transport that will carry presence (the innpub pattern).
// The UI only ever sees `VoiceTransport`.

export type VoiceStatus = "off" | "connecting" | "live";

export interface VoiceState {
  status: VoiceStatus;
  muted: boolean;
  speakers: string[]; // handles currently transmitting (later: npubs → applesauce profiles)
}

export interface VoiceTransport {
  connect(): void;
  disconnect(): void;
  setMuted(muted: boolean): void;
  subscribe(listener: (state: VoiceState) => void): () => void;
  dispose(): void;
}

/** The plug-and-play transport: simulated room state only, no real audio or permission prompts. */
export function createMockVoiceTransport(localHandle: string): VoiceTransport {
  let state: VoiceState = { status: "off", muted: false, speakers: [] };
  const listeners = new Set<(state: VoiceState) => void>();
  const emit = () => {
    for (const listener of listeners) listener(state);
  };
  const patch = (next: Partial<VoiceState>) => {
    state = { ...state, ...next };
    emit();
  };

  let connectTimer: ReturnType<typeof setTimeout> | undefined;
  let chatterTimer: ReturnType<typeof setInterval> | undefined;
  const clearTimers = () => {
    if (connectTimer) clearTimeout(connectTimer);
    if (chatterTimer) clearInterval(chatterTimer);
    connectTimer = undefined;
    chatterTimer = undefined;
  };

  return {
    connect() {
      if (state.status !== "off") return;
      patch({ status: "connecting" });
      connectTimer = setTimeout(() => {
        patch({ status: "live", speakers: state.muted ? [] : [localHandle] });
        // LiveKit: await room.connect(url, token); publish mic track here.
        // MoQ: subscribe(`${ns}/audio.pcm`) and publish our own AudioWorklet PCM track here.
        chatterTimer = setInterval(() => {
          const neighbour = Math.random() < 0.4 ? ["Wren"] : [];
          const own = state.muted ? [] : [localHandle];
          patch({ speakers: [...own, ...neighbour] });
        }, 3000);
      }, 700);
    },
    disconnect() {
      clearTimers();
      patch({ status: "off", speakers: [] });
    },
    setMuted(muted) {
      patch({
        muted,
        speakers: muted ? state.speakers.filter((s) => s !== localHandle) : state.speakers,
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      clearTimers();
      listeners.clear();
    },
  };
}

/**
 * Factory the UI calls. Returns the plug-and-play mock today; swap to a LiveKit (then MoQ)
 * transport behind this interface — the dock never changes.
 */
export function createVoiceTransport(localHandle: string): VoiceTransport {
  return createMockVoiceTransport(localHandle);
}
