"""Model prediction schemas (Pi -> laptop JSON, receive-only, no inference here)."""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class PredictionIn(BaseModel):
    timestamp: Optional[datetime] = Field(default=None, description="Time of prediction; server time used if omitted")
    model_name: str = Field(default="RandomForest")
    model_version: str = Field(default="v1")
    prediction: str = Field(..., examples=["CH4_leak"], description="Predicted class / label")
    confidence: float = Field(..., ge=0, le=1)
    details: Dict[str, Any] = Field(default_factory=dict, description="Extra model outputs (probabilities, bbox, ...)")


class PredictionOut(PredictionIn):
    rover_id: str
    timestamp: datetime
    received_at: datetime
