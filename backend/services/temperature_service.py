"""Temperature business logic."""
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from data.memory_store import get_store

logger = logging.getLogger(__name__)

TEMP_WARN_C = 50.0  # warn if temperature exceeds this (Celsius)


def record_temperature(rover_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    record = {
        "rover_id": rover_id,
        "timestamp": payload.get("timestamp") or now.isoformat(),
        "received_at": now.isoformat(),
        "temperature": payload["temperature"],
        "unit": payload.get("unit", "C"),
    }
    get_store().save_temperature(rover_id, record)
    logger.info("Temp %s %s%s", rover_id, record["temperature"], record["unit"])
    if record["unit"] == "C" and float(record["temperature"]) >= TEMP_WARN_C:
        logger.warning("High temp on %s: %sC", rover_id, record["temperature"])
    return record
