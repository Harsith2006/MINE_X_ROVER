import { useRef, useState } from "react";
import { Camera, CircleDot, ZoomIn, Maximize, Video } from "lucide-react";

// Independent video panel. Today it renders a placeholder tunnel scene.
// Later: pass a real stream URL via `info.streamUrl` and render
// <video src> / WebRTC <video ref> / <img mjpeg> here — no other file changes.
export default function LiveVideo({ info }) {
  const [rec, setRec] = useState(false);
  const [zoom, setZoom] = useState(1);
  const boxRef = useRef(null);
  const connected = info?.connected !== false;
  const ts = info?.timestamp ? new Date(info.timestamp).toLocaleTimeString("en-US", { hour12: false }) : "--:--:--";

  const fullscreen = () => boxRef.current?.requestFullscreen?.().catch(() => {});

  return (
    <section className="card p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="live-dot" />
        <h2 className="card-title !text-slate-200">Live Video Feed</h2>
        <span className="ml-auto text-[10px] text-dim font-mono">{connected ? "● CONNECTED" : "○ NO SIGNAL"} · {ts}</span>
      </div>

      <div ref={boxRef} className="relative rounded-2xl overflow-hidden bg-black aspect-[16/10]"
        style={{ boxShadow: "inset 10px 10px 22px rgba(0,0,0,0.75), inset -10px -10px 22px rgba(148,178,255,0.08)" }}>
        {/* placeholder tunnel scene (pure CSS/SVG so no assets needed) */}
        <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transition: "transform .25s" }}>
          <svg viewBox="0 0 400 250" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="tun" cx="50%" cy="55%" r="75%">
                <stop offset="0%" stopColor="#3a3227" /><stop offset="45%" stopColor="#241f18" /><stop offset="100%" stopColor="#0b0a08" />
              </radialGradient>
            </defs>
            <rect width="400" height="250" fill="url(#tun)" />
            {[150, 115, 85, 60, 40].map((w, i) => (
              <ellipse key={i} cx="200" cy="138" rx={w} ry={w * 0.62} fill="none" stroke="#4a4234" strokeOpacity={0.5 - i * 0.07} strokeWidth="5" />
            ))}
            <ellipse cx="200" cy="138" rx="22" ry="15" fill="#050403" />
            <ellipse cx="200" cy="205" rx="150" ry="40" fill="#2e2820" opacity="0.8" />
            {rec && <circle cx="20" cy="20" r="6" fill="#ef4444"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite" /></circle>}
          </svg>
        </div>
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">● LIVE</span>
        <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded text-slate-300">CAM-01 · {ts}</span>
        <span className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/60" />
        <span className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/60" />
      </div>

      <div className="grid grid-cols-4 gap-2.5 mt-3">
        <button className="neu-btn neu-focusable flex items-center justify-center gap-1.5 text-[11px] text-slate-200"><Camera size={13} /> Snapshot</button>
        <button onClick={() => setRec(!rec)} className={`neu-btn neu-focusable flex items-center justify-center gap-1.5 text-[11px] ${rec ? "!bg-red-500/15 text-red-300" : "text-slate-200"}`}>
          {rec ? <CircleDot size={13} /> : <Video size={13} />} {rec ? "Stop" : "Record"}
        </button>
        <button onClick={() => setZoom((z) => (z >= 2 ? 1 : +(z + 0.25).toFixed(2)))} className="neu-btn neu-focusable flex items-center justify-center gap-1.5 text-[11px] text-slate-200"><ZoomIn size={13} /> Zoom {zoom > 1 ? `${zoom}x` : ""}</button>
        <button onClick={fullscreen} className="neu-btn neu-focusable flex items-center justify-center gap-1.5 text-[11px] text-slate-200"><Maximize size={13} /> Full Screen</button>
      </div>
    </section>
  );
}
