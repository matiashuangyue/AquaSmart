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

export default function App() {
  const [view, setView] = useState(getToken() ? "dash" : "login");
  const [thVersion, setThVersion] = useState(0);

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

  // === VISTAS CON SESIÓN ===
  return (
    <AppLayout
      onLogout={() => {
        clearToken();
        setView("login");
      }}
    >
      {view === "dash" && <Dashboard thVersion={thVersion} />}
      {view === "config" && (
        <ThresholdsPage
          onSaved={() => {
            setThVersion((v) => v + 1);
            setView("dash");
          }}
        />
      )}
      {view === "history" && <HistoryPage />}
      {view === "audit" && <AuditPage />}
      {view === "users" && <UsersPage />}
      {view === "pools" && (
      <PoolsPage
        onCreated={() => {
          // por ahora solo volvemos al dash o podés dejarlo quieto
          // setView("dash");
        }}
      />
      )}
    </AppLayout>
  );
}
