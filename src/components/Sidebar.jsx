import { Home, History, BarChart3, Settings, LogOut } from "lucide-react";

const Item = ({ icon: Icon, text, active=false }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm
    ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
    <Icon className="w-4 h-4" />
    <span>{text}</span>
  </button>
);

export default function Sidebar() {
  return (
    <aside className="w-[240px] p-4 bg-white border-r min-h-screen">
      <div className="px-2 py-3 mb-2">
        <div className="text-xl font-semibold text-indigo-700">AquaSmart</div>
      </div>
      <nav className="space-y-1">
        <Item icon={Home} text="Panel principal" active />
        <Item icon={History} text="Historial" />
        <Item icon={BarChart3} text="Estadísticas" />
        <Item icon={Settings} text="Configuración" />
      </nav>
      <div className="mt-6 border-t pt-4">
        <Item icon={LogOut} text="Cerrar sesión" />
      </div>
    </aside>
  );
}
