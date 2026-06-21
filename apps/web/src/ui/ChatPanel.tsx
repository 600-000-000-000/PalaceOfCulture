import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../frontend/icons";
import { type ChatChannelId, type ChatMessage, createChatTransport } from "../net/chat";
import { type VoiceState, createVoiceTransport } from "../net/voice";

const CHANNELS: ReadonlyArray<{ id: ChatChannelId; label: string }> = [
  { id: "world", label: "World" },
  { id: "plaza", label: "Plaza" },
  { id: "whisper", label: "Whisper" },
];

const CHANNEL_LABEL: Record<ChatChannelId, string> = {
  world: "World",
  plaza: "Plaza",
  whisper: "Whisper",
};

// Quiet, WoW-style: the panel fades back when nobody's talking and you're not typing.
const IDLE_AFTER_MS = 9000;
const MAX_LINES = 200;

function formatTime(at: number): string {
  const date = new Date(at);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

type Unread = Record<ChatChannelId, boolean>;
const NO_UNREAD: Unread = { world: false, plaza: false, whisper: false };

/**
 * The in-world chat — WoW-familiar (tabbed channels, channel colours, slash commands, press-Enter
 * to talk) but quiet (it dims when idle so the world stays the hero). Mounts inside the 3D engine
 * shell. Talks only to `ChatTransport` / `VoiceTransport`, so the Nostr/voice swap never touches it.
 */
export function ChatPanel({ handle }: { handle: string }) {
  const transport = useMemo(() => createChatTransport(handle), [handle]);
  const voice = useMemo(() => createVoiceTransport(handle), [handle]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [active, setActive] = useState<ChatChannelId>("world");
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [idle, setIdle] = useState(false);
  const [unread, setUnread] = useState<Unread>(NO_UNREAD);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    status: "off",
    muted: false,
    speakers: [],
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeRef = useRef(active);
  activeRef.current = active;

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_AFTER_MS);
  }, []);

  useEffect(() => {
    const unsubscribe = transport.subscribe((message) => {
      setMessages((prev) =>
        prev.some((existing) => existing.id === message.id)
          ? prev
          : [...prev, message].slice(-MAX_LINES),
      );
      if (message.channel !== activeRef.current && !message.self) {
        setUnread((prev) => ({ ...prev, [message.channel]: true }));
      }
      wake();
    });
    return unsubscribe;
  }, [transport, wake]);

  useEffect(() => voice.subscribe(setVoiceState), [voice]);

  useEffect(
    () => () => {
      transport.dispose();
      voice.dispose();
    },
    [transport, voice],
  );

  useEffect(() => {
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [wake]);

  // Auto-scroll to the newest line. These deps are intentional triggers (new message, tab switch,
  // expand), not reads — the effect only touches the ref.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggers, not reads
  useEffect(() => {
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, active, collapsed]);

  // WoW behaviour: Enter focuses the chat input when nothing else has focus.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Enter" || collapsed) return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed]);

  const visible = useMemo(
    () => messages.filter((message) => message.channel === active),
    [messages, active],
  );

  const selectChannel = (id: ChatChannelId) => {
    setActive(id);
    setUnread((prev) => ({ ...prev, [id]: false }));
    wake();
    inputRef.current?.focus();
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    let channel = active;
    let body = text;
    // Minimal slash commands (WoW-familiar): /w, /world, /plaza, /me.
    if (text.startsWith("/")) {
      const [command, ...rest] = text.slice(1).split(" ");
      const argument = rest.join(" ");
      if (command === "w" || command === "whisper") {
        channel = "whisper";
        body = argument;
      } else if (command === "world" || command === "1") {
        channel = "world";
        body = argument;
      } else if (command === "plaza" || command === "2") {
        channel = "plaza";
        body = argument;
      } else if (command === "me") {
        transport.send(active, `${handle} ${argument}`.trim());
        setDraft("");
        return;
      }
      if (!body.trim()) {
        setActive(channel);
        setDraft("");
        return;
      }
    }
    transport.send(channel, body);
    setActive(channel);
    setDraft("");
  };

  // Keep movement keys (WASD / Space) from reaching the r3f KeyboardControls on window while typing.
  const onInputKey = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      inputRef.current?.blur();
    }
  };

  const toggleVoice = () => {
    if (voiceState.status === "off") voice.connect();
    else voice.disconnect();
  };

  const speakerLine =
    voiceState.status === "live" && voiceState.speakers.length > 0
      ? `${voiceState.speakers.join(", ")} speaking`
      : "central voice · room-scoped";

  const className = [
    "chat-panel",
    collapsed ? "chat-panel--collapsed" : "",
    idle && !collapsed ? "chat-panel--idle" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} onMouseEnter={wake}>
      <div className="chat-tabs">
        {CHANNELS.map((channel) => (
          <button
            className={`chat-tab chat-tab--${channel.id}${active === channel.id ? " chat-tab--active" : ""}`}
            key={channel.id}
            onClick={() => selectChannel(channel.id)}
            type="button"
          >
            {channel.label}
            {unread[channel.id] ? <i className="chat-unread" /> : null}
          </button>
        ))}
        <button
          aria-label={collapsed ? "Expand chat" : "Collapse chat"}
          className={`chat-collapse${collapsed ? " chat-collapse--up" : ""}`}
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>

      {collapsed ? null : (
        <>
          <div className="chat-log" ref={logRef}>
            {visible.length === 0 ? (
              <p className="chat-empty">the plaza is quiet. press enter and say something.</p>
            ) : (
              visible.map((message) => (
                <p
                  className={`chat-line chat-line--${message.channel}${message.system ? " chat-line--system" : ""}${message.self ? " chat-line--self" : ""}`}
                  key={message.id}
                >
                  <span className="chat-time">{formatTime(message.at)}</span>
                  {message.system ? (
                    <span className="chat-body">{message.body}</span>
                  ) : (
                    <>
                      <span className="chat-name">{message.author}:</span>{" "}
                      <span className="chat-body">{message.body}</span>
                    </>
                  )}
                </p>
              ))
            )}
          </div>

          <div className="chat-input-row">
            <span className={`chat-channel-tag chat-channel-tag--${active}`}>
              {CHANNEL_LABEL[active]}
            </span>
            <input
              className="chat-input"
              maxLength={240}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={wake}
              onKeyDown={onInputKey}
              onKeyUp={(event) => event.stopPropagation()}
              placeholder="press enter to chat…"
              ref={inputRef}
              value={draft}
            />
            <button aria-label="Send" className="chat-send" onClick={submit} type="button">
              <Icon name="reply" size={15} />
            </button>
          </div>

          <div className="chat-foot">
            <button
              className={`voice-button voice-button--${voiceState.status}`}
              onClick={toggleVoice}
              type="button"
            >
              <span className={`voice-dot voice-dot--${voiceState.status}`} />
              <Icon name="community" size={14} />
              {voiceState.status === "off"
                ? "Join voice"
                : voiceState.status === "connecting"
                  ? "Connecting…"
                  : "Voice live"}
            </button>
            {voiceState.status === "live" ? (
              <button
                className={`voice-mute${voiceState.muted ? " voice-mute--on" : ""}`}
                onClick={() => voice.setMuted(!voiceState.muted)}
                type="button"
              >
                {voiceState.muted ? "Unmute" : "Mute"}
              </button>
            ) : null}
            <span className="voice-speakers">{speakerLine}</span>
          </div>
        </>
      )}
    </section>
  );
}
