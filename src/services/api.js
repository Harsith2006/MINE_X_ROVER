// ─────────────────────────────────────────────────────────────
// services/api.js — ★ THE SINGLE INTEGRATION POINT ★
// Today every function below returns mock data (with a tiny delay so
// loading states behave like a real backend).
//
// TO CONNECT YOUR REAL DATABASE/API LATER, replace ONLY the bodies
// below, e.g.:
//
//   export async function getGasReadings() {
//     const res = await fetch(`${import.meta.env.VITE_API_URL}/gas`);
//     return res.json();
//   }
//
//   // WebSocket/MQTT-ready: add subscribeGasReadings(cb) here later.
//
// Nothing else in the app needs to change — components never import
// mockData directly; they go through dataService → api.js.
// ─────────────────────────────────────────────────────────────
import * as mock from "../data/mockData";

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const clone = (o) => JSON.parse(JSON.stringify(o));

// Add small live jitter so charts feel "live" while testing.
function jitterReadings() {
  const out = clone(mock.gasReadings);
  for (const s of out) {
    const drift = (Math.random() - 0.5) * (s.value * 0.06 || 1);
    s.value = Math.max(0, Math.round((s.value + drift) * 10) / 10);
    s.trend = [...s.trend.slice(1), { t: s.trend.length, v: s.value }];
    s.timestamp = new Date().toISOString();
  }
  return out;
}

export async function getRoverStatus()    { await delay(); const s = clone(mock.roverStatus); s.lastUpdate = new Date().toISOString(); return s; }
export async function getGasReadings()    { await delay(); return jitterReadings(); }
export async function getGasPredictions() { await delay(); const p = clone(mock.gasPrediction); p.timestamp = new Date().toISOString(); return p; }
export async function getMapData()        { await delay(200); const m = clone(mock.mapData); m.updatedAt = new Date().toISOString(); return m; }
export async function getGasHistory()     { await delay(); return clone(mock.gasHistory); }
export async function getTelemetry()      { await delay(); const t = clone(mock.telemetry); t.speed = Math.max(0, +(t.speed + (Math.random() - .5) * .04).toFixed(2)); t.distance = +(t.distance + t.speed * 2).toFixed(1); return t; }
export async function getSystemHealth()   { await delay(); return clone(mock.systemHealth); }
export async function getAlerts()         { await delay(); return clone(mock.alerts); }
export async function getMissionInfo()    { await delay(); return clone(mock.missionInfo); }
export async function getEnvironment()    { await delay(); return clone(mock.environment); }
export async function getVideoInfo()      { await delay(60); const v = clone(mock.videoInfo); v.timestamp = new Date().toISOString(); return v; }
