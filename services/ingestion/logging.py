from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    """Structured JSON formatter."""
    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "ts": datetime.utcnow().isoformat(timespec="milliseconds") + "Z",
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if hasattr(record, "extra"):
            extra = getattr(record, "extra")
            if isinstance(extra, dict):
                payload.update(extra)
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def setup_logging() -> None:
    """Configure root logger with JSON output."""
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

