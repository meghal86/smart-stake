from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import AsyncIterator, List

import pytest

from services.ingestion.config import Config
from services.ingestion.db import DB, InMemoryDB
from services.ingestion.ingest_service import IngestionService
from services.ingestion.models import Provenance, TransferEvent
from services.ingestion.providers.base import Provider


class SilentStream(Provider):
    async def stream_transfers(self, chain: str) -> AsyncIterator[TransferEvent]:
        while True:
            await asyncio.sleep(0.1)

    def __init__(self, events: List[TransferEvent]) -> None:
        self._events = events

    async def rest_backfill(self, chain: str, start, end) -> List[TransferEvent]:
        return [e for e in self._events if start <= e.ts < end]


@pytest.mark.asyncio
async def test_backfill_fills_gaps():
    now = datetime.now(tz=timezone.utc)
    # Three events over a 30 min window
    evs = [
        TransferEvent(
            ts=now - timedelta(minutes=30),
            tx_hash="0x01",
            from_addr="A", to_addr="B", chain="ethereum", token="ETH", amount=1, usd_value=1,
            provenance=Provenance(provider="mock", method="rest", request_id="r1")
        ),
        TransferEvent(
            ts=now - timedelta(minutes=20),
            tx_hash="0x02",
            from_addr="B", to_addr="C", chain="ethereum", token="ETH", amount=1, usd_value=1,
            provenance=Provenance(provider="mock", method="rest", request_id="r2")
        ),
        TransferEvent(
            ts=now - timedelta(minutes=10),
            tx_hash="0x03",
            from_addr="C", to_addr="D", chain="ethereum", token="ETH", amount=1, usd_value=1,
            provenance=Provenance(provider="mock", method="rest", request_id="r3")
        ),
    ]
    cfg = Config(
        database_url="",
        chains=["ethereum"],
        primary_provider="alchemy",
        alchemy_api_key=None,
        moralis_api_key=None,
        stream_lag_seconds=1,
        backfill_window_hours=1,
        retry_max_attempts=2,
        retry_base_seconds=0.01,
        retry_max_seconds=0.05,
        rate_limit_per_sec=100,
    )
    db: DB = InMemoryDB()
    svc = IngestionService(cfg, db=db)
    silent = SilentStream(evs)
    svc.providers = (silent, silent)

    # Kick a short run to execute backfill then idle stream
    async def run_for(duration: float):
        task = asyncio.create_task(svc.run())
        await asyncio.sleep(duration)
        for t in asyncio.all_tasks():
            if t is not asyncio.current_task():
                t.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    await run_for(0.5)

    # All three events should be backfilled
    assert len(db.transfers) == 3
    # Latest ts recorded
    latest = await db.latest_transfer_ts("ethereum")
    assert latest is not None
    assert abs((latest - (now - timedelta(minutes=10))).total_seconds()) < 5

