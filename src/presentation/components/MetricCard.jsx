export default function MetricCard({ title, value, unit, icon, state = "ok" }) {
  const color = state === "danger" ? "danger" : state === "warn" ? "warn" : "ok";
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="p-2 rounded-xl bg-slate-100">{icon}</div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className={`badge bg-${color} text-white`}>{state?.toUpperCase?.() ?? "OK"}</span>
      </div>
      <div className="mt-3">
        <span className="text-3xl font-semibold text-slate-900">{value ?? "—"}</span>
        {unit && <span className="ml-1 text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
