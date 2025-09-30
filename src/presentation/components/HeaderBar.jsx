import { UserCircle2 } from "lucide-react";

function nowFmt() {
  const d = new Date();
  const fecha = d.toLocaleDateString("zh-CN-u-ca-chinese", { // muestra ejemplo chino como tu captura
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  });
  const hora = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { fecha, hora };
}

export default function HeaderBar({ onLogout }) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <div className="text-xl font-semibold">Panel de Monitoreo</div>
        <div className="text-indigo-100 text-sm">Hora: {now}</div>
      </div>
      <button
        onClick={onLogout}
        className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm"
      >
        Salir
      </button>
    </div>
  );
}
