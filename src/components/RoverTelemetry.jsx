import { Gauge, Route, Mountain, Compass, Thermometer, Droplets, Cpu, Cog } from "lucide-react";

const good = (v) => (String(v).toLowerCase() === "normal" || String(v).toLowerCase() === "good" || String(v).toLowerCase() === "streaming"
  ? "text-green-400" : "text-yellow-400");

export default function RoverTelemetry({ telemetry }) {
  const t = telemetry;
  const rows = t ? [
    [Gauge, "Rover Speed", `${t.speed} m/s`],
    [Route, "Distance Traveled", `${t.distance} m`],
    [Mountain, "Altitude", `${t.altitude} m`],
    [Compass, "Orientation (Yaw)", `${t.yaw}°`],
    [Thermometer, "Temperature", `${t.temperature} °C`],
    [Droplets, "Humidity", `${t.humidity} %`],
    [Cpu, "IMU Status", t.imu, good(t.imu)],
    [Cog, "Motor Status", t.motor, good(t.motor)],
  ] : [];
  return (
    <section className="card p-3">
      <h2 className="card-title !text-slate-200 mb-2">Rover Telemetry</h2>
      {!t ? <p className="text-[11px] text-dim">Loading…</p> : (
        <ul className="divide-y divide-edge/60">
          {rows.map(([Icon, k, v, c]) => (
            <li key={k} className="flex items-center gap-2 py-[5px] text-[12px]">
              <Icon size={13} className="text-dim shrink-0" />
              <span className="text-slate-300">{k}</span>
              <span className={`ml-auto font-semibold ${c ?? "text-white font-mono"}`}>{v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
