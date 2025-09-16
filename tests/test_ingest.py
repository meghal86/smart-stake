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


class MockProvider(Provider):
    def __init__(self, events: List[TransferEvent]) -> None:
        self._events = events

    async def stream_transfers(self, chain: str) -> AsyncIterator[TransferEvent]:
        # Emit a finite stream then keep alive
        for e in self._events:
            yield e
        while True:
            await asyncio.sleep(0.1)

    async def rest_backfill(self, chain: str, start, end) -> List[TransferEvent]:
        # Return all events in window (duplicates included intentionally)
        return [e for e in self._events if start <= e.ts < end]


@pytest.mark.asyncio
async def test_stream_and_backfill_idempotent():
    now = datetime.now(tz=timezone.utc)
    # Duplicate tx_hash/from/to to test idempotency
    ev1 = TransferEvent(
        ts=now - timedelta(minutes=10),
        tx_hash="0xabc",
        from_addr="0xfrom",
        to_addr="0xto",
        chain="ethereum",
        token="ETH",
        amount=1.0,
        usd_value=2500.0,
        provenance=Provenance(provider="mock", method="ws", request_id="1"),
        raw={"n": 1},
    )
    ev2 = TransferEvent(
        ts=now - timedelta(minutes=5),
        tx_hash="0xabc",
        from_addr="0xfrom",
        to_addr="0xto",
        chain="ethereum",
        token="ETH",
        amount=1.0,
        usd_value=2500.0,
        provenance=Provenance(provider="mock", method="rest", request_id="2"),
        raw={"n": 2},
    )
    events = [ev1, ev2]

    cfg = Config(
        database_url="",
        chains=["ethereum"],
        primary_provider="alchemy",
        alchemy_api_key=None,
        moralis_api_key=None,
        stream_lag_seconds=5,
        backfill_window_hours=24,
        retry_max_attempts=3,
        retry_base_seconds=0.01,
        retry_max_seconds=0.05,
        rate_limit_per_sec=100,
    )

    db: DB = InMemoryDB()
    svc = IngestionService(cfg, db=db)

    # Inject mock providers
    mock = MockProvider(events)
    svc.providers = (mock, mock)  # primary and fallback same

    # Run for a short time
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

    # Only 1 unique transfer should be stored
    assert len(db.transfers) == 1, "duplicates must be ignored"
    # Balances updated for both sides
    assert len(db.balances) == 2

