import { useEffect, useState } from "react";
import { getToken, clearToken } from "./lib/session";

import AppLayout from "./presentation/layouts/AppLayout";
import Dashboard from "./presentation/pages/Dashboard";
import Login from "./presentation/pages/Login";
import Signup from "./presentation/pages/Signup";
import ThresholdsPage from "./presentation/pages/ThresholdsPage";
import HistoryPage from "./presentation/pages/HistoryPage";
import AuditPage from "./presentation/pages/AuditPage";
import UsersPage from "./presentation/pages/UsersPage";

export default function App() {
  const [view, setView] = useState(getToken() ? "dash" : "login");
  const [thVersion, setThVersion] = useState(0); // 👈

  useEffect(() => {
    function onNav(e) { setView(e.detail); }
    window.addEventListener("nav:go", onNav);
    return () => window.removeEventListener("nav:go", onNav);
  }, []);

  if (view === "login") return <Login onLogged={() => setView("dash")} goSignup={() => setView("signup")} />;
  if (view === "signup") return <Signup onSigned={() => setView("dash")} goLogin={() => setView("login")} />;

  return (
    <AppLayout onLogout={() => { clearToken(); setView("login"); }}>
      {view === "dash" && <Dashboard thVersion={thVersion} />} {/* 👈 */}
      {view === "config" && (
        <ThresholdsPage
          onSaved={() => { setThVersion(v => v + 1); setView("dash"); }}  // 👈 bump y volver
        />
      )}
      {view === "history" && <HistoryPage />}
      {view === "audit" && <AuditPage />}
      {view === "users" && <UsersPage />}
    </AppLayout>
  );
}
