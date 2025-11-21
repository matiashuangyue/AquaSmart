import { useState } from "react";
import { login } from "../../infra/http/auth";
import { saveToken } from "../../lib/session";

export default function Login({ onLogged, goSignup, goForgot }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!id.trim() || !pw.trim()) {
      setErr("Ingresá tu email/usuario y contraseña.");
      return;
    }

    try {
      setLoading(true);
      const { token } = await login({ emailOrUsername: id, password: pw });
      saveToken(token);
      onLogged?.();
    } catch (e) {
      setErr(e.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 flex items-center justify-center px-4 py-6 relative">
      {/* Brillo decorativo */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff_0,_transparent_55%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl">

        {/* HEADER */}
        <header className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white drop-shadow-md">
            AquaSmart – Monitoreo Inteligente
          </h1>
          <p className="text-sm text-emerald-200 mt-1">
            Control de parámetros del agua · Alertas · Historial · Usuarios
          </p>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="grid md:grid-cols-[1fr_0.9fr] gap-6 items-center">

          {/* CARD LOGIN */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-6 sm:p-7 relative">
            <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow">
              v1.0.0
            </div>

            <h2 className="text-xl font-semibold text-slate-800 mb-1">Iniciar sesión</h2>
            <p className="text-xs text-slate-500 mb-4">
              Accedé al panel de control para monitorear tus piletas.
            </p>
            <div className="text-right text-[11px] mb-2">
              <button
                type="button"
                onClick={goForgot}
                className="text-indigo-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>


            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Email o usuario</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-slate-200"
                  placeholder="admin@aquasmart.com"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Contraseña</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-slate-200"
                  type="password"
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  disabled={loading}
                />
              </div>

              {err && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-70"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Ingresando..." : "Entrar"}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-600">
              ¿No tenés cuenta?{" "}
              <button
                type="button"
                onClick={goSignup}
                className="text-indigo-600 font-medium hover:underline"
              >
                Registrate
              </button>
              
            </div>
          </div>

          {/* PANEL LATERAL / SESIÓN */}
          <div className="hidden md:flex flex-col justify-between text-white space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl">
              <p className="text-xs uppercase tracking-wide text-emerald-200">Estado del sistema</p>

              <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xl font-bold text-emerald-300">3</p>
                  <p className="text-[11px] text-indigo-100">Piletas activas</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xl font-bold text-amber-300">2</p>
                  <p className="text-[11px] text-indigo-100">Alertas hoy</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xl font-bold text-sky-300">24h</p>
                  <p className="text-[11px] text-indigo-100">Monitoreo</p>
                </div>
              </div>

              <div className="mt-4 border-t border-white/20 pt-3 text-sm text-indigo-100/80">
                Última actualización: <strong>hace 12 min</strong>
                <br />
                Servidor: <strong className="text-emerald-300">Online</strong>
              </div>
            </div>

            {/* FOOTER */}
            <footer className="text-right text-[11px] text-indigo-200/80">
              <p>Proyecto Final · Ingeniería en Sistemas · UAI</p>
              <p className="mt-0.5">
                Creado por <span className="font-semibold text-white">Yue Huang</span>
              </p>
              <a
                href="https://github.com/matiashuangyue/AquaSmart.git"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-emerald-300 hover:underline"
              >
                github.com/matiashuangyue/AquaSmart
              </a>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
