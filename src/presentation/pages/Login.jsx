import { useState } from "react";
import { login } from "../../infra/http/auth";
import { saveToken } from "../../lib/session";

export default function Login({ onLogged, goSignup }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { token } = await login({ emailOrUsername: id, password: pw });
      saveToken(token);
      onLogged?.();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <input className="w-full border p-2 rounded" placeholder="Email o usuario"
          value={id} onChange={e=>setId(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Contraseña"
          value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Entrar</button>
        <p className="text-sm text-center">
          ¿No tenés cuenta?{" "}
          <span onClick={goSignup} className="text-indigo-600 cursor-pointer">Registrate</span>
        </p>
      </form>
    </div>
  );
}
