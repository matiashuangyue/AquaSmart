// src/infra/http/pools.js
import { getToken } from "../../lib/session";

const API = import.meta.env.VITE_API_URL;

async function safeJson(res) {
  try { return await res.json(); }
  catch { return null; }
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listMyPools() {
  const r = await fetch(`${API}/api/pools`, {
    method: "GET",
    headers: authHeaders(),
  });

  const data = await safeJson(r);
  if (!r.ok) {
    throw new Error(data?.error || "No se pudieron cargar las piletas.");
  }
  return data; // array de Pool
}

export async function createPool({ name }) {
  const r = await fetch(`${API}/api/pools`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });

  const data = await safeJson(r);
  if (!r.ok) {
    throw new Error(data?.error || "No se pudo crear la pileta.");
  }
  return data; // Pool creado
}

export async function getPool(id) {
  const r = await fetch(`${API}/api/pools/${id}`, {
    method: "GET",
    headers: authHeaders(),
  });

  const data = await safeJson(r);
  if (!r.ok) {
    throw new Error(data?.error || "No se pudo obtener la pileta.");
  }
  return data; // Pool
}

export async function updatePool(id, payload) {
  const r = await fetch(`${API}/api/pools/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await safeJson(r);
  if (!r.ok) {
    throw new Error(data?.error || "No se pudo actualizar la pileta.");
  }
  return data; // Pool actualizado
}
