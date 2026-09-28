"""Temperature channel: Pi POSTs temperature JSON."""
from fastapi import APIRouter, HTTPException, Query
from data.memory_store import get_store
from models.temperature import TemperatureIn
from services import temperature_service

router = APIRouter(tags=["temperature"])


@router.post("/api/rover/{rover_id}/temperature", summary="Pi sends temperature (JSON)")
def post_temperature(rover_id: str, payload: TemperatureIn):
    record = temperature_service.record_temperature(rover_id, payload.model_dump(mode="json"))
    return {"status": "success", "message": "Temperature stored", **record}


@router.get("/api/rover/{rover_id}/temperature/latest", summary="Latest temperature")
def temperature_latest(rover_id: str):
    latest = get_store().get_temperature_latest(rover_id)
    if not latest:
        raise HTTPException(status_code=404, detail=f"No temperature data for rover {rover_id}")
    return latest


@router.get("/api/rover/{rover_id}/temperature/history", summary="Temperature history")
def temperature_history(rover_id: str, limit: int = Query(default=50, ge=1, le=200)):
    return {"rover_id": rover_id, "readings": get_store().get_temperature_history(rover_id, limit)}
