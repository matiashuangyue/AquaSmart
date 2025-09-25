import { AlertTriangle, OctagonAlert, History } from "lucide-react";

const Row = ({ type, title, msg, time }) => {
  const colors = type==="danger"
    ? "bg-red-50 border-red-200 text-red-800"
    : "bg-amber-50 border-amber-200 text-amber-800";
  const Icon = type==="danger" ? OctagonAlert : AlertTriangle;

  return (
    <li className={`flex items-start gap-3 border rounded-xl px-3 py-2 ${colors}`}>
      <Icon className="w-4 h-4 mt-0.5" />
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm opacity-90">{msg}</div>
        <div className="text-xs opacity-70 mt-1">{time}</div>
      </div>
    </li>
  );
};

export default function AlertsPanel({ alerts=[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">Alertas actuales</h3>
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{alerts.length}</span>
      </div>

      <ul className="space-y-2">
        {alerts.length === 0
          ? <li className="text-sm text-slate-500">Sin alertas.</li>
          : alerts.map((a, i) => <Row key={i} {...a} />)}
      </ul>

      <button className="mt-3 w-full border rounded-xl px-3 py-2 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2">
        <History className="w-4 h-4" /> Ver historial de alertas
      </button>
    </div>
  );
}
