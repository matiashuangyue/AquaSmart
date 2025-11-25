// src/infra/http/users.js
import { getToken } from "../../lib/session";

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = getToken();
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchUsers() {
  const r = await fetch(`${API}/api/users`, {
    headers: authHeaders(),
  });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || "Error cargando usuarios");
  return data; // [{id,email,role,active,createdAt}]
}

export async function createUser(payload) {
  const r = await fetch(`${API}/api/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || "Error creando usuario");
  return data;
}

export async function updateUser(id, payload) {
  const r = await fetch(`${API}/api/users/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await safeJson(r);
  if (!r.ok) throw new Error(data?.error || "Error actualizando usuario");
  return data;
}

export async function deleteUser(id) {
  const r = await fetch(`${API}/api/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) {
    const data = await safeJson(r);
    throw new Error(data?.error || "Error eliminando usuario");
  }
}
