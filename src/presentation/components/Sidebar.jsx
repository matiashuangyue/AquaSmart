import { Home, History, BarChart3, Settings, LogOut } from "lucide-react";

const Item = ({ icon: Icon, text, ...props }) => (
  <button
    {...props}
    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100"
  >
    <Icon className="w-4 h-4" />
    <span>{text}</span>
  </button>
);

export default function Sidebar({ permissions = [] }) {
  function go(view) {
    window.dispatchEvent(new CustomEvent("nav:go", { detail: view }));
  }

  const canViewDashboard = permissions.includes("VIEW_DASHBOARD");
  const canViewHistory = permissions.includes("VIEW_HISTORY");
  const canViewAudit = permissions.includes("VIEW_AUDIT");
  const canManageUsers = permissions.includes("MANAGE_USERS");
  const canManageThresholds = permissions.includes("MANAGE_THRESHOLDS");

  return (
    <div className="h-full p-4">
      <div className="text-2xl font-bold text-indigo-600 mb-6">AquaSmart</div>
      <nav className="space-y-2 text-slate-700">
        {canViewDashboard && (
          <Item icon={Home} text="Panel principal" onClick={() => go("dash")} />
        )}

        {canViewHistory && (
          <Item icon={History} text="Historial" onClick={() => go("history")} />
        )}

        {/* Piletas: lo dejamos siempre (depende de tu modelo) */}
        <Item icon={BarChart3} text="Piletas" onClick={() => go("pools")} />

        {canManageThresholds && (
          <Item
            icon={Settings}
            text="Configuración"
            onClick={() => go("config")}
          />
        )}

        {canViewAudit && (
          <Item
            icon={BarChart3}
            text="Auditorías"
            onClick={() => go("audit")}
          />
        )}

        {canManageUsers && (
          <Item icon={BarChart3} text="Usuarios" onClick={() => go("users")} />
        )}
      </nav>
    </div>
  );
}