from __future__ import annotations

import abc
from datetime import datetime
from typing import AsyncIterator, List

from ..models import TransferEvent


class Provider(abc.ABC):
    """Blockchain provider interface."""

    @abc.abstractmethod
    async def stream_transfers(self, chain: str) -> AsyncIterator[TransferEvent]:
        """Yield live TransferEvent items via WebSocket-like stream."""

    @abc.abstractmethod
    async def rest_backfill(self, chain: str, start: datetime, end: datetime) -> List[TransferEvent]:
        """Fetch historical TransferEvent items via REST in [start, end)."""

