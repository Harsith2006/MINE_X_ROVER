export default function MissionInfo({ mission }) {
  const m = mission;
  const cell = (k, v) => (
    <div className="neu-pressed px-3 py-2">
      <p className="text-[10px] text-dim">{k}</p>
      <p className="text-[12px] font-semibold text-white truncate" title={v}>{v ?? "—"}</p>
    </div>
  );
  return (
    <section className="card p-4">
      <h2 className="card-title !text-slate-200 mb-2.5">Mission Information</h2>
      {!m ? <p className="text-[11px] text-dim">Loading…</p> : (
        <div className="grid grid-cols-2 gap-2">
          {cell("Mission ID", m.missionId)}
          {cell("Mission Objective", m.objective)}
          {cell("Start Time", m.startTime ? new Date(m.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—")}
          {cell("Team", m.team)}
          {cell("Target Area", m.targetArea)}
          {cell("Rover ID", m.roverId)}
          <div className="col-span-2 flex items-center justify-between neu-pressed px-3 py-2">
            <span className="text-[10px] text-dim">Mission Status</span>
            <span className="text-[12px] font-bold text-green-400 flex items-center gap-1.5"><span className="live-dot" />{m.status}</span>
          </div>
        </div>
      )}
    </section>
  );
}
