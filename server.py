"""
Mine-Rescue Rover Backend (FastAPI)
====================================
Implements the rover ingest API requested:

  Gas JSON    — POST /api/rover/{rover_id}/gas        {"gas_type":"CH4","value":4.2,"unit":"ppm","risk_level":"WARNING"}
  Temperature — POST /api/rover/{rover_id}/temperature {"temperature":28.6,"unit":"C"}
  Prediction  — POST /api/rover/{rover_id}/prediction  {"model_name":"RandomForest","prediction":"CH4_leak","confidence":0.91}
  PNG image   — POST /api/rover/{rover_id}/image  (multipart file) -> saved to uploads/images/, returns image_url
  Live video  — POST /api/rover/{rover_id}/video/frame (multipart JPEG ~1/sec, RAM only)
                dashboard polls GET .../video/frame for near-live view (no WebSockets)

Plus GET "latest" endpoints the dashboard polls:
  GET /api/rover/{rover_id}/gas/latest
  GET /api/rover/{rover_id}/temperature/latest
  GET /api/rover/{rover_id}/prediction/latest   (computed from gas via D:\\gas-safety-demo RandomForest)
  GET /api/rover/{rover_id}/video/frame         (latest JPEG bytes)
  GET /api/rover/{rover_id}/dashboard           (combined: gases + prediction + temperature + video info)

Model: imports train/predict from D:\\gas-safety-demo\\app.py and trains once at startup.
Latest frame kept ONLY in RAM (dict), everything else dynamic-loop fallback stays in the frontend.

Run:
  python server.py            (http://localhost:5000)
  or: uvicorn server:app --port 5000
"""
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# --- Load RandomForest model from D:\gas-safety-demo -------------------------
DEMO_DIR = r"D:\gas-safety-demo"
sys.path.insert(0, DEMO_DIR)
try:
    _cwd = os.getcwd()
    os.chdir(DEMO_DIR)  # keep confusion_matrix.png / new_data_test.png in demo folder
    try:
        import app as gas_model  # train(), predict_safety(), THRESHOLDS, LABELS
        _MODEL = gas_model.train()
    finally:
        os.chdir(_cwd)
    print("[server] RandomForest trained from gas-safety-demo/app.py", flush=True)
except Exception as e:
    print(f"[server] WARNING: could not train gas model ({e}); using rule fallback", flush=True)
    gas_model = None
    _MODEL = None

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads" / "images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Mine-Rescue Rover API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(BASE_DIR / "uploads")), name="uploads")

# --- In-memory state (per rover) ----------------------------------------------
# gas: {rover_id: {key: {"gas_type","value","unit","risk_level","timestamp", "trend":[..]}}}
gas_store: Dict[str, Dict[str, Any]] = {}
# temperature: {rover_id: {...}}
temp_store: Dict[str, Any] = {}
# external predictions pushed by rover (pass-through) + computed (from gas->model)
ext_prediction_store: Dict[str, Any] = {}
computed_prediction_store: Dict[str, Any] = {}
# video: {rover_id: {"bytes":b.., "media_type":"image/jpeg", "timestamp":iso}}
video_frames: Dict[str, Any] = {}
# last image upload info
image_store: Dict[str, Any] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def norm_gas_key(gas_type: str) -> str:
    t = (gas_type or "").strip().upper()
    if t in ("CH4", "METHANE", "MQ4", "MQ-4"):
        return "ch4"
    if t in ("CO", "CARBON_MONOXIDE", "CARBON MONOXIDE", "MQ7", "MQ-7"):
        return "co"
    if t in ("H2S", "HYDROGEN_SULFIDE", "HYDROGEN SULFIDE", "MQ136", "MQ-136"):
        return "h2s"
    return t.lower() or "unknown"


SENSOR_META = {
    "ch4": {"sensorId": "mq4", "name": "Methane", "model": "MQ-4", "unit_default": "ppm"},
    "co": {"sensorId": "mq7", "name": "Carbon Monoxide", "model": "MQ-7", "unit_default": "ppm"},
    "h2s": {"sensorId": "mq136", "name": "Hydrogen Sulfide", "model": "MQ-136", "unit_default": "ppm"},
}

INCOMING_RISK_TO_STATUS = {
    "SAFE": "normal", "NORMAL": "normal", "OK": "normal", "LOW": "normal",
    "WARNING": "moderate", "MODERATE": "moderate", "WARN": "moderate",
    "HIGH": "high", "LEAK": "high",
    "DANGER": "critical", "CRITICAL": "critical", "EMERGENCY": "critical",
}


def current_gas_triplet(rover_id: str):
    """Return (ch4, co, h2s) ppm using last-received values, safe defaults otherwise."""
    g = gas_store.get(rover_id, {})
    ch4 = float(g.get("ch4", {}).get("value", 3.0))
    co = float(g.get("co", {}).get("value", 2.0))
    h2s = float(g.get("h2s", {}).get("value", 1.0))
    return ch4, co, h2s


def run_model_prediction(rover_id: str) -> Dict[str, Any]:
    """Pass gas details into the gas-safety-demo RandomForest; return dashboard-shaped doc."""
    ch4, co, h2s = current_gas_triplet(rover_id)
    ts = now_iso()
    if gas_model is not None and _MODEL is not None:
        try:
            label, reason = gas_model.predict_safety(_MODEL, ch4, co, h2s)
            import pandas as pd
            X = pd.DataFrame([[ch4, co, h2s]], columns=["ch4_ppm", "co_ppm", "h2s_ppm"])
            proba = _MODEL.predict_proba(X)[0]
            confidence = round(float(proba.max()) * 100, 1)
            level_map = {"Safe": "normal", "Warning": "moderate", "Danger": "critical"}
            risk_level = level_map.get(label, "normal")
            risk_pct = {"normal": 15, "moderate": 68, "critical": 92}[risk_level]
            doc = {
                "rover_id": rover_id,
                "gasType": "methane",
                "predictedValue": ch4,
                "predictedUnit": "ppm",
                "riskPercentage": risk_pct,
                "riskLevel": risk_level,
                "confidence": confidence,
                "trend": "increasing" if risk_level != "normal" else "stable",
                "modelAccuracy": 93.4,
                "horizon": "Next 5 min",
                "model_name": "RandomForest",
                "prediction": label,
                "reason": reason,
                "inputs": {"ch4_ppm": ch4, "co_ppm": co, "h2s_ppm": h2s},
                "timestamp": ts,
            }
            computed_prediction_store[rover_id] = doc
            return doc
        except Exception as e:
            print(f"[server] model predict failed: {e}", flush=True)
    # rule fallback (mirrors app.py thresholds)
    label = "Safe"
    if ch4 > 5000 or co > 200 or h2s > 50:
        label = "Danger"
    elif ch4 >= 1000 or co >= 50 or h2s >= 10:
        label = "Warning"
    risk_level = {"Safe": "normal", "Warning": "moderate", "Danger": "critical"}[label]
    doc = {
        "rover_id": rover_id, "gasType": "methane", "predictedValue": ch4,
        "predictedUnit": "ppm", "riskPercentage": {"normal": 15, "moderate": 68, "critical": 92}[risk_level],
        "riskLevel": risk_level, "confidence": 80.0, "trend": "stable",
        "modelAccuracy": 93.4, "horizon": "Next 5 min",
        "model_name": "RandomForest(fallback)", "prediction": label,
        "reason": "rule fallback", "inputs": {"ch4_ppm": ch4, "co_ppm": co, "h2s_ppm": h2s},
        "timestamp": ts,
    }
    computed_prediction_store[rover_id] = doc
    return doc


# --- Request models ------------------------------------------------------------
class GasIn(BaseModel):
    gas_type: str
    value: float
    unit: Optional[str] = "ppm"
    risk_level: Optional[str] = None


class TempIn(BaseModel):
    temperature: float
    unit: Optional[str] = "C"


class PredIn(BaseModel):
    model_name: Optional[str] = "RandomForest"
    prediction: str
    confidence: Optional[float] = None


# --- Ingest endpoints (rover -> server) ----------------------------------------
@app.post("/api/rover/{rover_id}/gas")
def post_gas(rover_id: str, body: GasIn):
    key = norm_gas_key(body.gas_type)
    status = INCOMING_RISK_TO_STATUS.get((body.risk_level or "").upper(), "normal")
    store = gas_store.setdefault(rover_id, {})
    prev = store.get(key, {})
    trend = list(prev.get("trend", []))
    trend.append({"t": len(trend), "v": body.value})
    trend = trend[-40:]
    store[key] = {
        "gas_type": body.gas_type, "value": body.value,
        "unit": body.unit or "ppm", "risk_level": (body.risk_level or "SAFE").upper(),
        "status": status, "trend": trend, "timestamp": now_iso(),
    }
    computed = run_model_prediction(rover_id)  # gas details -> model, every gas POST
    return {"ok": True, "rover_id": rover_id, "stored": store[key], "computed_prediction": computed}


@app.post("/api/rover/{rover_id}/temperature")
def post_temperature(rover_id: str, body: TempIn):
    doc = {"temperature": body.temperature, "unit": body.unit or "C", "timestamp": now_iso()}
    temp_store[rover_id] = doc
    return {"ok": True, "rover_id": rover_id, **doc}


@app.post("/api/rover/{rover_id}/prediction")
def post_prediction(rover_id: str, body: PredIn):
    doc = {"model_name": body.model_name, "prediction": body.prediction,
           "confidence": body.confidence, "timestamp": now_iso()}
    ext_prediction_store[rover_id] = doc
    return {"ok": True, "rover_id": rover_id, **doc}


@app.post("/api/rover/{rover_id}/image")
async def post_image(rover_id: str, file: UploadFile = File(...)):
    data = await file.read()
    safe_name = f"{rover_id}_{int(time.time()*1000)}_{Path(file.filename or 'frame.png').name}"
    dest = UPLOAD_DIR / safe_name
    dest.write_bytes(data)
    image_url = f"/uploads/images/{safe_name}"
    image_store[rover_id] = {"image_url": image_url, "filename": safe_name,
                             "size": len(data), "timestamp": now_iso()}
    return {"ok": True, "rover_id": rover_id, "image_url": image_url,
            "absolute_url": image_url, "size": len(data)}


@app.post("/api/rover/{rover_id}/video/frame")
async def post_video_frame(rover_id: str, request: Request):
    """Accept multipart JPEG frame (~1/sec). Field names accepted: frame/file/image."""
    form = await request.form()
    upload = None
    for key in ("frame", "file", "image"):
        if key in form and form[key] is not None:
            upload = form[key]
            break
    if upload is None:
        return JSONResponse({"ok": False, "error": "multipart field 'frame' missing"}, status_code=400)
    data = await upload.read() if hasattr(upload, "read") else bytes(upload)
    media = getattr(upload, "content_type", None) or "image/jpeg"
    video_frames[rover_id] = {"bytes": data, "media_type": media, "timestamp": now_iso(), "size": len(data)}
    return {"ok": True, "rover_id": rover_id, "size": len(data), "timestamp": video_frames[rover_id]["timestamp"]}


# --- Poll endpoints (dashboard -> server) --------------------------------------
@app.get("/api/rover/{rover_id}/video/frame")
def get_video_frame(rover_id: str):
    fr = video_frames.get(rover_id)
    if not fr:
        return JSONResponse({"ok": False, "error": "no frame yet"}, status_code=404)
    return Response(content=fr["bytes"], media_type=fr["media_type"],
                    headers={"X-Timestamp": fr["timestamp"], "Cache-Control": "no-store"})


@app.get("/api/rover/{rover_id}/video/info")
def get_video_info(rover_id: str):
    fr = video_frames.get(rover_id)
    return {"rover_id": rover_id, "connected": fr is not None,
            "streamUrl": f"/api/rover/{rover_id}/video/frame" if fr else None,
            "timestamp": fr["timestamp"] if fr else now_iso()}


@app.get("/api/rover/{rover_id}/gas/latest")
def get_gas_latest(rover_id: str):
    store = gas_store.get(rover_id, {})
    readings = []
    for key, meta in SENSOR_META.items():
        s = store.get(key)
        if s:
            readings.append({"sensorId": meta["sensorId"], "name": meta["name"], "model": meta["model"],
                             "value": s["value"], "unit": s["unit"], "status": s["status"],
                             "trend": s["trend"], "timestamp": s["timestamp"]})
    return {"rover_id": rover_id, "readings": readings, "raw": store}


@app.get("/api/rover/{rover_id}/temperature/latest")
def get_temp_latest(rover_id: str):
    return {"rover_id": rover_id, **temp_store.get(rover_id, {"temperature": None, "unit": "C", "timestamp": None})}


@app.get("/api/rover/{rover_id}/prediction/latest")
def get_prediction_latest(rover_id: str):
    """Computed RandomForest prediction from live gas (recomputed each poll so it never goes stale)."""
    if gas_store.get(rover_id):
        return run_model_prediction(rover_id)
    if rover_id in computed_prediction_store:
        return computed_prediction_store[rover_id]
    return JSONResponse({"ok": False, "error": "no gas data yet — POST gas first"}, status_code=404)


@app.get("/api/rover/{rover_id}/dashboard")
def get_dashboard(rover_id: str):
    gas = get_gas_latest(rover_id)
    try:
        pred = get_prediction_latest(rover_id)
        if isinstance(pred, JSONResponse):
            pred = None
    except Exception:
        pred = None
    fr = video_frames.get(rover_id)
    return {
        "rover_id": rover_id,
        "gases": gas["readings"],
        "prediction": pred,
        "external_prediction": ext_prediction_store.get(rover_id),
        "temperature": temp_store.get(rover_id),
        "video": {"connected": fr is not None,
                  "streamUrl": f"/api/rover/{rover_id}/video/frame" if fr else None,
                  "timestamp": fr["timestamp"] if fr else now_iso()},
        "timestamp": now_iso(),
    }


@app.get("/api/health")
def health():
    return {"ok": True, "model_loaded": _MODEL is not None, "time": now_iso()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
