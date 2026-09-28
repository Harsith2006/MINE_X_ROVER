"""PNG image handling: validate, save to uploads/images/, store metadata."""
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from fastapi import UploadFile

from data.memory_store import get_store

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads" / "images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_image(rover_id: str, file: UploadFile) -> Dict[str, str | int | float]:
    if not (file.content_type or "").startswith("image/"):
        raise ValueError(f"Expected an image file, got content-type: {file.content_type}")
    data = file.file.read()
    if not data:
        raise ValueError("Empty image file")
    ext = Path(file.filename or "image.png").suffix.lower() or ".png"
    name = f"{rover_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}{ext}"
    dest = UPLOAD_DIR / name
    dest.write_bytes(data)
    meta = {
        "rover_id": rover_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "filename": name,
        "image_path": str(dest),
        "image_url": f"/uploads/images/{name}",
        "content_type": file.content_type,
        "size_bytes": len(data),
    }
    get_store().save_image(rover_id, meta)
    logger.info("Image %s %s (%d bytes)", rover_id, name, len(data))
    return meta
