"""600 Billion world-agent — suggestion-only.

Reads Bitcoin signals (price, hashrate, mempool, halving) and Nostr culture, and PROPOSES world
mood, events and decorations. It never writes truth: the application consumes proposals, decides
deterministically, and logs. See ADR 0001 and BUILD-BRIEF §6 / concept §6.
"""

from world_agent.agent import Proposal, propose

__version__ = "0.0.0"
__all__ = ["Proposal", "propose", "__version__"]
