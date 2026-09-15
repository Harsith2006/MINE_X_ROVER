import { Cog, Radar, Camera, Router, Battery, Cpu, Map } from "lucide-react";

const ICONS = { motors: Cog, sensors: Radar, camera: Camera, lidar: Router, comms: Router, power: Battery, edge: Cpu, mapping: Map };
const STYLE = {
  OK: "text-green-400 border-green-500/30 bg-green-500/5",
  WARNING: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  ERROR: "text-red-400 border-red-500/30 bg-red-500/5",
  OFFLINE: "text-slate-400 border-slate-500/30 bg-slate-500/5",
};

// Statuses: OK / WARNING / ERROR / OFFLINE
export default function SystemHealth({ health }) {
  return (
    <section className="card p-3">
      <h2 className="card-title !text-slate-200 mb-2">System Health</h2>
      <div className="grid grid-cols-3 gap-1.5">
        {(health ?? []).map((h) => {
          const Icon = ICONS[h.id] ?? Cpu;
          const cls = STYLE[h.status] ?? STYLE.OK;
          return (
            <div key={h.id} className={`border rounded-lg px-2 py-1.5 flex items-center gap-1.5 ${cls}`}>
              <Icon size={14} />
              <div className="leading-tight">
                <p className="text-[10px] text-slate-300 capitalize">{h.label}</p>
                <p className="text-[10px] font-bold">{h.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
