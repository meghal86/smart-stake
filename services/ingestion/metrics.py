from __future__ import annotations

import logging
import time
from typing import Dict

log = logging.getLogger("metrics")


class Metrics:
    """Simple metrics hooks logged as structured events."""
    def __init__(self) -> None:
        self._counters: Dict[str, int] = {}

    def inc(self, name: str, value: int = 1, **labels) -> None:
        self._counters[name] = self._counters.get(name, 0) + value
        log.info("metric_inc", extra={"extra": {"metric": name, "value": self._counters[name], **labels}})

    def observe(self, name: str, value: float, **labels) -> None:
        log.info("metric_observe", extra={"extra": {"metric": name, "value": value, **labels}})

    @staticmethod
    def now_ms() -> int:
        return int(time.time() * 1000)

