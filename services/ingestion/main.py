from __future__ import annotations

import asyncio
import logging
import os

from .config import Config
from .ingest_service import IngestionService
from .logging import setup_logging


async def _main() -> None:
    setup_logging()
    cfg = Config.from_env()
    log = logging.getLogger("main")
    # Basic env validation
    missing = []
    if not cfg.database_url:
        missing.append("DATABASE_URL")
    if missing:
        log.warning("missing_env", extra={"extra": {"missing": ",".join(missing)}})
    svc = IngestionService(cfg)
    await svc.run()


if __name__ == "__main__":
    # Allow graceful Ctrl+C
    try:
        asyncio.run(_main())
    except KeyboardInterrupt:
        pass

