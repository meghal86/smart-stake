from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import AsyncIterator, List

from ..models import Provenance, TransferEvent
from .base import Provider


class AlchemyProvider(Provider):
    """Alchemy provider (skeleton).

    Real implementation would use websockets and REST. This placeholder
    demonstrates the interface; tests will mock this class.
    """

    def __init__(self, api_key: str | None) -> None:
        self.api_key = api_key

    async def stream_transfers(self, chain: str) -> AsyncIterator[TransferEvent]:
        # Placeholder generator to be replaced with actual WS client.
        # Emits a heartbeat event every few seconds when ALCHEMY_MOCK_STREAM is set.
        if os.getenv("ALCHEMY_MOCK_STREAM", "0") == "1":
            i = 0
            while True:
                i += 1
                yield TransferEvent(
                    ts=datetime.now(tz=timezone.utc),
                    tx_hash=f"0xmock{i:064d}",
                    from_addr="0xfrom",
                    to_addr="0xto",
                    chain=chain,
                    token="ETH",
                    amount=1.0,
                    usd_value=2500.0,
                    direction="wallet_transfer",
                    is_cex=False,
                    provenance=Provenance(provider="alchemy", method="ws", request_id=str(i)),
                    raw={"mock": True, "seq": i},
                )
                await asyncio.sleep(2.0)
        else:
            # No-op stream when not mocked
            while True:
                await asyncio.sleep(5.0)

    async def rest_backfill(self, chain: str, start: datetime, end: datetime) -> List[TransferEvent]:
        # Placeholder; real code would call Alchemy Transfers API.
        return []

