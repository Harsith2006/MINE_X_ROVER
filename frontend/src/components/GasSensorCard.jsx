import { LineChart, Line, ResponsiveContainer } from "recharts";

export const STATUS_STYLE = {
  normal:   { label: "Normal",   text: "text-green-400",  dot: "bg-green-400",  chart: "#22c55e" },
  low:      { label: "Low",      text: "text-green-400",  dot: "bg-green-400",  chart: "#22c55e" },
  moderate: { label: "Moderate", text: "text-yellow-400", dot: "bg-yellow-400", chart: "#eab308" },
  high:     { label: "High",     text: "text-orange-400", dot: "bg-orange-400", chart: "#f97316" },
  critical: { label: "Critical", text: "text-red-400",    dot: "bg-red-500",    chart: "#ef4444" },
};
export const statusOf = (s) => STATUS_STYLE[s] ?? STATUS_STYLE.normal;

// One live gas card. To add a sensor later, just append an entry to
// mockData.gasReadings (or your API response) — this component maps generically.
export default function GasSensorCard({ sensor }) {
  if (!sensor) return null;
  const st = statusOf(sensor.status);
  const data = (sensor.trend ?? []).map((p) => ({ ...p }));
  const last = data[data.length - 1]?.v;
  const first = data[0]?.v;
  const trendDir = last == null || first == null ? "→" : last > first ? "↗" : last < first ? "↘" : "→";

  return (
    <div className="rounded-neu-btn bg-neu-surface shadow-neu-small neu-hoverable p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-300 font-medium">{sensor.model} <span className="text-dim">({sensor.name})</span></p>
        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
      </div>
      <div className="flex items-end justify-between gap-2 mt-0.5">
        <div>
          <p className="text-[19px] font-bold text-white leading-none">{sensor.value} <span className="text-[11px] font-medium text-dim">{sensor.unit}</span></p>
          <p className="text-[10px] text-dim mt-1">Status <span className={`font-semibold ${st.text}`}>{st.label} {trendDir}</span></p>
        </div>
        <div className="w-[55%] h-[52px] neu-track px-2 py-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="v" stroke={st.chart} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
