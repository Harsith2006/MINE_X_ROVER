// ─────────────────────────────────────────────────────────────
// services/api.js — ★ THE SINGLE INTEGRATION POINT ★
//
// LIVE backend (FastAPI server.py, default http://localhost:5000):
//   gas + prediction + video come from the real rover API.
//   Everything else (map, telemetry, health, alerts, mission, env…)
//   keeps the mock + jitter loop so the page looks dynamic.
//
//   ROVER_ID + base URL are configurable via .env:
//     VITE_ROVER_ID=RVR-01
//     VITE_API_URL=http://localhost:5000   (empty = same-origin, via vite proxy)
//
// Nothing else in the app needs to change — components go through
// dataService → api.js, never mockData directly.
// ─────────────────────────────────────────────────────────────
import * as mock from "../data/mockData";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const ROVER = import.meta.env.VITE_ROVER_ID ?? "RVR-01";

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const clone = (o) => JSON.parse(JSON.stringify(o));

async function getJSON(path, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// Client-side sparkline buffer: backend trends start with 1 point, so we
// extend them locally (last 40 values) to keep the cards looking alive.
const trendCache = {}; // sensorId -> [{t, v}]
function withLiveTrend(reading) {
  const n = 40;
  let buf = trendCache[reading.sensorId];
  if (!buf) {
    // seed from backend trend if present, else flat line at current value
    buf = (reading.trend ?? []).slice(-n).map((p, i) => ({ t: i, v: p.v }));
    trendCache[reading.sensorId] = buf;
  }
  const last = buf[buf.length - 1]?.v;
  if (last === undefined || Math.abs(last - reading.value) > 1e-9) {
    buf = [...buf.slice(-(n - 1)), { t: (buf.length ? buf[buf.length - 1].t + 1 : 0), v: reading.value }];
    trendCache[reading.sensorId] = buf;
  }
  return { ...reading, trend: buf, timestamp: reading.timestamp ?? new Date().toISOString() };
}

// Last-known live readings so cards persist between rover posts.
let lastLiveGases = [];
let liveGasesSince = 0;

function mockJitterReadings() {
  const out = clone(mock.gasReadings);
  for (const s of out) {
    const drift = (Math.random() - 0.5) * (s.value * 0.06 || 1);
    s.value = Math.max(0, Math.round((s.value + drift) * 10) / 10);
    s.trend = [...s.trend.slice(1), { t: s.trend.length, v: s.value }];
    s.timestamp = new Date().toISOString();
  }
  return out;
}

export async function getRoverStatus()    { await delay(); const s = clone(mock.roverStatus); s.roverId = ROVER; s.lastUpdate = new Date().toISOString(); return s; }

export async function getGasReadings() {
  // 1) Try live rover gas. Merge over mock defaults so sensors the rover
  //    hasn't reported yet (CO/H2S/…) still show a dynamic loop value.
  try {
    const data = await getJSON(`/api/rover/${ROVER}/gas/latest`);
    if (data?.readings?.length) {
      liveGasesSince = Date.now();
      lastLiveGases = data.readings.map(withLiveTrend);
      const liveById = Object.fromEntries(lastLiveGases.map((r) => [r.sensorId, r]));
      return mockJitterReadings()
        .map((m) => liveById[m.sensorId] ?? m)
        .slice(0, 6);
    }
  } catch { /* backend down → fall through to loop */ }
  // No live data (or backend down): if we had live values <30s ago keep them, else full loop.
  if (lastLiveGases.length && Date.now() - liveGasesSince < 30000) {
    const liveById = Object.fromEntries(lastLiveGases.map((r) => [r.sensorId, r]));
    return mockJitterReadings().map((m) => liveById[m.sensorId] ?? m).slice(0, 6);
  }
  lastLiveGases = [];
  await delay();
  return mockJitterReadings();
}

export async function getGasPredictions() {
  // Computed live: backend feeds current gas triplet into the
  // gas-safety-demo RandomForest on every poll. Falls back to mock loop.
  try {
    const p = await getJSON(`/api/rover/${ROVER}/prediction/latest`);
    if (p?.riskLevel) {
      return {
        ...clone(mock.gasPrediction),
        gasType: p.gasType ?? "methane",
        predictedValue: p.predictedValue,
        predictedUnit: p.predictedUnit ?? "ppm",
        riskPercentage: p.riskPercentage,
        riskLevel: p.riskLevel,
        confidence: p.confidence,
        trend: p.trend ?? "stable",
        modelAccuracy: p.modelAccuracy ?? 93.4,
        modelName: p.model_name ?? "RandomForest",
        prediction: p.prediction,
        reason: p.reason,
        inputs: p.inputs,
        timestamp: p.timestamp ?? new Date().toISOString(),
      };
    }
  } catch { /* no gas posted yet or backend down */ }
  await delay();
  const p = clone(mock.gasPrediction);
  p.timestamp = new Date().toISOString();
  return p;
}

export async function getMapData()        { await delay(200); const m = clone(mock.mapData); m.updatedAt = new Date().toISOString(); return m; }
export async function getGasHistory()     { await delay(); return clone(mock.gasHistory); }

export async function getTelemetry() {
  await delay();
  const t = clone(mock.telemetry);
  t.speed = Math.max(0, +(t.speed + (Math.random() - .5) * .04).toFixed(2));
  t.distance = +(t.distance + t.speed * 2).toFixed(1);
  // Inject live temperature when the rover is reporting it.
  try {
    const tmp = await getJSON(`/api/rover/${ROVER}/temperature/latest`);
    if (tmp?.temperature != null) t.temperature = tmp.temperature;
  } catch { /* keep loop value */ }
  return t;
}

export async function getSystemHealth()   { await delay(); return clone(mock.systemHealth); }
export async function getAlerts()         { await delay(); return clone(mock.alerts); }
export async function getMissionInfo()    { await delay(); const m = clone(mock.missionInfo); m.roverId = ROVER; return m; }

export async function getEnvironment() {
  await delay();
  const e = clone(mock.environment);
  try {
    const tmp = await getJSON(`/api/rover/${ROVER}/temperature/latest`);
    if (tmp?.temperature != null) {
      e.temperature = tmp.temperature;
      e.tempTrend = [...e.tempTrend.slice(1), { t: e.tempTrend.length, v: tmp.temperature }];
    }
  } catch { /* keep loop value */ }
  return e;
}

export async function getVideoInfo() {
  // Live: backend reports whether a frame has arrived and where to poll it
  // (GET /api/rover/{id}/video/frame, ~1/sec multipart POSTs from rover).
  try {
    const v = await getJSON(`/api/rover/${ROVER}/video/info`);
    if (v) {
      const streamUrl = v.streamUrl ? `${BASE}${v.streamUrl}` : null;
      return { streamUrl, connected: !!v.connected, timestamp: v.timestamp ?? new Date().toISOString() };
    }
  } catch { /* backend down → placeholder */ }
  await delay(60);
  const v = clone(mock.videoInfo);
  v.timestamp = new Date().toISOString();
  return v;
}
