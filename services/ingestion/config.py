from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import timedelta
from typing import List


@dataclass(frozen=True)
class Config:
    """Runtime configuration via environment variables."""
    database_url: str
    chains: List[str]
    primary_provider: str
    alchemy_api_key: str | None
    moralis_api_key: str | None
    stream_lag_seconds: int
    backfill_window_hours: int
    retry_max_attempts: int
    retry_base_seconds: float
    retry_max_seconds: float
    rate_limit_per_sec: int

    @staticmethod
    def from_env() -> "Config":
        chains = [c.strip().lower() for c in os.getenv("CHAINS", "ethereum").split(",") if c.strip()]
        return Config(
            database_url=os.getenv("DATABASE_URL", ""),
            chains=chains,
            primary_provider=os.getenv("PRIMARY_PROVIDER", "alchemy").lower(),
            alchemy_api_key=os.getenv("ALCHEMY_API_KEY"),
            moralis_api_key=os.getenv("MORALIS_API_KEY"),
            stream_lag_seconds=int(os.getenv("STREAM_LAG_SECONDS", "15")),
            backfill_window_hours=int(os.getenv("BACKFILL_WINDOW_HOURS", "24")),
            retry_max_attempts=int(os.getenv("RETRY_MAX_ATTEMPTS", "8")),
            retry_base_seconds=float(os.getenv("RETRY_BASE_SECONDS", "0.5")),
            retry_max_seconds=float(os.getenv("RETRY_MAX_SECONDS", "15")),
            rate_limit_per_sec=int(os.getenv("RATE_LIMIT_PER_SEC", "10")),
        )

    def backfill_window(self) -> timedelta:
        return timedelta(hours=self.backfill_window_hours)

