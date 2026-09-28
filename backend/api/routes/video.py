"""Live video channel: Pi POSTs frames, dashboard polls the latest frame."""
import logging
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from data.memory_store import get_store
from services import video_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["video"])


@router.post("/api/rover/{rover_id}/video/frame", summary="Pi uploads a live video frame (JPEG)")
def post_frame(rover_id: str, frame: UploadFile = File(...)):
    try:
        meta = video_service.save_frame(rover_id, frame)
    except ValueError as exc:
        logger.warning("Bad frame from %s: %s", rover_id, exc)
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover
        logger.exception("Frame save failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to store frame")
    return {"status": "success", "message": "Frame stored", **meta}


@router.get("/api/rover/{rover_id}/video/frame", summary="Latest video frame (image bytes, poll for live view)")
def get_frame(rover_id: str):
    entry = get_store().get_frame(rover_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"No video frames for rover {rover_id}")
    meta, data = entry
    return Response(content=data, media_type=meta.get("content_type", "image/jpeg"))


@router.get("/api/rover/{rover_id}/video/status", summary="Video stream status (no image bytes)")
def video_status(rover_id: str):
    entry = get_store().get_frame(rover_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"No video frames for rover {rover_id}")
    meta, _ = entry
    return {"rover_id": rover_id, "live": True, **meta}
