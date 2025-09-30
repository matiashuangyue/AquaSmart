import { useState } from "react";
import { signup } from "../../infra/http/auth";
import { saveToken } from "../../lib/session";

export default function Signup({ onSigned, goLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { token } = await signup({ name, email, username, password: pw });
      saveToken(token);
      onSigned?.();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        <input className="w-full border p-2 rounded" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Contraseña" value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Registrarme</button>
        <p className="text-sm text-center">
          ¿Ya tenés cuenta?{" "}
          <span onClick={goLogin} className="text-indigo-600 cursor-pointer">Ingresá</span>
        </p>
      </form>
    </div>
  );
}
