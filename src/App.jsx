import { useEffect, useState } from "react";
import { getToken, clearToken } from "./lib/session";

import AppLayout from "./presentation/layouts/AppLayout";
import Dashboard from "./presentation/pages/Dashboard";
import Login from "./presentation/pages/Login";
import Signup from "./presentation/pages/Signup";
import ForgotPassword from "./presentation/pages/ForgotPassword";
import ThresholdsPage from "./presentation/pages/ThresholdsPage";
import HistoryPage from "./presentation/pages/HistoryPage";
import AuditPage from "./presentation/pages/AuditPage";
import UsersPage from "./presentation/pages/UsersPage";
import PoolsPage from "./presentation/pages/PoolsPage";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [view, setView] = useState(getToken() ? "dash" : "login");
  const [thVersion, setThVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // 🔐 Cargar usuario + permisos
  useEffect(() => {
    async function loadMe() {
      const token = getToken();
      if (!token) return;

      try {
        const r = await fetch(`${API}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!r.ok) {
          clearToken();
          setCurrentUser(null);
          setView("login");
          return;
        }
        const u = await r.json();
        setCurrentUser(u);
      } catch (err) {
        console.error("Error cargando /me", err);
      }
    }

    loadMe();
  }, []);

  const permissions = currentUser?.permissions || [];

  async function handleLogout() {
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Error llamando /logout", err);
      }
    }

    clearToken();
    setCurrentUser(null);
    setView("login");
  }

  useEffect(() => {
    function onNav(e) {
      setView(e.detail);
    }
    window.addEventListener("nav:go", onNav);
    return () => window.removeEventListener("nav:go", onNav);
  }, []);

  // === VISTAS SIN SESIÓN ===
  if (view === "login")
    return (
      <Login
        onLogged={() => setView("dash")}
        goSignup={() => setView("signup")}
        goForgot={() => setView("forgot")}
      />
    );

  if (view === "signup")
    return (
      <Signup
        onSigned={() => setView("dash")}
        goLogin={() => setView("login")}
      />
    );

  if (view === "forgot")
    return <ForgotPassword goLogin={() => setView("login")} />;

  // Helpers de permisos
  const canViewAudit = permissions.includes("VIEW_AUDIT");
  const canManageUsers = permissions.includes("MANAGE_USERS");
  const canManageThresholds = permissions.includes("MANAGE_THRESHOLDS");
  const canViewHistory = permissions.includes("VIEW_HISTORY");
  const canViewDashboard = permissions.includes("VIEW_DASHBOARD");

  // === VISTAS CON SESIÓN ===
  return (
    <AppLayout onLogout={handleLogout} permissions={permissions}>
      {view === "dash" && (canViewDashboard ? (
        <Dashboard thVersion={thVersion} />
      ) : (
        <div className="p-4 text-sm text-slate-600">
          No tenés permiso para ver el Panel principal.
        </div>
      ))}

      {view === "config" &&
        (canManageThresholds ? (
          <ThresholdsPage
            onSaved={() => {
              setThVersion((v) => v + 1);
              setView("dash");
            }}
          />
        ) : (
          <div className="p-4 text-sm text-slate-600">
            No tenés permiso para configurar umbrales.
          </div>
        ))}

      {view === "history" &&
        (canViewHistory ? (
          <HistoryPage />
        ) : (
          <div className="p-4 text-sm text-slate-600">
            No tenés permiso para ver el historial.
          </div>
        ))}

      {view === "audit" &&
        (canViewAudit ? (
          <AuditPage />
        ) : (
          <div className="p-4 text-sm text-slate-600">
            No tenés permiso para ver Auditorías.
          </div>
        ))}

      {view === "users" &&
        (canManageUsers ? (
          <UsersPage />
        ) : (
          <div className="p-4 text-sm text-slate-600">
            No tenés permiso para gestionar usuarios.
          </div>
        ))}

      {view === "pools" && (
      
        <PoolsPage
          onCreated={() => {
            /* nada aún */
          }}
        />
      )}
    </AppLayout>
  );
}
