import { useState } from "react";
import { requestPasswordReset } from "../../infra/http/auth";

export default function ForgotPassword({ goLogin }) {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    if (!emailOrUser.trim()) {
      setErr("Ingresá tu email o usuario.");
      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset(emailOrUser.trim());

      setOkMsg(
        "Si la cuenta existe, te enviaremos instrucciones para restablecer la contraseña."
      );
    } catch (e) {
      setErr(e.message || "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-700 flex items-center justify-center px-4 py-6 relative">
      {/* brillo */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff_0,_transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white drop-shadow-lg">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-emerald-200 mt-1">
            Ingresá tu email o usuario para restablecer el acceso a AquaSmart.
          </p>
        </header>

        <div className="grid md:grid-cols-[1fr_0.9fr] gap-6 items-start">
          {/* Card principal */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                A
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  AquaSmart
                </p>
                <h2 className="text-lg font-semibold text-slate-800">
                  ¿Olvidaste tu contraseña?
                </h2>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Email o usuario
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-slate-200"
                  placeholder="ej: admin@aquasmart.com"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  disabled={loading}
                />
              </div>

              {err && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}

              {okMsg && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {okMsg}
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
                {loading ? "Enviando instrucciones..." : "Enviar instrucciones"}
              </button>
            </form>

            <div className="pt-3 text-center text-xs text-slate-600">
              ¿Ya recordaste tu contraseña?{" "}
              <button
                type="button"
                onClick={goLogin}
                className="text-indigo-600 font-medium hover:underline"
              >
                Volver a iniciar sesión
              </button>
            </div>
          </div>

          {/* Lateral informativo */}
          <div className="hidden md:flex flex-col justify-between text-white space-y-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-xl">
              <h3 className="text-sm font-semibold text-emerald-200">
                ¿Cómo funciona el restablecimiento?
              </h3>

              <ol className="mt-3 space-y-2 text-xs text-indigo-100 list-decimal list-inside">
                <li>Ingresás tu email o usuario asociado a AquaSmart.</li>
                <li>El sistema genera un enlace o código temporal.</li>
                <li>Recibís instrucciones por email.</li>
                <li>Definís una nueva contraseña segura (en una implementación completa).</li>
              </ol>

              <div className="mt-4 border-t border-white/20 pt-3 text-xs text-indigo-100/80">
                Este flujo demuestra que el sistema está pensado para una
                recuperación segura de credenciales.
              </div>
            </div>

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
