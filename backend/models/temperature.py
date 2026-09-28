"""Temperature schemas (Pi -> laptop JSON)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TemperatureIn(BaseModel):
    timestamp: Optional[datetime] = Field(default=None, description="Time of reading; server time used if omitted")
    temperature: float = Field(..., description="Temperature value")
    unit: str = Field(default="C")


class TemperatureOut(TemperatureIn):
    rover_id: str
    timestamp: datetime
    received_at: datetime
