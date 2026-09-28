"""Image channel: Pi POSTs a PNG snapshot, served back via static files."""
import logging
from fastapi import APIRouter, File, HTTPException, UploadFile
from data.memory_store import get_store
from services import image_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["image"])


@router.post("/api/rover/{rover_id}/image", summary="Pi uploads a PNG image")
def post_image(rover_id: str, file: UploadFile = File(...)):
    try:
        meta = image_service.save_image(rover_id, file)
    except ValueError as exc:
        logger.warning("Bad image from %s: %s", rover_id, exc)
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover
        logger.exception("Image save failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to store image")
    return {"status": "success", "message": "Image stored", **meta}


@router.get("/api/rover/{rover_id}/image/latest", summary="Latest image info (use image_url to view)")
def image_latest(rover_id: str):
    images = get_store().get_images(rover_id, limit=1)
    if not images:
        raise HTTPException(status_code=404, detail=f"No images for rover {rover_id}")
    return images[-1]


@router.get("/api/rover/{rover_id}/image/history", summary="Previous image uploads")
def image_history(rover_id: str):
    return {"rover_id": rover_id, "images": get_store().get_images(rover_id, limit=50)}
