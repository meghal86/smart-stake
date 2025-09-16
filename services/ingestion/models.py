from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class Provenance:
    """Source metadata for observability and idempotency tracing."""
    provider: str
    method: str
    request_id: str


@dataclass(frozen=True)
class TransferEvent:
    """Normalized transfer event."""
    ts: datetime
    tx_hash: str
    from_addr: str
    to_addr: str
    chain: str
    token: str
    amount: float
    usd_value: float
    direction: Optional[str] = None
    venue_hint: Optional[str] = None
    is_cex: bool = False
    provenance: Provenance | None = None
    raw: Dict[str, Any] | None = None


@dataclass(frozen=True)
class BalanceUpdate:
    """Normalized balance update for an address/token."""
    ts: datetime
    address: str
    chain: str
    token: str
    amount: float
    usd_value: float
    provenance: Provenance | None = None
    raw: Dict[str, Any] | None = None

