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

// --- Real SFU backends (ADR 0005) ------------------------------------------------------------------
// Two self-hostable SFUs sit behind this same interface: LiveKit (Apache-2.0, default) and HiveTalk
// (AGPL-3.0, the Nostr-native test backend — used only as a separate self-hosted SERVICE, never linked
// into this MIT client). Pick one with VITE_VOICE_BACKEND; each needs its server URL. Both need a
// running SFU (deferred infra, infra/hosting.md), so until a URL is configured they fall back to the
// mock so the dock keeps working — the real connect code drops into the marked TODO with no UI change.

export type VoiceBackend = "mock" | "livekit" | "hivetalk";

const VOICE_BACKEND = (import.meta.env.VITE_VOICE_BACKEND as VoiceBackend | undefined) ?? "mock";

/**
 * LiveKit SFU backend (Apache-2.0). Needs a LiveKit server + a token endpoint (deferred infra). When
 * `VITE_LIVEKIT_URL` is set, install `livekit-client` and do `room.connect(url, token)` + publish the
 * mic track at the TODO; until then it falls back to the mock room so the voice dock still works.
 */
export function createLiveKitVoiceTransport(localHandle: string): VoiceTransport {
  const url = import.meta.env.VITE_LIVEKIT_URL as string | undefined;
  if (!url) {
    console.info(
      "[voice] livekit selected but VITE_LIVEKIT_URL is unset — falling back to mock room",
    );
    return createMockVoiceTransport(localHandle);
  }
  // TODO(infra): real LiveKit join — new Room(); await room.connect(url, token); publish mic track.
  return createMockVoiceTransport(localHandle);
}

/**
 * HiveTalk SFU backend (AGPL-3.0, self-hosted service — ADR 0005). Needs a HiveTalk instance URL. When
 * `VITE_HIVETALK_URL` is set, join the plaza's room there (first cut = room-join/deeplink) at the TODO;
 * until then it falls back to the mock room. We connect to it over the network only — never bundle it.
 */
export function createHiveTalkVoiceTransport(localHandle: string): VoiceTransport {
  const url = import.meta.env.VITE_HIVETALK_URL as string | undefined;
  if (!url) {
    console.info(
      "[voice] hivetalk selected but VITE_HIVETALK_URL is unset — falling back to mock room",
    );
    return createMockVoiceTransport(localHandle);
  }
  // TODO(infra): join the HiveTalk room for the current plaza (room URL / API), npub-authenticated.
  return createMockVoiceTransport(localHandle);
}

/**
 * Factory the UI calls. Selects the backend via VITE_VOICE_BACKEND (mock | livekit | hivetalk, ADR
 * 0005); the dock never changes which one it gets. Default = the plug-and-play mock. MoQ is the
 * stage-2 target behind this same interface (ADR 0002).
 */
export function createVoiceTransport(localHandle: string): VoiceTransport {
  switch (VOICE_BACKEND) {
    case "livekit":
      return createLiveKitVoiceTransport(localHandle);
    case "hivetalk":
      return createHiveTalkVoiceTransport(localHandle);
    default:
      return createMockVoiceTransport(localHandle);
  }
}
