export default function StatCard({ title, value, unit, range, state="ok", icon:Icon }) {
  const bar = {
    ok: "bg-emerald-200",
    warn: "bg-amber-200",
    danger: "bg-red-200",
  }[state];
  const chip = {
    ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warn: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-red-100 text-red-700 border-red-200",
  }[state];

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <div className="bg-slate-100 rounded-xl p-2">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      <div className="text-4xl font-semibold text-slate-900">
        {value}<span className="text-lg align-top ml-1 text-slate-500">{unit}</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">{range}</div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${bar}`} style={{ width: state==="ok"? "70%": state==="warn"?"45%":"20%" }} />
      </div>

      <div className={`mt-2 inline-flex items-center text-xs px-2 py-1 rounded-full border ${chip}`}>
        {state === "ok" ? "Normal" : state === "warn" ? "Advertencia" : "Alerta"}
      </div>
    </div>
  );
}
