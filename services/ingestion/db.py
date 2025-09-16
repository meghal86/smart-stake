from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Protocol

from .models import BalanceUpdate, TransferEvent

log = logging.getLogger("db")


class DB(Protocol):
    """Database interface for ingestion persistence."""
    async def latest_transfer_ts(self, chain: str) -> Optional[datetime]: ...
    async def upsert_entity(self, address: str, chain: str, label: Optional[str], entity_type: Optional[str], is_cex: bool, meta: Dict[str, Any]) -> None: ...
    async def insert_transfer(self, e: TransferEvent) -> bool: ...
    async def upsert_balance(self, b: BalanceUpdate) -> None: ...


class InMemoryDB(DB):
    """In-memory DB for tests and local mock runs."""
    def __init__(self) -> None:
        self.transfers: Dict[str, TransferEvent] = {}
        self.balances: Dict[str, BalanceUpdate] = {}
        self.entities: Dict[str, Dict[str, Any]] = {}
        self._latest_ts: Dict[str, datetime] = {}

    @staticmethod
    def _tkey(e: TransferEvent) -> str:
        h = hashlib.sha256()
        h.update(e.chain.encode())
        h.update(b"|")
        h.update(e.tx_hash.encode())
        h.update(b"|")
        h.update(e.from_addr.encode())
        h.update(b"|")
        h.update(e.to_addr.encode())
        return h.hexdigest()

    @staticmethod
    def _bkey(b: BalanceUpdate) -> str:
        return f"{b.chain}:{b.address}:{b.token}".lower()

    async def latest_transfer_ts(self, chain: str) -> Optional[datetime]:
        return self._latest_ts.get(chain)

    async def upsert_entity(self, address: str, chain: str, label: Optional[str], entity_type: Optional[str], is_cex: bool, meta: Dict[str, Any]) -> None:
        self.entities[f"{chain}:{address}".lower()] = {
            "address": address,
            "chain": chain,
            "label": label,
            "entity_type": entity_type,
            "is_cex": is_cex,
            "meta": meta,
        }

    async def insert_transfer(self, e: TransferEvent) -> bool:
        key = self._tkey(e)
        if key in self.transfers:
            return False
        self.transfers[key] = e
        prev = self._latest_ts.get(e.chain)
        if prev is None or e.ts > prev:
            self._latest_ts[e.chain] = e.ts
        return True

    async def upsert_balance(self, b: BalanceUpdate) -> None:
        self.balances[self._bkey(b)] = b


class PgDB(DB):  # pragma: no cover - exercised in integration, not unit tests
    """Postgres DB implementation using asyncpg with idempotent writes."""
    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
        self._pool: Any = None

    async def _ensure_pool(self) -> None:
        if self._pool is None:
            try:
                import asyncpg  # type: ignore
            except Exception as e:
                raise RuntimeError("asyncpg is required for PgDB") from e
            self._pool = await asyncpg.create_pool(self._dsn, min_size=1, max_size=5)

    async def latest_transfer_ts(self, chain: str) -> Optional[datetime]:
        await self._ensure_pool()
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "select max(ts) as ts from public.whale_transfers where chain = $1", chain
            )
            return row["ts"] if row and row["ts"] else None

    async def upsert_entity(self, address: str, chain: str, label: Optional[str], entity_type: Optional[str], is_cex: bool, meta: Dict[str, Any]) -> None:
        await self._ensure_pool()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                insert into public.whale_entities (address, chain, label, entity_type, is_cex, meta)
                values ($1,$2,$3,$4,$5,$6::jsonb)
                on conflict (chain, address) do update
                set label = excluded.label,
                    entity_type = excluded.entity_type,
                    is_cex = excluded.is_cex,
                    meta = excluded.meta,
                    updated_at = now()
                """,
                address, chain, label, entity_type, is_cex, json.dumps(meta),
            )

    async def insert_transfer(self, e: TransferEvent) -> bool:
        await self._ensure_pool()
        # Idempotency: rely on unique combination if exists; otherwise check existence by tx_hash+from+to+chain
        async with self._pool.acquire() as conn:
            exists = await conn.fetchval(
                """
                select 1 from public.whale_transfers
                where tx_hash = $1 and from_addr = $2 and to_addr = $3 and chain = $4
                limit 1
                """,
                e.tx_hash, e.from_addr, e.to_addr, e.chain,
            )
            if exists:
                return False
            await conn.execute(
                """
                insert into public.whale_transfers
                  (ts, tx_hash, from_addr, to_addr, chain, token, amount, usd_value, direction, venue_hint, is_cex, meta)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
                """,
                e.ts, e.tx_hash, e.from_addr, e.to_addr, e.chain, e.token, e.amount, e.usd_value,
                e.direction, e.venue_hint, e.is_cex,
                json.dumps({
                    "provider": e.provenance.provider if e.provenance else None,
                    "method": e.provenance.method if e.provenance else None,
                    "request_id": e.provenance.request_id if e.provenance else None,
                    "raw": e.raw or {},
                }),
            )
            return True

    async def upsert_balance(self, b: BalanceUpdate) -> None:
        await self._ensure_pool()
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                insert into public.whale_balances (ts, address, chain, token, amount, usd_value, meta)
                values ($1,$2,$3,$4,$5,$6,$7::jsonb)
                """,
                b.ts, b.address, b.chain, b.token, b.amount, b.usd_value,
                json.dumps({
                    "provider": b.provenance.provider if b.provenance else None,
                    "method": b.provenance.method if b.provenance else None,
                    "request_id": b.provenance.request_id if b.provenance else None,
                    "raw": b.raw or {},
                })
            )

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None

