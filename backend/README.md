# Mine Rescue Rover Backend (Hackathon Prototype)

FastAPI backend receiving 5 channels from the Raspberry Pi 5, served to a React dashboard.
Storage is **in-memory** — no database. Routes depend on the `StorageService`
abstraction (`data/memory_store.py`), so Postgres can be added later without touching routes.

Architecture: `Route -> Service -> StorageService -> MemoryStorageService`

## Channels (Pi -> laptop)

| # | What | Pi sends | Dashboard reads |
|---|---|---|---|
| 1 | Gas JSON | `POST /api/rover/{id}/gas` | `GET .../gas/latest`, `GET .../gas/history?limit=50` |
| 2 | Temperature JSON | `POST /api/rover/{id}/temperature` | `GET .../temperature/latest`, `GET .../temperature/history?limit=50` |
| 3 | Model prediction JSON | `POST /api/rover/{id}/prediction` | `GET .../prediction/latest`, `GET .../prediction/history?limit=50` |
| 4 | PNG image | `POST /api/rover/{id}/image` (multipart `file`) | `GET .../image/latest` → `image_url`, served at `/uploads/images/...` |
| 5 | Live video | `POST /api/rover/{id}/video/frame` (multipart `frame`, JPEG) | `GET .../video/frame` (image bytes — poll it), `GET .../video/status` |

Live video = frame polling (no WebSockets): the Pi POSTs ~1 frame/sec, only the
latest frame per rover is kept in RAM, the dashboard polls `GET .../video/frame`
(e.g. `<img src=".../video/frame?t=Date.now()">` refreshed by JS) for a near-live view.

## Run (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest tests -v
uvicorn main:app --host 0.0.0.0 --port 8000
```

Docs: http://localhost:8000/docs · ReDoc: http://localhost:8000/redoc · Health: http://localhost:8000/health

## Pi setup

1. `ipconfig` on the laptop → take the Wi-Fi IPv4 (e.g. `192.168.1.42`). Same Wi-Fi as the Pi.
2. Put it in `examples/pi_send_all.py` (`LAPTOP_IP`). Never `localhost` from the Pi.
3. Test: `curl http://192.168.1.42:8000/health` from the Pi.
4. Run `python pi_send_all.py` on the Pi (sends gas+temp+prediction every 5 s, PNG every 30 s, video frame every 1 s).

curl examples (replace IP):

```bash
curl -X POST http://192.168.1.42:8000/api/rover/RVR-01/gas \
  -H "Content-Type: application/json" \
  -d '{"gas_type":"CH4","value":4.2,"unit":"ppm","risk_level":"WARNING"}'

curl -X POST http://192.168.1.42:8000/api/rover/RVR-01/temperature \
  -H "Content-Type: application/json" \
  -d '{"temperature":28.6,"unit":"C"}'

curl -X POST http://192.168.1.42:8000/api/rover/RVR-01/prediction \
  -H "Content-Type: application/json" \
  -d '{"model_name":"RandomForest","model_version":"v1","prediction":"CH4_leak","confidence":0.91}'

curl -F "file=@snapshot.png" http://192.168.1.42:8000/api/rover/RVR-01/image
curl -F "frame=@frame.jpg"  http://192.168.1.42:8000/api/rover/RVR-01/video/frame
```

## Firewall (port 8000 unreachable)

```powershell
# admin PowerShell: allow inbound TCP 8000
New-NetFirewallRule -DisplayName "FastAPI 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

Also: bind `0.0.0.0` (not `127.0.0.1`), same subnet (`ping <LAPTOP_IP>` from Pi), Private network profile.

## Project structure

```
backend/
├── main.py                 # app, CORS, /uploads static, router wiring
├── api/routes/             # gas, temperature, prediction, image, video
├── models/                 # gas, temperature, prediction (Pydantic)
├── services/               # gas, temperature, prediction, image, video
├── data/memory_store.py    # StorageService ABC + MemoryStorageService
├── uploads/images/         # PNG snapshots (served at /uploads/images/...)
├── examples/pi_send_all.py # Pi simulator for all 5 channels
└── tests/test_api.py
```
