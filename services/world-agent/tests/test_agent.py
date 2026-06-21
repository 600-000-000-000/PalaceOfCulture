"""Skeleton tests — prove the suggestion-only contract holds even before signals are wired."""

from world_agent import Proposal, propose


def test_propose_returns_list() -> None:
    """propose() returns a list (empty in the skeleton) and never raises."""
    assert propose() == []


def test_proposal_is_frozen() -> None:
    """A Proposal is immutable and defaults to an empty payload."""
    proposal = Proposal(kind="season")
    assert proposal.kind == "season"
    assert proposal.payload == {}
