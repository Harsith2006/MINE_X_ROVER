import { LineChart, Line, ResponsiveContainer } from "recharts";

const Mini = ({ data, color }) => (
  <div className="h-[30px] mt-1">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.4} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function EnvironmentalConditions({ env }) {
  const e = env;
  return (
    <section className="card p-4">
      <h2 className="card-title !text-slate-200 mb-2.5">Environmental Conditions</h2>
      {!e ? <p className="text-[11px] text-dim">Loading…</p> : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="neu-well p-2.5 text-center">
              <p className="text-[10px] text-dim">Temp (°C)</p>
              <p className="text-[19px] font-bold text-white">{e.temperature}</p>
              <Mini data={e.tempTrend} color="#38bdf8" />
            </div>
            <div className="neu-well p-2.5 text-center">
              <p className="text-[10px] text-dim">Humidity (%)</p>
              <p className="text-[19px] font-bold text-white">{e.humidity}</p>
              <Mini data={e.humTrend} color="#22d3ee" />
            </div>
            <div className="neu-well p-2.5 text-center">
              <p className="text-[10px] text-dim">Pressure (kPa)</p>
              <p className="text-[19px] font-bold text-white">{e.pressure}</p>
              <Mini data={e.presTrend} color="#a3e635" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between neu-pressed px-3 py-2 bg-green-500/10">
            <span className="text-[11px] text-dim">Air Quality</span>
            <span className="text-[12px] font-bold text-green-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />{e.airQuality}</span>
          </div>
        </>
      )}
    </section>
  );
}
