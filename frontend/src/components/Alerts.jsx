import { TriangleAlert } from "lucide-react";

const SEV = {
  critical: "text-red-400",
  high: "text-orange-400",
  moderate: "text-yellow-400",
  low: "text-green-400",
  info: "text-blue-400",
};

const fmtT = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour12: false }) : "--:--:--");

// Each alert: timestamp · severity · message · location (when available).
export default function Alerts({ alerts }) {
  return (
    <section className="card p-4 flex flex-col min-h-0">
      <h2 className="card-title !text-slate-200 mb-2.5">Recent Alerts</h2>
      <ul className="space-y-2 overflow-y-auto scroll-thin pr-1">
        {(alerts ?? []).map((a) => (
          <li key={a.id} className="neu-pressed !rounded-2xl flex items-start gap-2.5 text-[12px] px-3 py-2">
            <TriangleAlert size={14} className={`mt-0.5 shrink-0 ${SEV[a.severity] ?? "text-yellow-400"}`} />
            <div className="min-w-0">
              <p><span className="font-mono text-dim mr-2">{fmtT(a.timestamp)}</span>
                <span className={`font-semibold ${SEV[a.severity] ?? ""}`}>{a.message}</span></p>
              {a.location && <p className="text-[10px] text-dim truncate">{a.location}</p>}
            </div>
          </li>
        ))}
        {(!alerts || alerts.length === 0) && <p className="text-[11px] text-dim">No alerts.</p>}
      </ul>
    </section>
  );
}
