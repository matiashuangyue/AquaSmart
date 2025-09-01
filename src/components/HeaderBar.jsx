import { UserCircle2 } from "lucide-react";

function nowFmt() {
  const d = new Date();
  const fecha = d.toLocaleDateString("zh-CN-u-ca-chinese", { // muestra ejemplo chino como tu captura
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  });
  const hora = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { fecha, hora };
}

export default function HeaderBar() {
  const { fecha, hora } = nowFmt();
  return (
    <header className="px-4 pt-4">
      <div className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">AquaSmart</div>
            <div className="opacity-90">Panel de Monitoreo</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm opacity-90">{fecha}</div>
              <div className="text-lg font-semibold">{hora}</div>
            </div>
            <div className="bg-white/15 rounded-full p-2">
              <UserCircle2 className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
