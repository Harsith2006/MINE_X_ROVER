"""Pi sender: pushes all 5 channels to the laptop backend.

Run on the Raspberry Pi:
    python pi_send_all.py

Set LAPTOP_IP below to the laptop's LAN address
(Windows `ipconfig` -> IPv4 Address). Never localhost from the Pi.
"""
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ===== CONFIG =====
LAPTOP_IP = "192.168.1.42"  # <-- CHANGE THIS
PORT = 8000
ROVER_ID = "RVR-01"
SNAPSHOT_PNG = "/home/pi/snapshot.png"  # file sent to /image
CAMERA_FRAME_JPG = "/home/pi/frame.jpg"  # file sent to /video/frame (refresh before each send)
# ==================

BASE = f"http://{LAPTOP_IP}:{PORT}/api/rover/{ROVER_ID}"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slow_loop():
    """Gas + temperature + prediction every 5 s."""
    i = 0
    while True:
        try:
            print("gas:", requests.post(f"{BASE}/gas", json={
                "timestamp": now(), "gas_type": "CH4",
                "value": 4.0 + (i % 5) * 0.3, "unit": "ppm",
                "risk_level": "WARNING" if i % 5 > 2 else "SAFE"}, timeout=5).status_code)
            print("temp:", requests.post(f"{BASE}/temperature", json={
                "timestamp": now(), "temperature": 28.5, "unit": "C"}, timeout=5).status_code)
            print("pred:", requests.post(f"{BASE}/prediction", json={
                "timestamp": now(), "model_name": "RandomForest", "model_version": "v1",
                "prediction": "CH4_leak", "confidence": 0.91,
                "details": {}}, timeout=5).status_code)
        except Exception as exc:
            print("slow loop FAILED:", exc)
        i += 1
        time.sleep(5)


def image_loop():
    """PNG snapshot every 30 s."""
    while True:
        try:
            with open(SNAPSHOT_PNG, "rb") as f:
                r = requests.post(f"{BASE}/image",
                                  files={"file": ("snapshot.png", f, "image/png")}, timeout=15)
            print("image:", r.status_code, r.json().get("image_url"))
        except Exception as exc:
            print("image FAILED:", exc)
        time.sleep(30)


def video_loop():
    """Live frame ~1x/sec. Point CAMERA_FRAME_JPG at your camera capture output."""
    while True:
        try:
            with open(CAMERA_FRAME_JPG, "rb") as f:
                requests.post(f"{BASE}/video/frame",
                              files={"frame": ("frame.jpg", f, "image/jpeg")}, timeout=5)
        except Exception as exc:
            print("frame FAILED:", exc)
        time.sleep(1)


for target in (slow_loop, image_loop, video_loop):
    threading.Thread(target=target, daemon=True).start()
print(f"Sending to {BASE} (Ctrl+C to stop)")
while True:
    time.sleep(3600)
