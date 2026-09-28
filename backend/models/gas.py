"""Gas reading schemas (Pi -> laptop JSON)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class GasReadingIn(BaseModel):
    timestamp: Optional[datetime] = Field(default=None, description="Time of reading; server time used if omitted")
    gas_type: str = Field(..., examples=["CH4"], description="CH4 | CO | H2S | ...")
    value: float = Field(..., description="Measured concentration")
    unit: str = Field(default="ppm")
    risk_level: Optional[str] = Field(default=None, description="SAFE | WARNING | DANGER")


class GasReadingOut(GasReadingIn):
    rover_id: str
    timestamp: datetime
    received_at: datetime
