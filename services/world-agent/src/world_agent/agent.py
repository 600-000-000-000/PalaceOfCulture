"""The proposal generator. Suggestion-only; the application owns every world-changing decision."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Proposal:
    """A single non-binding suggestion for the world (atmosphere, event, or decoration).

    The app decides whether to apply it, deterministically and auditably. Proposals carry no
    authority and never a financial signal — mood stays abstracted (concept §6).
    """

    kind: str
    payload: dict[str, object] = field(default_factory=dict)
    reason: str = ""


def propose() -> list[Proposal]:
    """Generate world proposals from current signals.

    Stub: returns nothing until signal sources (BTC pulse, Nostr memes) are wired. Must never
    raise on the happy path, and must never write truth.
    """
    logger.debug("world-agent propose() called — no signal sources wired yet")
    return []
