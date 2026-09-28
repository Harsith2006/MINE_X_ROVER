"""Tests for the 5 Pi -> laptop channels."""
from fastapi.testclient import TestClient

from data.memory_store import store
from main import app

client = TestClient(app)
RID = "RVR-01"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal fake png bytes
JPG = b"\xff\xd8\xff" + b"\x00" * 100  # minimal fake jpeg bytes


def setup_function(_):
    store.reset()


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "mine-rescue-backend"}


def test_gas_flow():
    r = client.post(f"/api/rover/{RID}/gas", json={"gas_type": "CH4", "value": 4.2, "unit": "ppm"})
    assert r.status_code == 200
    assert r.json()["status"] == "success"
    assert client.get(f"/api/rover/{RID}/gas/latest").json()["value"] == 4.2
    client.post(f"/api/rover/{RID}/gas", json={"gas_type": "CO", "value": 1.1})
    assert len(client.get(f"/api/rover/{RID}/gas/history?limit=10").json()["readings"]) == 2


def test_gas_invalid():
    r = client.post(f"/api/rover/{RID}/gas", json={"value": 4.2})  # missing gas_type
    assert r.status_code == 422


def test_temperature_flow():
    r = client.post(f"/api/rover/{RID}/temperature", json={"temperature": 28.6, "unit": "C"})
    assert r.status_code == 200
    assert client.get(f"/api/rover/{RID}/temperature/latest").json()["temperature"] == 28.6


def test_temperature_invalid():
    assert client.post(f"/api/rover/{RID}/temperature", json={}).status_code == 422


def test_prediction_flow():
    body = {"model_name": "RandomForest", "model_version": "v1",
            "prediction": "CH4_leak", "confidence": 0.91, "details": {"p": 0.91}}
    r = client.post(f"/api/rover/{RID}/prediction", json=body)
    assert r.status_code == 200
    latest = client.get(f"/api/rover/{RID}/prediction/latest").json()
    assert latest["prediction"] == "CH4_leak"
    assert client.get(f"/api/rover/{RID}/prediction/history").json()["predictions"][0]["confidence"] == 0.91


def test_prediction_bad_confidence():
    body = {"prediction": "x", "confidence": 5.0}  # > 1 rejected
    assert client.post(f"/api/rover/{RID}/prediction", json=body).status_code == 422


def test_image_flow():
    r = client.post(f"/api/rover/{RID}/image", files={"file": ("snap.png", PNG, "image/png")})
    assert r.status_code == 200
    assert r.json()["image_url"].startswith("/uploads/images/")
    assert client.get(f"/api/rover/{RID}/image/latest").status_code == 200
    assert len(client.get(f"/api/rover/{RID}/image/history").json()["images"]) == 1


def test_image_rejects_non_image():
    r = client.post(f"/api/rover/{RID}/image", files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 400


def test_video_flow():
    r = client.post(f"/api/rover/{RID}/video/frame", files={"frame": ("f.jpg", JPG, "image/jpeg")})
    assert r.status_code == 200
    assert r.json()["frame_count"] == 1
    got = client.get(f"/api/rover/{RID}/video/frame")
    assert got.status_code == 200
    assert got.content == JPG
    status = client.get(f"/api/rover/{RID}/video/status").json()
    assert status["live"] is True and status["frame_count"] == 1


def test_empty_rover_404s():
    assert client.get("/api/rover/NOPE/gas/latest").status_code == 404
    assert client.get("/api/rover/NOPE/temperature/latest").status_code == 404
    assert client.get("/api/rover/NOPE/prediction/latest").status_code == 404
    assert client.get("/api/rover/NOPE/image/latest").status_code == 404
    assert client.get("/api/rover/NOPE/video/frame").status_code == 404
