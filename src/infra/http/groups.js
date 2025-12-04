import { getToken } from "../../lib/session";

const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchGroups() {
  const res = await fetch(`${API}/api/groups`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error cargando grupos");
  return res.json(); // [{id,name,desc}]
}
