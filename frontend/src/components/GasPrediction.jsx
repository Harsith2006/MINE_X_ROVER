import { BrainCircuit, TrendingUp } from "lucide-react";
import { statusOf } from "./GasSensorCard";

// Displays Random-Forest prediction documents from the service layer.
// No ML runs here — the model connects later behind services/api.js.
export default function GasPrediction({ prediction }) {
  const p = prediction;
  const risk = p?.riskPercentage ?? 0;
  const st = statusOf(p?.riskLevel ?? "normal");
  const R = 52, C = 2 * Math.PI * R;
  const segs = [
    { frac: 0.33, color: "#22c55e" }, { frac: 0.27, color: "#eab308" }, { frac: 0.4, color: "#ef4444" },
  ];
  let acc = 0;

  return (
    <section className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="neu-track w-8 h-8 rounded-full flex items-center justify-center shrink-0">
          <BrainCircuit size={15} className="text-purple-400" />
        </span>
        <h2 className="card-title !text-slate-200">Gas Level Prediction</h2>
        <span className="text-[10px] text-dim">(Random Forest)</span>
      </div>
      {!p ? <p className="text-[11px] text-dim">Waiting for model output…</p> : (
        <div className="flex gap-3">
          <div className="flex flex-col items-center shrink-0 neu-well px-3 pt-2 pb-2.5">
            <svg width="132" height="84" viewBox="0 0 132 84">
              {segs.map((s, i) => {
                const dash = `${s.frac * (C / 2)} ${C}`;
                const off = -acc * (C / 2);
                acc += s.frac;
                return <circle key={i} cx="66" cy="66" r={R} fill="none" stroke={s.color} strokeWidth="13"
                  strokeDasharray={dash} strokeDashoffset={off} transform="rotate(180 66 66)" opacity="0.9" />;
              })}
              <line x1="66" y1="66" x2={66 + 44 * Math.cos(Math.PI * (1 - risk / 100))} y2={66 - 44 * Math.sin(Math.PI * (1 - risk / 100))}
                stroke="#fff" strokeWidth="2.5" />
              <circle cx="66" cy="66" r="5" fill="#fff" />
              <text x="66" y="58" textAnchor="middle" fill="#fbbf24" fontSize="20" fontWeight="800">{risk}%</text>
            </svg>
            <p className="text-[10px] text-dim mt-1">Predicted Gas Risk</p>
            <p className={`text-[15px] font-bold ${st.text}`}>{st.label}</p>
            <p className="text-[10px] text-dim">{p.predictedValue} {p.predictedUnit} {p.gasType}</p>
          </div>
          <div className="flex-1 text-[11px] space-y-1.5">
            <p className="text-dim">Prediction Details</p>
            {[
              ["Model Accuracy", `${p.modelAccuracy}%`, "text-green-400"],
              ["Prediction Confidence", `${p.confidence}%`, "text-green-400"],
              ["Trend (" + p.horizon + ")", p.trend, "text-red-400"],
              ["Risk Level", st.label, st.text],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between items-center neu-track px-3 py-1.5">
                <span className="text-dim">{k}</span><span className={`font-semibold ${c} flex items-center gap-1`}>{v}{k.startsWith("Trend") && <TrendingUp size={11} />}</span>
              </div>
            ))}
            {p.reason && (
              <div className="neu-track px-3 py-1.5 text-[10px] text-slate-300">
                <span className="text-dim block mb-0.5">Model Diagnosis:</span>
                <span className="font-mono text-yellow-300">{p.reason}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
