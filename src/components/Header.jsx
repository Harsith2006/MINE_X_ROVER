import { Flame, TriangleAlert, Battery, Signal, Clock } from "lucide-react";

function fmtDuration(fromIso) {
  if (!fromIso) return "--:--:--";
  const s = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour12: true }) : "--");

export default function Header({ rover }) {
  const r = rover ?? {};
  const online = r.online !== false;
  const batt = r.battery ?? 0;
  const battColor = batt > 50 ? "text-green-400" : batt > 25 ? "text-yellow-400" : "text-red-400";
  const bars = [1, 2, 3, 4, 5].map((i) => ((r.signal ?? 0) / 20 >= i ? "bg-green-400" : "bg-slate-700"));

  return (
    <header className="card flex items-center gap-4 px-5 py-3 shrink-0 neu-hoverable">
      <div className="flex items-center gap-3 min-w-0">
        <div className="neu-well w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
          <Flame size={22} className="text-orange-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-white leading-tight truncate">Mine Rescue Rover Dashboard</h1>
          <p className="text-[10px] text-dim tracking-widest uppercase">AI-Powered Underground Mine Safety</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-stretch gap-5 text-center">
        <div>
          <p className="card-title">Rover Status</p>
          <p className={`text-[13px] font-semibold flex items-center gap-1.5 justify-center ${online ? "text-green-400" : "text-red-400"}`}>
            <span className="live-dot" style={!online ? { background: "#f87171" } : undefined} />{online ? "Online" : "Offline"}
          </p>
        </div>
        <div>
          <p className="card-title">Mission Time</p>
          <p className="text-[13px] font-semibold text-white flex items-center gap-1 justify-center"><Clock size={12} className="text-dim" />{fmtDuration(r.missionStart)}</p>
        </div>
        <div>
          <p className="card-title">Last Update</p>
          <p className="text-[13px] font-semibold text-white">{fmtTime(r.lastUpdate)}</p>
        </div>
        <div>
          <p className="card-title">Battery</p>
          <p className={`text-[13px] font-semibold flex items-center gap-1.5 justify-center ${battColor}`}><Battery size={14} />{batt}%</p>
        </div>
        <div>
          <p className="card-title">Signal</p>
          <div className="flex items-end gap-[3px] justify-center h-[18px] pt-1">
            {bars.map((c, i) => <span key={i} className={`w-[5px] rounded-sm ${c}`} style={{ height: 4 + i * 3 }} />)}
            <Signal size={13} className="text-dim ml-1" />
          </div>
        </div>
      </div>

      <button className="neu-btn neu-focusable flex items-center gap-2 text-[12px] font-bold px-5 text-white shrink-0 !bg-red-500/90 !shadow-[5px_5px_10px_rgba(0,0,0,0.55),-5px_-5px_10px_rgba(248,113,113,0.25)]">
        <TriangleAlert size={15} /> EMERGENCY STOP
      </button>
    </header>
  );
}
