"""Gas business logic: fill timestamps, store, log danger."""
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from data.memory_store import get_store

logger = logging.getLogger(__name__)


def record_gas(rover_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    record = {
        "rover_id": rover_id,
        "timestamp": payload.get("timestamp") or now.isoformat(),
        "received_at": now.isoformat(),
        "gas_type": payload["gas_type"],
        "value": payload["value"],
        "unit": payload.get("unit", "ppm"),
        "risk_level": payload.get("risk_level"),
    }
    get_store().save_gas(rover_id, record)
    logger.info("Gas %s %s=%s%s", rover_id, record["gas_type"], record["value"], record["unit"])
    if str(record.get("risk_level") or "").upper() == "DANGER":
        logger.warning("Gas DANGER near %s: %s %s", rover_id, record["gas_type"], record["value"])
    return record
