import { useState } from "react";
import { getToken, clearToken } from "./lib/session";

import AppLayout from "./presentation/layouts/AppLayout";      // ⬅️ layout con sidebar+header
import Dashboard from "./presentation/pages/Dashboard";
import Login from "./presentation/pages/Login";
import Signup from "./presentation/pages/Signup";

export default function App() {
  const [view, setView] = useState(getToken() ? "dash" : "login");

  if (view === "login") {
    return <Login onLogged={() => setView("dash")} goSignup={() => setView("signup")} />;
  }

  if (view === "signup") {
    return <Signup onSigned={() => setView("dash")} goLogin={() => setView("login")} />;
  }

  // ⬇️ Cuando está logueado, renderizamos TODO dentro del AppLayout
  return (
    <AppLayout
      onLogout={() => { clearToken(); setView("login"); }}  // opcional: botón salir en el header
    >
      <Dashboard />
    </AppLayout>
  );
}
