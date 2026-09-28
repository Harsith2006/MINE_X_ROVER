"""Prediction channel: Pi POSTs on-board model output (receive-only)."""
from fastapi import APIRouter, HTTPException, Query
from data.memory_store import get_store
from models.prediction import PredictionIn
from services import prediction_service

router = APIRouter(tags=["prediction"])


@router.post("/api/rover/{rover_id}/prediction", summary="Pi sends model prediction (JSON)")
def post_prediction(rover_id: str, payload: PredictionIn):
    record = prediction_service.record_prediction(rover_id, payload.model_dump(mode="json"))
    return {"status": "success", "message": "Prediction stored", **record}


@router.get("/api/rover/{rover_id}/prediction/latest", summary="Latest model prediction")
def prediction_latest(rover_id: str):
    latest = get_store().get_prediction_latest(rover_id)
    if not latest:
        raise HTTPException(status_code=404, detail=f"No predictions for rover {rover_id}")
    return latest


@router.get("/api/rover/{rover_id}/prediction/history", summary="Prediction history")
def prediction_history(rover_id: str, limit: int = Query(default=50, ge=1, le=200)):
    return {"rover_id": rover_id, "predictions": get_store().get_prediction_history(rover_id, limit)}
