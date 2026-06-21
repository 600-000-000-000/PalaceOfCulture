// Tier 2 — the truth tier entrypoint. "Boring on purpose": one app, one worker, one DB.
//
// Intended wiring (see BUILD-BRIEF.md §6, not implemented yet):
//   db/         — SQLite (→ Postgres), append-only event log, typed event writer
//   eventlog/   — append-only audit log; every world-changing decision reproducible
//   statemachine/ — asset / lock / ownership / palace state transitions
//   api/        — Fastify REST (read models, claim helpers — never custodial)
//   rooms/      — Colyseus authoritative movement + presence; Yjs shared state
//   worker/     — reconcile jobs (chain / LN / relay) + raw webhook ingestion
//   adapters/   — Boltz / LNbits / Nostr, swappable behind one interface
//
// Ownership is authored + verified via @600b/ownership — the SAME code the client runs.

function main(): void {
  // eslint-disable-next-line no-console
  console.log("[600b] server skeleton — no services wired yet (see BUILD-BRIEF §6)");
}

main();
