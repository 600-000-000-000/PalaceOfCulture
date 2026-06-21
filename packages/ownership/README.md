# @600b/ownership

Per-asset **signed hash-chain** ownership — the core primitive of "the app owns the truth".
Imported by **both** `@600b/web` and `@600b/server`, so a client verifies the chain itself instead
of trusting whichever relay answered last. **Never fork this logic** — divergence here is exactly
the "latest relay wins" failure the project forbids (BUILD-BRIEF §7.1).

- `OwnershipEvent` — `assetId / revision / prevHash / ownerPubkey / payload / signature`.
- `verifyChain()` — local, offline-verifiable; genesis + monotonic revision + prevHash linkage +
  per-event signatures + conflict-resolution rules. **Stubbed** pending sign-off on the signature
  scheme and tie-breaks.
- Export format: signed JSONL / event-chain, verifiable offline.

Tests run on Node's built-in test runner (`pnpm --filter @600b/ownership test`).
