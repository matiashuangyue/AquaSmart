const API = import.meta.env.VITE_API_URL;

async function safeJson(res) {
  try { return await res.json(); }
  catch { return null; }
}

export async function signup({ name, email, username, password }) {
  const r = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, username, password })
  });

  const data = await safeJson(r);

  if (!r.ok) {
    throw new Error(data?.error || "Error al registrarse.");
  }

  return data; // { token, user }
}

export async function login({ emailOrUsername, password }) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername, password })
  });

  const data = await safeJson(r);

  if (!r.ok) {
    throw new Error(data?.error || "No se pudo iniciar sesión.");
  }

  return data; // { token, user }
}

export async function me() {
  const r = await fetch(`${API}/api/auth/me`, {
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  });

  const data = await safeJson(r);

  if (!r.ok) throw new Error(data?.error || "No autorizado");

  return data; // { id, username, name, email }
}
