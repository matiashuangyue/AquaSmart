import { Home, History, BarChart3, Settings, LogOut } from "lucide-react";

const Item = ({ icon: Icon, text, active=false }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm
    ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
    <Icon className="w-4 h-4" />
    <span>{text}</span>
  </button>
);

export default function Sidebar() {
  function go(view) {
    window.dispatchEvent(new CustomEvent("nav:go", { detail: view }));
  }

  return (
    <div className="h-full p-4">
      <div className="text-2xl font-bold text-indigo-600 mb-6">AquaSmart</div>
      <nav className="space-y-2 text-slate-700">
        <button onClick={()=>go("dash")} className="w-full text-left block px-3 py-2 rounded-lg hover:bg-slate-100 font-medium">Panel principal</button>
        <button onClick={()=>go("history")} className="w-full text-left block px-3 py-2 rounded-lg hover:bg-slate-100">Historial</button>
        <button onClick={()=>go("audit")} className="w-full text-left block px-3 py-2 rounded-lg hover:bg-slate-100">Auditorías</button>
        <button onClick={()=>go("users")} className="w-full text-left block px-3 py-2 rounded-lg hover:bg-slate-100">Usuarios</button>
        <button onClick={()=>go("pools")} className="w-full text-left block px-3 py-2 rounded-lg hover:bg-slate-100">Piletas</button>
        <button onClick={()=>go("config")} className="w-full text-left block px-3 py-2 rounded-lg hover:bg-slate-100">Configuración</button>
      </nav>
    </div>
  );
}
