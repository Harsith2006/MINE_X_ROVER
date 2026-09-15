import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts";

const COLOR = { normal: "#22c55e", moderate: "#eab308", high: "#f97316", critical: "#ef4444" };

// Last-30-minutes event timeline. Severity is colour-coded; hover shows
// gas type, value and timestamp.
export default function GasHistory({ history }) {
  const data = (history ?? []).map((h) => ({ ...h, fill: COLOR[h.severity] ?? "#888" }));
  return (
    <section className="card p-3 flex flex-col min-h-0">
      <h2 className="card-title !text-slate-200 mb-1">Gas Detection History <span className="normal-case font-normal">(Last 30 Minutes)</span></h2>
      <div className="flex-1 min-h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1b2540" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: "#8b98b3", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#24334f" }} />
            <YAxis dataKey="level" domain={[0, 5]} ticks={[1, 2, 3, 4]} tickFormatter={(v) => ({ 1: "Low", 2: "Moderate", 3: "High", 4: "None" }[v] ?? v)}
              tick={{ fill: "#8b98b3", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#24334f" }} />
            <Tooltip cursor={{ stroke: "#334155" }}
              content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-[#0b1322] border border-edge rounded-lg px-2.5 py-1.5 text-[11px]">
                  <p className="font-bold" style={{ color: COLOR[payload[0].payload.severity] }}>{payload[0].payload.severity?.toUpperCase()}</p>
                  <p className="text-slate-300">{payload[0].payload.gasType} · {payload[0].payload.value} ppm</p>
                  <p className="text-dim">{payload[0].payload.time}</p>
                </div>
              ) : null} />
            <Scatter data={data} name="events">
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
