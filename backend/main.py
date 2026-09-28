"""Mine-rescue rover backend (hackathon prototype, in-memory store)."""
import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# NOTE: route modules were removed per user request.
# New endpoints will be wired here with app.include_router(...).
from api.routes import gas, image, prediction, temperature, video

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("mine-rescue-backend")

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_ROOT = BASE_DIR / "uploads"
(UPLOAD_ROOT / "maps").mkdir(parents=True, exist_ok=True)

# CORS origins: comma-separated env CORS_ORIGINS or defaults for React dev.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Backend starting. CORS origins: %s", _origins)
    yield
    logger.info("Backend stopping.")


app = FastAPI(title="Mine Rescue Rover Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")

app.include_router(gas.router)
app.include_router(temperature.router)
app.include_router(prediction.router)
app.include_router(image.router)
app.include_router(video.router)


@app.get("/health", summary="Health check", tags=["health"])
def health_check():
    return {"status": "ok", "service": "mine-rescue-backend"}
