from __future__ import annotations

from datetime import datetime, timezone
from typing import AsyncIterator, List

from ..models import Provenance, TransferEvent
from .base import Provider


class MoralisProvider(Provider):
    """Moralis provider (skeleton)."""

    def __init__(self, api_key: str | None) -> None:
        self.api_key = api_key

    async def stream_transfers(self, chain: str) -> AsyncIterator[TransferEvent]:
        # No-op default; tests will mock.
        if False:  # pragma: no cover
            yield TransferEvent(
                ts=datetime.now(tz=timezone.utc),
                tx_hash="",
                from_addr="",
                to_addr="",
                chain=chain,
                token="",
                amount=0.0,
                usd_value=0.0,
                provenance=Provenance(provider="moralis", method="ws", request_id=""),
            )
        return
        yield  # type: ignore[misc]

    async def rest_backfill(self, chain: str, start: datetime, end: datetime) -> List[TransferEvent]:
        return []

