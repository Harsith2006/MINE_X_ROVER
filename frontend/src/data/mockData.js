// ─────────────────────────────────────────────────────────────
// mockData.js — REALISTIC MOCK DATA for visual testing only.
// ★ THIS IS THE ONLY FILE FEEDING THE UI RIGHT NOW (via services/api.js).
// Later: keep every component/hook untouched and point api.js at your
// real REST/WebSocket/MQTT backend instead.
// ─────────────────────────────────────────────────────────────

const now = Date.now();
const iso = (offsetMs = 0) => new Date(now + offsetMs).toISOString();

// ---- live trend helpers -------------------------------------------------
const walk = (n, base, amp, min = 0) => {
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.5) * amp;
    v = Math.max(min, v);
    out.push({ t: i, v: Math.round(v * 10) / 10 });
  }
  return out;
};

// ---- 1. Rover status (header) -------------------------------------------
export const roverStatus = {
  roverId: "RVR-01",
  online: true,
  missionStart: iso(-2 * 3600e3 - 47 * 60e3 - 16e3), // ~02:47:16 ago
  lastUpdate: iso(0),
  battery: 78,
  signal: 82, // percent
  emergency: false,
};

// ---- 2. Gas sensor readings ----------------------------------------------
export const gasReadings = [
  { sensorId: "mq4",  name: "Methane",          model: "MQ-4",   value: 215, unit: "ppm", status: "moderate", trend: walk(40, 215, 60, 50),  timestamp: iso(0) },
  { sensorId: "mq7",  name: "Carbon Monoxide",  model: "MQ-7",   value: 35,  unit: "ppm", status: "normal",   trend: walk(40, 35, 9, 5),     timestamp: iso(0) },
  { sensorId: "mq136", name: "Hydrogen Sulfide", model: "MQ-136", value: 12, unit: "ppm", status: "normal",   trend: walk(40, 12, 4, 2),     timestamp: iso(0) },
  { sensorId: "mq135", name: "Air Quality",      model: "MQ-135", value: 85, unit: "ppm", status: "moderate", trend: walk(40, 85, 22, 20),   timestamp: iso(0) },
  { sensorId: "dht22", name: "Temperature",      model: "DHT22",  value: 28.6, unit: "°C", status: "normal",  trend: walk(40, 28.6, 1.2, 15), timestamp: iso(0) },
  { sensorId: "dht22h", name: "Humidity",        model: "DHT22",  value: 62,  unit: "%",   status: "normal",   trend: walk(40, 62, 5, 10),    timestamp: iso(0) },
];

// ---- 3. Gas prediction (Random Forest output, served by backend later) ----
export const gasPrediction = {
  gasType: "methane",
  predictedValue: 280,
  predictedUnit: "ppm",
  riskPercentage: 68,
  riskLevel: "moderate", // normal | moderate | high | critical
  confidence: 91.2,
  trend: "increasing",
  modelAccuracy: 93.4,
  horizon: "Next 5 min",
  history: walk(30, 55, 8, 10).map((p, i) => ({ t: `-${30 - i}m`, risk: p.v })),
  timestamp: iso(0),
};

// ---- 4. Mine map (occupancy grid + rover + history) ------------------------
// Grid encoding: 0 = unknown, 1 = free/explored, 2 = obstacle/wall.
// 60 x 36 cells covering 30m x 18m  → 0.5 m / cell.
const W = 60, H = 36;
function buildGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill(0));
  // carve two horizontal tunnels + one vertical connector (deterministic)
  const carve = (x0, x1, y0, y1) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = 1;
  };
  carve(2, 56, 14, 22);   // main tunnel
  carve(8, 52, 6, 13);    // upper gallery
  carve(30, 36, 6, 22);   // connector
  carve(40, 56, 18, 24);  // east pocket
  // walls / obstacles
  const wall = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = 2; };
  for (let x = 2; x < 57; x++) { wall(x, 13); wall(x, 23); }
  for (let x = 8; x < 53; x++) { wall(x, 5); }
  [[12, 17], [13, 17], [24, 19], [44, 16], [47, 21], [20, 10], [52, 9]].forEach(([x, y]) => wall(x, y));
  return g;
}

const roverPath = [
  { x: 8, y: 18 }, { x: 12, y: 17.4 }, { x: 16, y: 18.2 }, { x: 20, y: 17 },
  { x: 24, y: 16.2 }, { x: 28, y: 16.6 }, { x: 32, y: 17.5 }, { x: 36, y: 17.8 },
  { x: 40, y: 17 }, { x: 44, y: 17.4 }, { x: 46, y: 17.8 },
];

export const mapData = {
  width: W,
  height: H,
  resolution: 0.5, // meters per cell
  origin: { x: 0, y: 0 },
  grid: buildGrid(),
  rover: { x: 46, y: 17.8, yaw: 135 },
  path: roverPath,
  safeZones: [
    { x: 48, y: 17.5, r: 4.5, label: "Safe Zone" },
  ],
  // Historical gas detections — every marker keeps full context:
  gasEvents: [
    { id: "g1", timestamp: iso(-26 * 60e3), roverId: "RVR-01", x: 20, y: 19.5, gasType: "methane",          measuredValue: 190, predictedValue: 230, riskLevel: "moderate" },
    { id: "g2", timestamp: iso(-14 * 60e3), roverId: "RVR-01", x: 33, y: 17.2, gasType: "methane",          measuredValue: 265, predictedValue: 310, riskLevel: "high" },
    { id: "g3", timestamp: iso(-9 * 60e3),  roverId: "RVR-01", x: 44, y: 17.4, gasType: "methane",          measuredValue: 295, predictedValue: 330, riskLevel: "critical" },
    { id: "g4", timestamp: iso(-6 * 60e3),  roverId: "RVR-01", x: 38, y: 16.8, gasType: "hydrogen_sulfide", measuredValue: 14,  predictedValue: 18,  riskLevel: "moderate" },
    { id: "g5", timestamp: iso(-3 * 60e3),  roverId: "RVR-01", x: 45, y: 18.1, gasType: "carbon_monoxide",  measuredValue: 42,  predictedValue: 48,  riskLevel: "moderate" },
  ],
  updatedAt: iso(0),
};

// ---- 5. Gas detection history (last 30 min scatter) -------------------------
export const gasHistory = [
  { time: "-28m", t: -28, level: 1, severity: "normal",   gasType: "methane", value: 120 },
  { time: "-25m", t: -25, level: 1, severity: "normal",   gasType: "methane", value: 140 },
  { time: "-22m", t: -22, level: 1, severity: "normal",   gasType: "co",      value: 22 },
  { time: "-20m", t: -20, level: 2, severity: "moderate", gasType: "methane", value: 210 },
  { time: "-17m", t: -17, level: 2, severity: "moderate", gasType: "methane", value: 225 },
  { time: "-15m", t: -15, level: 2, severity: "moderate", gasType: "methane", value: 240 },
  { time: "-13m", t: -13, level: 3, severity: "high",     gasType: "methane", value: 290 },
  { time: "-11m", t: -11, level: 2, severity: "moderate", gasType: "h2s",     value: 13 },
  { time: "-8m",  t: -8,  level: 1, severity: "normal",   gasType: "co",      value: 30 },
  { time: "-6m",  t: -6,  level: 1, severity: "normal",   gasType: "methane", value: 180 },
  { time: "-4m",  t: -4,  level: 2, severity: "moderate", gasType: "methane", value: 230 },
  { time: "-2m",  t: -2,  level: 3, severity: "high",     gasType: "methane", value: 285 },
  { time: "-1m",  t: -1,  level: 4, severity: "critical", gasType: "methane", value: 340 },
];

// ---- 6. Rover telemetry ------------------------------------------------------
export const telemetry = {
  speed: 0.32, distance: 42.7, altitude: -12.4, yaw: 135,
  temperature: 28.6, humidity: 62,
  imu: "Normal", motor: "Normal", camera: "Streaming", sensor: "Normal", comms: "Good",
};

// ---- 7. System health ---------------------------------------------------------
export const systemHealth = [
  { id: "motors",  label: "Motors",     status: "OK" },
  { id: "sensors", label: "Sensors",    status: "OK" },
  { id: "camera",  label: "Camera",     status: "OK" },
  { id: "lidar",   label: "LIDAR/ToF",  status: "OK" },
  { id: "comms",   label: "Comms",      status: "WARNING" },
  { id: "power",   label: "Power",      status: "OK" },
  { id: "edge",    label: "Edge Pi",    status: "OK" },
  { id: "mapping", label: "Mapping",    status: "OK" },
];

// ---- 8. Alerts -----------------------------------------------------------------
export const alerts = [
  { id: "a1", timestamp: iso(-8 * 60e3),   severity: "critical", message: "High Methane Detected",     location: "Sector 7 · x:44 y:17" },
  { id: "a2", timestamp: iso(-12 * 60e3),  severity: "high",     message: "Hydrogen Sulfide Detected", location: "East Tunnel · x:38 y:16" },
  { id: "a3", timestamp: iso(-20 * 60e3),  severity: "moderate", message: "Obstacle Detected",         location: "Main Tunnel · x:24 y:19" },
  { id: "a4", timestamp: iso(-35 * 60e3),  severity: "moderate", message: "Communication Weak",        location: "Relay 2" },
  { id: "a5", timestamp: iso(-50 * 60e3),  severity: "high",     message: "Low Battery Warning",       location: "RVR-01" },
  { id: "a6", timestamp: iso(-65 * 60e3),  severity: "moderate", message: "High Temperature",          location: "DHT22 · 31.2 °C" },
];

// ---- 9. Mission info --------------------------------------------------------------
export const missionInfo = {
  missionId: "MRR-2024-05-15",
  objective: "Search & Rescue",
  roverId: "RVR-01",
  startTime: iso(-2 * 3600e3 - 47 * 60e3),
  targetArea: "Sector 7 – East Tunnel",
  team: "SOBERSQUAD_26",
  status: "In Progress",
};

// ---- 10. Environment ---------------------------------------------------------------
export const environment = {
  temperature: 28.6, humidity: 62, pressure: 101.2, airQuality: "Good",
  tempTrend: walk(30, 28.6, 1.0, 20),
  humTrend: walk(30, 62, 4, 30),
  presTrend: walk(30, 101.2, 0.4, 95),
};

// ---- 11. Video (placeholder — swap src with WebRTC/RTSP later) --------------------
export const videoInfo = {
  streamUrl: null, // e.g. "webrtc://…" / "rtsp://…" — LiveVideo reads this via props
  connected: true,
  timestamp: iso(0),
};
