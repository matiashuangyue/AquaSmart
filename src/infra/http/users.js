import { getToken } from "../../lib/session";

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchUsers() {
  const res = await fetch(`${API}/api/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando usuarios");
  return res.json();
}

export async function createUser(data) {
  const res = await fetch(`${API}/api/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error creando usuario");
  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`${API}/api/users/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error actualizando usuario");
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API}/api/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando usuario");
  return res.json();
}
