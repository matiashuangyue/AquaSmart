const API = import.meta.env.VITE_API_URL;
console.log("[AUTH] VITE_API_URL =", API);

async function parseJsonOrText(r) {
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) return r.json();
  const text = await r.text();
  // mostramos los primeros 200 chars para debug
  throw new Error(text.slice(0, 200));
}

export async function signup({ name, email, username, password }) {
  const r = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, username, password })
  });
  if (!r.ok) {
    const err = await parseJsonOrText(r).catch(e => e);
    throw new Error(err.message || "Error signup");
  }
  return r.json(); // { token, user }
}

export async function login({ emailOrUsername, password }) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername, password })
  });
  if (!r.ok) {
    const err = await parseJsonOrText(r).catch(e => e);
    throw new Error(err.message || "Error login");
  }
  return r.json(); // { token, user }
}
