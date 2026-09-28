"""Model prediction business logic (receive-only)."""
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from data.memory_store import get_store

logger = logging.getLogger(__name__)


def record_prediction(rover_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    record = {
        "rover_id": rover_id,
        "timestamp": payload.get("timestamp") or now.isoformat(),
        "received_at": now.isoformat(),
        "model_name": payload.get("model_name", "RandomForest"),
        "model_version": payload.get("model_version", "v1"),
        "prediction": payload["prediction"],
        "confidence": payload["confidence"],
        "details": payload.get("details", {}),
    }
    get_store().save_prediction(rover_id, record)
    logger.info("Prediction %s %s=%s (conf %.2f)", rover_id, record["model_name"], record["prediction"], record["confidence"])
    return record
