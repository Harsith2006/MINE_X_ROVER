"""Gas channel: Pi POSTs nearby-gas JSON, dashboard GETs latest/history."""
from fastapi import APIRouter, HTTPException, Query
from data.memory_store import get_store
from models.gas import GasReadingIn
from services import gas_service

router = APIRouter(tags=["gas"])


@router.post("/api/rover/{rover_id}/gas", summary="Pi sends gas found near the rover (JSON)")
def post_gas(rover_id: str, payload: GasReadingIn):
    record = gas_service.record_gas(rover_id, payload.model_dump(mode="json"))
    return {"status": "success", "message": "Gas reading stored", **record}


@router.get("/api/rover/{rover_id}/gas/latest", summary="Latest gas reading")
def gas_latest(rover_id: str):
    latest = get_store().get_gas_latest(rover_id)
    if not latest:
        raise HTTPException(status_code=404, detail=f"No gas data for rover {rover_id}")
    return latest


@router.get("/api/rover/{rover_id}/gas/history", summary="Gas reading history")
def gas_history(rover_id: str, limit: int = Query(default=50, ge=1, le=200)):
    return {"rover_id": rover_id, "readings": get_store().get_gas_history(rover_id, limit)}
