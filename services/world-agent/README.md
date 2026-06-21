# world-agent (Tier 3 · Python)

The autonomous **suggestion-only** culture & atmosphere engine. Reads Bitcoin signals (price,
hashrate, mempool, halving) and Nostr culture, and **proposes** world mood, ephemeral events,
decorations and NPC chatter. It **never writes truth** — the app consumes proposals, decides
deterministically, and logs (ADR 0001; concept §6, §17).

Isolated from the truth core: it only ever talks to the app over a queue/API, never a shared DB
write path. Mood stays abstracted — never readable as a buy/sell signal.

## Dev

```bash
uv sync                       # install (incl. dev: ruff, pytest)
uv run pytest                 # tests
uv run ruff check . && uv run ruff format .   # before every commit
```

Python ≥ 3.12, type hints on all signatures, `logging` not `print()`, 100-col.
