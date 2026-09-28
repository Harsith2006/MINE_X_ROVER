# MINE-X ROVER — Mine Rescue Dashboard & Telemetry Backend

An autonomous underground mine-rescue rover monitoring system featuring real-time environmental hazard detection, AI gas leak risk classification (Random Forest), live sensor telemetry, navigation mapping, and video feed streaming.

---

## 🏗️ Repository Architecture

This repository is organized as a production-ready monorepo:

```text
MINE_X_ROVER/
├── frontend/                  # React (Vite) + Tailwind CSS + Lucide Icons + Recharts
│   ├── src/
│   │   ├── components/        # Gas cards, Mine map, Telemetry, Video, AI Predictions
│   │   ├── services/api.js    # Live API client with automatic offline simulation fallback
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json            # Single-Page Application (SPA) routing rules
│   └── .env.example
│
└── backend/                   # FastAPI REST API + In-Memory Store
    ├── main.py                # FastAPI entrypoint with CORS & Static uploads
    ├── api/routes/            # Gas, Temperature, Prediction, Image, Video endpoints
    ├── models/                # Pydantic schemas
    ├── services/              # Business logic & frame handlers
    ├── data/memory_store.py   # High-speed in-memory store for real-time telemetry
    ├── examples/              # Pi simulator scripts (pi_send_all.py, simulate_rover.py)
    ├── requirements.txt
    ├── Procfile               # Web process definition for Render / Heroku
    └── render.yaml            # Render Blueprint spec
```

---

## 🚀 Live PPT Demonstration Mode

> **Judge-Ready Zero-Downtime Guarantee:**
> If the Raspberry Pi is not transmitting live data during the presentation, the frontend **automatically activates its built-in realistic telemetry simulation loop**. All gas dials, sensor trends, mine maps, and safety prediction scores will continuously update and animate seamlessly for judges.

---

## ⚡ Deployment Instructions

### 1. Deploying the Frontend on Vercel (Static Dashboard)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New Project** and import `MINE_X_ROVER`.
3. In the configuration screen:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click *Edit* and select `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. *(Optional)* Under **Environment Variables**, add:
   * `VITE_API_URL`: Your Render backend URL (e.g. `https://mine-rescue-backend.onrender.com`)
   *(Leave blank if presenting purely with the built-in simulator)*
5. Click **Deploy**. Your live dashboard will be instantly available at `https://mine-x-rover.vercel.app`!

---

### 2. Deploying the Backend on Render (Web Service)
1. Go to [render.com](https://render.com) and log in with GitHub.
2. Click **New +** -> **Web Service**.
3. Select your repository `MINE_X_ROVER`.
4. Configure the service:
   * **Name**: `mine-rescue-backend`
   * **Root Directory**: `backend`
   * **Language**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   * `CORS_ORIGINS`: `*` (or your Vercel URL)
6. Click **Create Web Service**. Your API and interactive Swagger docs will be live at `https://<your-service>.onrender.com/docs`.

---

## 💻 Local Development

### Run Frontend
```bash
cd frontend
npm install
npm run dev
# Dashboard opens on http://localhost:5173
```

### Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
# API opens on http://localhost:5000/docs
```

### Run Rover Simulator
```bash
cd backend
python examples/simulate_rover.py --server http://localhost:5000
```
