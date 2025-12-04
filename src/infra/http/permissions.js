import { getToken } from "../../lib/session";

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchPermissions() {
  const res = await fetch(`${API}/api/permissions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error cargando permisos");
  return res.json(); // [{id, code, desc}]
}

export async function createPermission(code, desc) {
  const res = await fetch(`${API}/api/permissions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ code, desc }),
  });
  if (!res.ok) throw new Error("Error creando permiso");
  return res.json(); // {id, code, desc}
}

export async function addPermissionToGroup(groupId, code) {
  const res = await fetch(
    `${API}/api/groups/${groupId}/permissions/${code}`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error("Error asignando permiso al grupo");
  return res.json();
}

export async function removePermissionFromGroup(groupId, code) {
  const res = await fetch(
    `${API}/api/groups/${groupId}/permissions/${code}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error("Error quitando permiso del grupo");
  return res.json();
}
