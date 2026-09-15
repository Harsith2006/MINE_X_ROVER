import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Crosshair, History } from "lucide-react";

// Pure presentational map: ALL data arrives via the `map` prop
// (occupancy grid, rover pose, path, gas events). No hardcoding —
// swap the service response and the map re-renders untouched.
const RISK = {
  normal: "#22c55e", moderate: "#eab308", high: "#f97316", critical: "#ef4444",
};

export default function MineMap({ map }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current;
    if (!cv || !wrap || !map?.grid) return;
    const W = map.width, H = map.height;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#080d18";
    ctx.fillRect(0, 0, w, h);

    // grid lines
    ctx.strokeStyle = "rgba(60,75,105,.18)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const pad = 34;
    const cw = Math.min((w - pad - 10) / W, (h - pad - 26) / H) * zoom;
    const ox = pad + ((w - pad - 10) - cw * W) / 2;
    const oy = 8 + ((h - pad - 26) - cw * H) / 2;
    const X = (gx) => ox + gx * cw;
    const Y = (gy) => oy + (H - gy) * cw; // y-up like the reference map

    // cells
    for (let gy = 0; gy < H; gy++) {
      for (let gx = 0; gx < W; gx++) {
        const c = map.grid[gy][gx];
        if (c === 0) continue;
        ctx.fillStyle = c === 1 ? "rgba(148,163,184,.34)" : "rgba(100,116,139,.85)";
        ctx.fillRect(ox + gx * cw, oy + gy * cw, cw - 0.4, cw - 0.4);
      }
    }
    // safe zones
    for (const z of map.safeZones ?? []) {
      ctx.fillStyle = "rgba(34,197,94,.35)";
      ctx.beginPath();
      ctx.ellipse(X(z.x), Y(z.y), z.r * cw, z.r * cw * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // rover path
    const path = map.path ?? [];
    if (path.length > 1) {
      ctx.strokeStyle = "#2f81f7"; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
      ctx.beginPath();
      path.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y))));
      ctx.stroke(); ctx.setLineDash([]);
    }
    // gas events (historical markers, not just latest)
    const events = showHistory ? (map.gasEvents ?? []) : (map.gasEvents ?? []).slice(-1);
    for (const e of events) {
      const col = RISK[e.riskLevel] ?? "#eab308";
      const gx = (e.x / (map.width * map.resolution)) * W;
      const gy = (e.y / (map.height * map.resolution)) * H;
      const px = X(gx), py = Y(gy);
      const grad = ctx.createRadialGradient(px, py, 1, px, py, 20);
      grad.addColorStop(0, col + "55"); grad.addColorStop(1, col + "00");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    }
    // rover
    if (map.rover) {
      const gx = (map.rover.x / (map.width * map.resolution)) * W;
      const gy = (map.rover.y / (map.height * map.resolution)) * H;
      const px = X(gx), py = Y(gy);
      ctx.fillStyle = "#2f81f7";
      ctx.strokeStyle = "#9ec5ff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const a = -((map.rover.yaw ?? 0) * Math.PI) / 180;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6);
      ctx.lineTo(px + Math.cos(a + 2.5) * 4, py + Math.sin(a + 2.5) * 4);
      ctx.lineTo(px + Math.cos(a - 2.5) * 4, py + Math.sin(a - 2.5) * 4);
      ctx.fill();
    }
    // axes labels
    ctx.fillStyle = "#8b98b3"; ctx.font = "10px sans-serif";
    ["0m", "5m", "10m", "15m", "20m", "25m"].forEach((l, i) => ctx.fillText(l, ox + (i * 5 / (W * map.resolution)) * (cw * W) - 8, h - 6));
    ["0m", "5m", "10m", "15m"].forEach((l, i) => ctx.fillText(l, 4, Y((i * 5) / map.resolution)));

    cv.onclick = (ev) => {
      const rect = cv.getBoundingClientRect();
      const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
      const hit = (map.gasEvents ?? []).find((e) => {
        const gx = (e.x / (map.width * map.resolution)) * W;
        const gy = (e.y / (map.height * map.resolution)) * H;
        return Math.hypot(X(gx) - mx, Y(gy) - my) < 14;
      });
      setSelected(hit ?? null);
    };
  }, [map, zoom, showHistory]);

  const sel = selected;

  return (
    <section className="card p-3 flex flex-col min-h-0">
      <div className="flex items-center gap-3 flex-wrap mb-1.5">
        <h2 className="card-title !text-slate-200">2D Mine Map <span className="normal-case font-normal">(Updated Every 1 Minute)</span></h2>
        <div className="flex items-center gap-3 text-[10px] text-dim">
          <span><i className="inline-block w-4 border-t-2 border-dashed border-blue-500 mr-1" />Rover Path</span>
          <span><i className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1" />Obstacles</span>
          <span><i className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Gas Detected</span>
          <span><i className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Safe Zone</span>
          <span><i className="inline-block w-2 h-2 rounded-full bg-slate-700 mr-1" />Unknown</span>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="ml-auto flex items-center gap-1.5 text-[11px] bg-panel2 hover:bg-edge border border-edge rounded-lg px-2.5 py-1">
          <History size={12} /> {showHistory ? "Hide History" : "View History"}
        </button>
      </div>

      <div className="relative flex-1 min-h-[280px]">
        <div ref={wrapRef} className="absolute inset-0">
          <canvas ref={canvasRef} className="w-full h-full rounded-lg cursor-crosshair" />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} className="w-7 h-7 bg-panel2/90 border border-edge rounded-md flex items-center justify-center hover:bg-edge"><Plus size={14} /></button>
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))} className="w-7 h-7 bg-panel2/90 border border-edge rounded-md flex items-center justify-center hover:bg-edge"><Minus size={14} /></button>
          <button onClick={() => setZoom(1)} className="w-7 h-7 bg-panel2/90 border border-edge rounded-md flex items-center justify-center hover:bg-edge"><Crosshair size={14} /></button>
        </div>
        <div className="absolute bottom-2 right-12 text-[10px] text-dim font-mono">zoom {zoom.toFixed(2)}x · click a gas marker for details</div>
        {sel && (
          <div className="absolute left-2 bottom-2 bg-[#0b1322]/95 border border-edge rounded-lg p-2.5 text-[11px] w-60">
            <p className="font-bold text-white mb-1">Gas Event · <span style={{ color: RISK[sel.riskLevel] }}>{sel.riskLevel?.toUpperCase()}</span></p>
            <p className="text-dim">x: {sel.x} m · y: {sel.y} m</p>
            <p className="text-dim">{sel.gasType} · meas <b className="text-slate-200">{sel.measuredValue}</b> · pred <b className="text-slate-200">{sel.predictedValue}</b></p>
            <p className="text-dim">{new Date(sel.timestamp).toLocaleString()}</p>
            <button onClick={() => setSelected(null)} className="mt-1 text-blue-400 hover:underline">Close</button>
          </div>
        )}
      </div>
    </section>
  );
}
