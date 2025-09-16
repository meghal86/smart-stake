from __future__ import annotations

import asyncio
import logging
import random
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import AsyncIterator, Optional, Tuple

from .config import Config
from .db import DB, InMemoryDB, PgDB
from .metrics import Metrics
from .models import BalanceUpdate, Provenance, TransferEvent
from .providers.alchemy import AlchemyProvider
from .providers.base import Provider
from .providers.moralis import MoralisProvider

log = logging.getLogger("ingest")


def _jitter_delay(base: float, attempt: int, max_seconds: float) -> float:
    exp = base * (2 ** attempt)
    return min(max_seconds, exp + random.uniform(0, base))


def _event_key(e: TransferEvent) -> str:
    return f"{e.chain}:{e.tx_hash}:{e.from_addr}:{e.to_addr}".lower()


class IngestionService:
    """Provider-agnostic ingestion with WS streaming and REST backfill."""

    def __init__(self, cfg: Config, db: Optional[DB] = None, metrics: Optional[Metrics] = None) -> None:
        self.cfg = cfg
        self.db: DB = db or (PgDB(cfg.database_url) if cfg.database_url else InMemoryDB())
        self.metrics = metrics or Metrics()
        self.providers: Tuple[Provider, Provider] = (
            AlchemyProvider(cfg.alchemy_api_key),
            MoralisProvider(cfg.moralis_api_key),
        )
        self._primary_idx = 0 if cfg.primary_provider == "alchemy" else 1
        self._seen_cache: set[str] = set()
        self._rate_tokens = cfg.rate_limit_per_sec
        self._last_refill = datetime.now(tz=timezone.utc)

    async def _rate_limit(self) -> None:
        now = datetime.now(tz=timezone.utc)
        elapsed = (now - self._last_refill).total_seconds()
        refill = int(elapsed * self.cfg.rate_limit_per_sec)
        if refill > 0:
            self._rate_tokens = min(self.cfg.rate_limit_per_sec, self._rate_tokens + refill)
            self._last_refill = now
        if self._rate_tokens == 0:
            await asyncio.sleep(1.0 / self.cfg.rate_limit_per_sec)
            await self._rate_limit()
        else:
            self._rate_tokens -= 1

    def _select_providers(self) -> Tuple[Provider, Provider]:
        primary = self.providers[self._primary_idx]
        fallback = self.providers[1 - self._primary_idx]
        return primary, fallback

    @asynccontextmanager
    async def _stream_with_failover(self, chain: str) -> AsyncIterator[AsyncIterator[TransferEvent]]:
        primary, fallback = self._select_providers()
        attempt = 0
        while True:
            try:
                log.info("stream_connect", extra={"extra": {"chain": chain, "provider": type(primary).__name__}})
                yield primary.stream_transfers(chain)
                return
            except Exception as e:  # pragma: no cover - network path
                delay = _jitter_delay(self.cfg.retry_base_seconds, attempt, self.cfg.retry_max_seconds)
                log.error("stream_error", extra={"extra": {"chain": chain, "provider": "primary", "error": str(e), "retry_in": delay}})
                await asyncio.sleep(delay)
                attempt += 1
                if attempt >= self.cfg.retry_max_attempts:
                    log.warning("stream_failover", extra={"extra": {"chain": chain}})
                    primary, fallback = fallback, primary
                    attempt = 0

    async def _handle_event(self, e: TransferEvent) -> None:
        key = _event_key(e)
        if key in self._seen_cache:
            return
        self._seen_cache.add(key)
        await self._rate_limit()
        inserted = await self.db.insert_transfer(e)
        if inserted:
            # naive balance updates for illustration – insert both legs with same amount
            bu_from = BalanceUpdate(
                ts=e.ts, address=e.from_addr, chain=e.chain, token=e.token, amount=-abs(e.amount),
                usd_value=-abs(e.usd_value), provenance=e.provenance, raw=e.raw
            )
            bu_to = BalanceUpdate(
                ts=e.ts, address=e.to_addr, chain=e.chain, token=e.token, amount=abs(e.amount),
                usd_value=abs(e.usd_value), provenance=e.provenance, raw=e.raw
            )
            await self.db.upsert_balance(bu_from)
            await self.db.upsert_balance(bu_to)
            self.metrics.inc("events_out", 1, chain=e.chain)
        self.metrics.inc("events_in", 1, chain=e.chain)
        lag = max(0, int((datetime.now(tz=timezone.utc) - e.ts).total_seconds() * 1000))
        self.metrics.observe("lag_ms", float(lag), chain=e.chain)

    async def _backfill(self, chain: str) -> None:
        now = datetime.now(tz=timezone.utc)
        last = await self.db.latest_transfer_ts(chain)
        horizon = now - timedelta(seconds=self.cfg.stream_lag_seconds)
        start = max(last or (now - self.cfg.backfill_window()), now - self.cfg.backfill_window())
        if start >= horizon:
            return
        primary, fallback = self._select_providers()
        for provider, name in ((primary, "primary"), (fallback, "fallback")):
            try:
                events = await provider.rest_backfill(chain, start, horizon)
                for e in events:
                    await self._handle_event(e)
                if events:
                    log.info("backfill_done", extra={"extra": {"chain": chain, "provider": name, "count": len(events)}})
                return
            except Exception as e:  # pragma: no cover - network path
                log.error("backfill_error", extra={"extra": {"chain": chain, "provider": name, "error": str(e)}})
                continue

    async def _run_chain(self, chain: str) -> None:
        await self._backfill(chain)
        async with self._stream_with_failover(chain) as stream:
            async for e in stream:
                await self._handle_event(e)

    async def run(self) -> None:
        tasks = [asyncio.create_task(self._run_chain(chain)) for chain in self.cfg.chains]
        await asyncio.gather(*tasks)

