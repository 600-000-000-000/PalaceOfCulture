# Architecture Decision Records

Each ADR captures one significant, hard-to-reverse decision: its context, the decision, and the
consequences. We never edit an accepted ADR to change its decision — we add a new one that
**supersedes** it, preserving the audit trail (ISO 19650 CDE: an ADR is the *Published* state of a
decision).

| # | Title | Status |
|---|---|---|
| [0001](0001-stack-and-runtime-topology.md) | Stack language & runtime topology ("wo rennt was") | Accepted |
| [0002](0002-chat-and-voice-transport.md) | Chat & voice transport ("plug-and-play first, Nostr-native later") | Accepted |
| [0003](0003-character-data-and-avatar-builder.md) | Character data model & our own VRM slot-builder | Accepted |

Naming: `NNNN-kebab-title.md`, four-digit zero-padded, incrementing.
