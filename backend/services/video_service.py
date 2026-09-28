"""Live video via frame polling (hackathon-simple, no WebSockets).

The Pi POSTs JPEG frames ~1-2x/sec. Only the latest frame per rover is kept
in RAM. The dashboard polls GET .../video/frame (or uses it as an <img> src
with a cache-busting query param) to show near-live video.
"""
import logging
from datetime import datetime, timezone
from typing import Dict

from fastapi import UploadFile

from data.memory_store import get_store

logger = logging.getLogger(__name__)

MAX_FRAME_BYTES = 5 * 1024 * 1024  # 5 MB


def save_frame(rover_id: str, frame: UploadFile) -> Dict[str, str | int]:
    if not (frame.content_type or "").startswith("image/"):
        raise ValueError(f"Expected an image frame, got content-type: {frame.content_type}")
    data = frame.file.read()
    if not data:
        raise ValueError("Empty video frame")
    if len(data) > MAX_FRAME_BYTES:
        raise ValueError(f"Frame too large: {len(data)} bytes (max {MAX_FRAME_BYTES})")
    meta = {
        "rover_id": rover_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "content_type": frame.content_type or "image/jpeg",
        "size_bytes": len(data),
    }
    saved = get_store().save_frame(rover_id, data, meta)
    logger.info("Video frame %s #%d (%d bytes)", rover_id, saved["frame_count"], len(data))
    return saved
