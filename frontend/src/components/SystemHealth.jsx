import { Cog, Radar, Camera, Router, Battery, Cpu, Map } from "lucide-react";

const ICONS = { motors: Cog, sensors: Radar, camera: Camera, lidar: Router, comms: Router, power: Battery, edge: Cpu, mapping: Map };
const STYLE = {
  OK: "text-green-400 bg-green-500/5 shadow-neu-small",
  WARNING: "text-yellow-400 bg-yellow-500/5 shadow-neu-small",
  ERROR: "text-red-400 bg-red-500/5 shadow-neu-small",
  OFFLINE: "text-slate-400 bg-slate-500/5 shadow-neu-track",
};

// Statuses: OK / WARNING / ERROR / OFFLINE
export default function SystemHealth({ health }) {
  return (
    <section className="card p-4">
      <h2 className="card-title !text-slate-200 mb-2.5">System Health</h2>
      <div className="grid grid-cols-3 gap-2">
        {(health ?? []).map((h) => {
          const Icon = ICONS[h.id] ?? Cpu;
          const cls = STYLE[h.status] ?? STYLE.OK;
          return (
            <div key={h.id} className={`rounded-2xl shadow-neu-small bg-neu-surface neu-hoverable px-2 py-2 flex items-center gap-1.5 ${cls}`}>
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
