import useDashboardData from "../hooks/useDashboardData";
import Header from "../components/Header";
import LiveVideo from "../components/LiveVideo";
import MineMap from "../components/MineMap";
import GasSensorCard from "../components/GasSensorCard";
import GasPrediction from "../components/GasPrediction";
import GasHistory from "../components/GasHistory";
import RoverTelemetry from "../components/RoverTelemetry";
import SystemHealth from "../components/SystemHealth";
import Alerts from "../components/Alerts";
import MissionInfo from "../components/MissionInfo";
import EnvironmentalConditions from "../components/EnvironmentalConditions";

// Monitoring-only layout (NO rover movement controls by design).
// Every panel below receives data via props from useDashboardData()
// → services/dataService.js → services/api.js → (mock today, DB/API tomorrow).
export default function Dashboard() {
  const { rover, gases, prediction, map, history, telemetry, health, alerts, mission, env, video, loading } =
    useDashboardData();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#070c16]">
        <div className="w-10 h-10 rounded-full border-2 border-edge border-t-blue-500 animate-spin" />
        <p className="text-[12px] text-dim tracking-widest uppercase">Initialising control room…</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gap-2.5 p-2.5 bg-[#070c16] text-ink overflow-hidden">
      <Header rover={rover} />

      <main className="flex-1 min-h-0 grid grid-cols-12 gap-2.5 overflow-y-auto xl:overflow-hidden scroll-thin">
        {/* LEFT — video + telemetry + health */}
        <div className="col-span-12 md:col-span-4 xl:col-span-3 flex flex-col gap-2.5 min-h-0">
          <LiveVideo info={video} />
          <div className="overflow-y-auto scroll-thin flex flex-col gap-2.5">
            <RoverTelemetry telemetry={telemetry} />
            <SystemHealth health={health} />
          </div>
        </div>

        {/* CENTER — map + history + mission/env */}
        <div className="col-span-12 md:col-span-8 xl:col-span-6 flex flex-col gap-2.5 min-h-0">
          <div className="flex-[1.4] min-h-[320px] flex flex-col [&>section]:flex-1">
            <MineMap map={map} />
          </div>
          <div className="flex-1 min-h-[170px] flex flex-col [&>section]:flex-1">
            <GasHistory history={history} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            <MissionInfo mission={mission} />
            <EnvironmentalConditions env={env} />
          </div>
        </div>

        {/* RIGHT — gas cards + prediction + alerts */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-2.5 min-h-0 overflow-y-auto scroll-thin">
          <section className="card p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="live-dot" />
              <h2 className="card-title !text-slate-200">Gas Sensor Readings</h2>
              <span className="text-[10px] text-dim">(Live)</span>
            </div>
            <div className="flex flex-col gap-2">
              {(gases ?? []).slice(0, 4).map((s) => <GasSensorCard key={s.sensorId} sensor={s} />)}
            </div>
          </section>
          <GasPrediction prediction={prediction} />
          <div className="flex-1 min-h-[180px] flex flex-col [&>section]:flex-1">
            <Alerts alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
}
